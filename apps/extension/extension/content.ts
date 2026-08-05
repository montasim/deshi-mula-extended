import {
  ApiResult,
  AskResponse,
  BackgroundMessage,
  CompanyResearch,
  JobsResponse,
  StorySearchResponse,
} from '../src/contracts';
import { decodeLeetText, escapeHtml, slugFromCompanyUrl } from '../src/text';

const SUPPORT_URL = 'https://www.supportkori.com/montasim';
const B4JOIN_URL = 'https://b4joinacompany.netlify.app';
const send = <T>(payload: BackgroundMessage): Promise<T> =>
  chrome.runtime.sendMessage(payload) as Promise<T>;

const api = async <T>(
  request: Extract<BackgroundMessage, { type: 'api' }>['request'],
): Promise<T> => {
  const result = await send<ApiResult<T>>({ type: 'api', request });
  if (!result.ok || result.data === undefined) {
    throw new Error(result.error || 'The research API did not return data.');
  }
  return result.data;
};

const icon = (paths: string): string =>
  `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const brandIcon = `
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M8 7.5h10.5a5.5 5.5 0 0 1 0 11H13"></path>
    <path d="M8 7.5v17M8 24.5h8"></path>
    <path d="m20 22 2.5 2.5L27 19"></path>
  </svg>`;
const searchIcon = icon(
  '<circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path>',
);
const externalIcon = icon(
  '<path d="M14 5h5v5"></path><path d="m19 5-8 8"></path><path d="M17 13v6H5V7h6"></path>',
);
const heartIcon = icon(
  '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"></path>',
);
const chevronIcon = icon('<path d="m9 6 6 6-6 6"></path>');

const renderAnswerInline = (
  value: string,
  citations: AskResponse['citations'],
): string => {
  const byId = new Map(citations.map((citation) => [citation.id, citation]));
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(S\d+)\]/g, (token, id: string) => {
      const citation = byId.get(id);
      return citation
        ? `<a class="dme-inline-citation" href="${escapeHtml(citation.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(citation.title)}">${token}</a>`
        : token;
    });
};

const renderAnswerText = (
  value: string,
  citations: AskResponse['citations'],
): string => {
  const blocks: string[] = [];
  let listType: 'ol' | 'ul' | undefined;
  let items: string[] = [];
  const flushList = () => {
    if (!listType || !items.length) return;
    blocks.push(
      `<${listType}>${items.map((item) => `<li>${item}</li>`).join('')}</${listType}>`,
    );
    listType = undefined;
    items = [];
  };

  value.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      return;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const nextType = unordered ? 'ul' : 'ol';
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      items.push(renderAnswerInline((unordered || ordered)?.[1] || '', citations));
      return;
    }
    flushList();
    const heading = line.match(/^#{1,4}\s+(.+)$/);
    blocks.push(
      heading
        ? `<h4>${renderAnswerInline(heading[1] || line, citations)}</h4>`
        : `<p>${renderAnswerInline(line, citations)}</p>`,
    );
  });
  flushList();
  return blocks.join('');
};

interface Identity {
  slug: string;
  sourceName: string;
  element: HTMLElement;
  trigger: HTMLButtonElement;
}

class ResearchPanel {
  private readonly root: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly backdrop: HTMLElement;
  private active?: Identity;
  private company: CompanyResearch | undefined;
  private jobs: JobsResponse | undefined;
  private consentedToAiRetention = false;
  private requestVersion = 0;
  private storyTimer?: number;

  constructor() {
    this.root = document.createElement('div');
    this.root.dataset.dmeUi = 'research-root';
    this.root.innerHTML = `
      <div class="dme-backdrop" data-backdrop hidden></div>
      <aside class="dme-panel" data-panel role="dialog" aria-modal="true" aria-labelledby="dme-panel-company" aria-hidden="true">
        <header class="dme-panel-header">
          <div class="dme-extension-mark">${brandIcon}</div>
          <div class="dme-panel-title"><span>Inside view</span><h2 id="dme-panel-company">Company</h2></div>
          <div class="dme-header-actions">
            <a class="dme-support" href="${SUPPORT_URL}" target="_blank" rel="noreferrer" aria-label="Support this project">${heartIcon}<span class="dme-visually-hidden">Support</span></a>
            <button class="dme-icon-button" data-close type="button" aria-label="Close company research">${icon('<path d="m6 6 12 12M18 6 6 18"></path>')}</button>
          </div>
        </header>
        <nav class="dme-nav" role="tablist" aria-label="Company research">
          <button class="is-active" data-tab="brief" type="button" role="tab" aria-controls="dme-view-brief">Insights</button>
          <button data-tab="jobs" type="button" role="tab" aria-controls="dme-view-jobs">Pay &amp; roles</button>
          <button data-tab="stories" type="button" role="tab" aria-controls="dme-view-stories">Stories</button>
        </nav>
        <div class="dme-scroll" data-scroll>
          <section class="dme-view is-active" id="dme-view-brief" data-view="brief" role="tabpanel"></section>
          <section class="dme-view" id="dme-view-jobs" data-view="jobs" role="tabpanel" hidden></section>
          <section class="dme-view" id="dme-view-stories" data-view="stories" role="tabpanel" hidden></section>
          <section class="dme-view" id="dme-view-ask" data-view="ask" role="tabpanel" hidden></section>
        </div>
        <footer class="dme-footer"><span><i></i><b data-snapshot>Loading published evidence</b></span><nav><a href="#" data-sources>Sources</a><a href="${B4JOIN_URL}" target="_blank" rel="noreferrer">Open b4join ↗</a></nav></footer>
      </aside>`;
    document.body.append(this.root);
    this.panel = this.required('[data-panel]');
    this.backdrop = this.required('[data-backdrop]');
    this.bind();
  }

  private required<T extends Element = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Research Panel element: ${selector}`);
    return element;
  }

  async open(identity: Identity) {
    this.requestVersion += 1;
    const version = this.requestVersion;
    this.active = identity;
    this.company = undefined;
    this.jobs = undefined;
    this.consentedToAiRetention = await send<boolean>({ type: 'consent:get' });
    this.required<HTMLElement>('#dme-panel-company').textContent =
      decodeLeetText(identity.sourceName || 'Company', identity.slug);
    this.select('brief');
    this.renderLoading();
    this.panel.classList.add('is-open');
    this.panel.setAttribute('aria-hidden', 'false');
    this.backdrop.hidden = false;
    requestAnimationFrame(() => this.backdrop.classList.add('is-open'));
    identity.trigger.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('dme-research-open');
    this.required<HTMLButtonElement>('[data-close]').focus();

    const companyTask = api<CompanyResearch>({
      method: 'GET',
      path: `/company?slug=${encodeURIComponent(identity.slug)}`,
    });
    const storiesTask = api<StorySearchResponse>({
      method: 'GET',
      path: `/stories?company=${encodeURIComponent(identity.slug)}&limit=20`,
    });
    const jobsTask = api<JobsResponse>({
      method: 'GET',
      path: `/jobs?company=${encodeURIComponent(identity.slug)}`,
    });
    const [company, stories, jobs] = await Promise.allSettled([
      companyTask,
      storiesTask,
      jobsTask,
    ]);
    if (version !== this.requestVersion) return;

    if (company.status === 'fulfilled') {
      this.company = company.value;
      this.required<HTMLElement>('#dme-panel-company').textContent =
        decodeLeetText(company.value.name, company.value.slug);
      this.required<HTMLElement>('[data-snapshot]').textContent =
        `Evidence updated ${company.value.snapshotDate}`;
    }
    if (jobs.status === 'fulfilled') this.jobs = jobs.value;

    if (company.status === 'fulfilled') this.renderBrief(company.value);
    else this.renderError('brief', company.reason);

    if (stories.status === 'fulfilled') {
      this.renderStories(stories.value);
    } else {
      this.renderError('stories', stories.reason);
    }

    if (jobs.status === 'fulfilled') {
      this.renderJobs(jobs.value);
    } else {
      this.renderError('jobs', jobs.reason);
    }
  }

  close() {
    this.requestVersion += 1;
    this.panel.classList.remove('is-open');
    this.panel.setAttribute('aria-hidden', 'true');
    this.backdrop.classList.remove('is-open');
    document.documentElement.classList.remove('dme-research-open');
    this.active?.trigger.setAttribute('aria-expanded', 'false');
    this.active?.trigger.focus();
    window.setTimeout(() => {
      if (!this.panel.classList.contains('is-open')) this.backdrop.hidden = true;
    }, 220);
  }

  private bind() {
    this.required('[data-close]').addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) =>
      button.addEventListener('click', () => this.select(button.dataset.tab || 'brief')),
    );
    this.required('[data-sources]').addEventListener('click', (event) => {
      event.preventDefault();
      this.select('brief');
      const sources = this.root.querySelector<HTMLDetailsElement>('[data-link-list]');
      if (sources) {
        sources.open = true;
        sources.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    document.addEventListener('keydown', (event) => {
      if (!this.panel.classList.contains('is-open')) return;
      if (event.key === 'Escape') this.close();
      if (event.key === 'Tab') this.trapFocus(event);
    });
  }

  private select(view: string) {
    this.panel.classList.toggle('is-asking', view === 'ask');
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      const selected = button.dataset.tab === view;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    this.root.querySelectorAll<HTMLElement>('[data-view]').forEach((section) => {
      section.hidden = section.dataset.view !== view;
      section.classList.toggle('is-active', !section.hidden);
    });
    this.required<HTMLElement>('[data-scroll]').scrollTop = 0;
  }

  private trapFocus(event: KeyboardEvent) {
    const focusable = [...this.panel.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])',
    )].filter((element) => !element.closest('[hidden]'));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private renderLoading() {
    (['brief', 'stories', 'jobs'] as const).forEach((view) => {
      this.required<HTMLElement>(`[data-view="${view}"]`).innerHTML =
        '<div class="dme-state"><span class="dme-spinner"></span><strong>Reading published reports</strong><p>Building a company-specific view from the available evidence.</p></div>';
    });
    this.required<HTMLElement>('[data-view="ask"]').innerHTML = '';
    this.required<HTMLElement>('[data-snapshot]').textContent = 'Loading published evidence';
  }

  private renderError(view: string, reason: unknown) {
    const message = reason instanceof Error ? reason.message : 'Research is unavailable.';
    this.required<HTMLElement>(`[data-view="${view}"]`).innerHTML = `
      <div class="dme-state dme-state--error">
        <strong>This section is unavailable</strong>
        <p>${escapeHtml(message)}</p>
        <small>The extension does not substitute stale or guessed data.</small>
      </div>`;
  }

  private openAsk(question = '') {
    this.renderAsk(question);
    this.select('ask');
    window.setTimeout(
      () => this.root.querySelector<HTMLTextAreaElement>('[data-question]')?.focus(),
      0,
    );
  }

  private bindInsightActions() {
    const view = this.required<HTMLElement>('[data-view="brief"]');
    view.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((button) =>
      button.addEventListener('click', () => this.select(button.dataset.jump || 'brief')),
    );
    view.querySelectorAll<HTMLButtonElement>('[data-evidence-question]').forEach((button) =>
      button.addEventListener('click', () =>
        this.openAsk(button.dataset.evidenceQuestion || ''),
      ),
    );
    view.querySelector<HTMLButtonElement>('[data-open-ask]')?.addEventListener(
      'click',
      () => this.openAsk(),
    );
  }

  private renderBrief(company: CompanyResearch) {
    const sentiment = company.metrics.sentiment;
    const totalStories = Math.max(company.metrics.stories, 1);
    const cultureHeadline =
      company.metrics.stories === 0
        ? 'No workplace story is available yet'
        : sentiment.negative > sentiment.positive &&
            sentiment.negative > sentiment.mixed
        ? 'Most published reports raise concerns'
        : sentiment.positive > sentiment.negative &&
            sentiment.positive > sentiment.mixed
          ? 'Most published reports are positive'
          : 'Published reports show mixed experiences';
    const cultureDetail =
      company.metrics.stories === 0
        ? 'No story mix to compare'
        : `${sentiment.positive} positive · ${sentiment.mixed} mixed · ${sentiment.negative} concerning`;

    const arrangement = company.workArrangement;
    const mode = arrangement?.workArrangement.reportedMode ?? 'unknown';
    const modeLabel =
      !arrangement || mode === 'unknown'
        ? 'No clear work setup reported'
        : mode === 'mixed'
          ? 'Conflicting work setups reported'
          : `${mode[0]?.toUpperCase()}${mode.slice(1)} work reported`;
    const workDetails = arrangement
      ? [
          arrangement.reportedSchedule.workdaysPerWeek[0]
            ? `${arrangement.reportedSchedule.workdaysPerWeek[0].minimum === arrangement.reportedSchedule.workdaysPerWeek[0].maximum ? arrangement.reportedSchedule.workdaysPerWeek[0].minimum : `${arrangement.reportedSchedule.workdaysPerWeek[0].minimum}–${arrangement.reportedSchedule.workdaysPerWeek[0].maximum}`} days/week mentioned`
            : '',
          arrangement.reportedSchedule.overtimeEvidenceCount
            ? `${arrangement.reportedSchedule.overtimeEvidenceCount} overtime mentions`
            : '',
          arrangement.reportedSchedule.flexibleEvidenceCount
            ? `${arrangement.reportedSchedule.flexibleEvidenceCount} flexibility mentions`
            : '',
        ].filter(Boolean)
      : [];

    const salaryRoles = this.jobs?.salary.roles.length ?? 0;
    const payHeadline = !this.jobs
      ? 'Salary data is unavailable'
      : salaryRoles
        ? `${salaryRoles} community-reported role range${salaryRoles === 1 ? '' : 's'}`
        : 'No reported salary range';
    const payDetail = this.jobs
      ? this.jobs.salary.summary
      : 'Open Pay & roles to check the available evidence.';

    const questionMarkup = (question: NonNullable<CompanyResearch['questions']>[number]) => `
      <button class="dme-question-card" type="button" data-evidence-question="${escapeHtml(question.title)}">
        <span><strong>${escapeHtml(question.title)}</strong><small>${escapeHtml(question.guidance)}</small></span>
        ${chevronIcon}
      </button>`;
    const questions = company.questions || [];
    const primaryQuestions = questions.slice(0, 3).map(questionMarkup).join('');
    const moreQuestions = questions.slice(3).map(questionMarkup).join('');

    const links = company.links
      .map(
        (link) => `
          <a class="dme-source-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
            <span>${escapeHtml(link.label)}</span>${externalIcon}
          </a>`,
      )
      .join('');

    const glassdoor =
      company.metrics.rating !== null || company.metrics.recommendPercent !== null
        ? `<p class="dme-context-line">Glassdoor context · ${company.metrics.rating === null ? 'rating unavailable' : `${company.metrics.rating}/5`} · ${company.metrics.recommendPercent === null ? 'recommendation unavailable' : `${company.metrics.recommendPercent}% recommend`}</p>`
        : '';

    this.required<HTMLElement>('[data-view="brief"]').innerHTML = `
      <section class="dme-intro">
        <p class="dme-eyebrow">Before you join</p>
        <h3>Know what employees report before you join.</h3>
        <p>A quick, company-specific read from ${company.metrics.stories} published workplace ${company.metrics.stories === 1 ? 'story' : 'stories'}.</p>
      </section>

      <section class="dme-inside-view" aria-labelledby="dme-inside-view-title">
        <div class="dme-inside-heading">
          <div><span>Decision scan</span><h3 id="dme-inside-view-title">The inside view</h3></div>
          <em>Not a verdict</em>
        </div>
        <div class="dme-signal-spine">
          <button class="dme-signal-row" type="button" data-jump="stories">
            <span class="dme-signal-key">Culture</span>
            <span class="dme-signal-copy">
              <strong>${escapeHtml(cultureHeadline)}</strong>
              <span class="dme-story-chart" aria-label="${escapeHtml(cultureDetail)}">
                <i class="is-positive" style="width:${(sentiment.positive / totalStories) * 100}%"></i>
                <i class="is-mixed" style="width:${(sentiment.mixed / totalStories) * 100}%"></i>
                <i class="is-concerning" style="width:${(sentiment.negative / totalStories) * 100}%"></i>
              </span>
              <small>${escapeHtml(cultureDetail)}</small>
            </span>
            ${chevronIcon}
          </button>
          <div class="dme-signal-row">
            <span class="dme-signal-key">Work</span>
            <span class="dme-signal-copy"><strong>${escapeHtml(modeLabel)}</strong><small>${escapeHtml(workDetails.join(' · ') || 'No schedule pattern was clear enough to summarize.')}</small></span>
          </div>
          <button class="dme-signal-row" type="button" data-jump="jobs">
            <span class="dme-signal-key">Pay</span>
            <span class="dme-signal-copy"><strong>${escapeHtml(payHeadline)}</strong><small>${escapeHtml(payDetail)}</small></span>
            ${chevronIcon}
          </button>
        </div>
        ${glassdoor}
      </section>

      <section class="dme-questions">
        <div class="dme-section-heading">
          <div><span>Interview prep</span><h3>Questions worth asking</h3></div>
          <strong>${questions.length}</strong>
        </div>
        <p class="dme-section-copy">Built from themes that repeat in this company’s stories and comments.</p>
        <div class="dme-question-list">
          ${primaryQuestions || '<p class="dme-empty-row">No repeated theme had enough evidence to create a company-specific question.</p>'}
          ${
            moreQuestions
              ? `<details class="dme-more-questions">
                  <summary>Show ${questions.length - 3} more ${questions.length - 3 === 1 ? 'question' : 'questions'}${chevronIcon}</summary>
                  <div>${moreQuestions}</div>
                </details>`
              : ''
          }
        </div>
        <button class="dme-primary dme-primary--wide" type="button" data-open-ask>
          <span>Ask your own question</span>${chevronIcon}
        </button>
      </section>

      <details class="dme-trust" data-link-list>
        <summary><span><strong>How to read this research</strong><small>Personal reports, dates, and source links</small></span>${chevronIcon}</summary>
        <div>
          <p>${escapeHtml(company.brief.disclaimer)}</p>
          <nav aria-label="Company sources">${links || '<span class="dme-empty-row">No source links are available.</span>'}</nav>
        </div>
      </details>`;
    this.bindInsightActions();
  }

  private renderStories(response: StorySearchResponse) {
    const view = this.required<HTMLElement>('[data-view="stories"]');
    view.innerHTML = `
      <section class="dme-intro dme-intro--compact">
        <p class="dme-eyebrow">Published stories</p>
        <h3>Read the reports behind the insights.</h3>
        <p>Search by role or topic, then open any story on Deshi Mula for its full context and comments.</p>
      </section>
      <label class="dme-search">${searchIcon}<input data-story-search type="search" placeholder="Search role, topic, or phrase" /></label>
      <div class="dme-story-filters" aria-label="Filter stories"><button class="is-active" data-vibe="" type="button">All</button><button data-vibe="positive" type="button">Positive</button><button data-vibe="mixed" type="button">Mixed</button><button data-vibe="negative" type="button">Concerning</button></div>
      <div data-story-results></div>`;
    this.paintStories(response);
    view.querySelector<HTMLInputElement>('[data-story-search]')?.addEventListener(
      'input',
      () => this.scheduleStorySearch(),
    );
    view.querySelectorAll<HTMLButtonElement>('[data-vibe]').forEach((button) =>
      button.addEventListener('click', () => {
        view.querySelectorAll('[data-vibe]').forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');
        void this.searchStories();
      }),
    );
  }

  private paintStories(response: StorySearchResponse) {
    const target = this.required<HTMLElement>('[data-story-results]');
    if (!response.items.length) {
      target.innerHTML = '<div class="dme-state"><strong>No matching stories</strong><p>Try a shorter word or another vibe.</p></div>';
      return;
    }
    target.innerHTML = `
      <p class="dme-result-count">${response.total} matching ${response.total === 1 ? 'story' : 'stories'}</p>
      <div class="dme-story-list">${response.items
        .map((story) => {
          const vibeLabel = story.vibe === 'negative' ? 'concerning' : story.vibe;
          return `
          <a href="${escapeHtml(story.url)}" target="_blank" rel="noreferrer">
            <strong>${escapeHtml(story.title || 'Untitled story')}</strong>
            <span>${escapeHtml(story.role || 'Anonymous')} · ${escapeHtml(story.date || 'Date unavailable')}</span>
            <small><em class="dme-vibe dme-vibe--${escapeHtml(story.vibe)}">${escapeHtml(vibeLabel)}</em>${story.reactions} reactions · ${story.comments} comments</small>
            ${externalIcon}
          </a>`;
        })
        .join('')}</div>`;
  }

  private scheduleStorySearch() {
    window.clearTimeout(this.storyTimer);
    this.storyTimer = window.setTimeout(() => void this.searchStories(), 260);
  }

  private async searchStories() {
    if (!this.active) return;
    const query =
      this.root.querySelector<HTMLInputElement>('[data-story-search]')?.value.trim() || '';
    const vibe =
      this.root.querySelector<HTMLButtonElement>('[data-vibe].is-active')?.dataset.vibe || '';
    const target = this.required<HTMLElement>('[data-story-results]');
    target.innerHTML = '<div class="dme-state"><span class="dme-spinner"></span><strong>Searching stories</strong></div>';
    try {
      const response = await api<StorySearchResponse>({
        method: 'GET',
        path: `/stories?company=${encodeURIComponent(this.active.slug)}&q=${encodeURIComponent(query)}&vibe=${encodeURIComponent(vibe)}&limit=30`,
      });
      this.paintStories(response);
    } catch (error) {
      target.innerHTML = `<div class="dme-state dme-state--error"><strong>Search unavailable</strong><p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p></div>`;
    }
  }

  private renderJobs(response: JobsResponse) {
    const formatBdt = (value: number) =>
      `৳${new Intl.NumberFormat('en-BD', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(value)}`;
    const salaryRoleItems = response.salary.roles || [];
    const maximumSalary = Math.max(
      ...salaryRoleItems.map((role) => role.maximumBdt),
      1,
    );
    const salaryRows = (
      roles: typeof salaryRoleItems,
      className = '',
    ) =>
      roles
        .map((role) => {
          const left = (role.minimumBdt / maximumSalary) * 100;
          const width = Math.max(
            ((role.maximumBdt - role.minimumBdt) / maximumSalary) * 100,
            2.5,
          );
          return `
            <article class="dme-range-row ${className}">
              <div class="dme-range-label">
                <strong>${escapeHtml(role.role)}</strong>
                <span>${escapeHtml(formatBdt(role.minimumBdt))}–${escapeHtml(formatBdt(role.maximumBdt))}</span>
              </div>
              <div class="dme-range-track" role="img" aria-label="${escapeHtml(role.role)} reported range ${escapeHtml(formatBdt(role.minimumBdt))} to ${escapeHtml(formatBdt(role.maximumBdt))}">
                <i style="left:${left}%;width:${width}%"></i>
              </div>
              <small>${role.sampleSize ? `${role.sampleSize.toLocaleString()} contributor${role.sampleSize === 1 ? '' : 's'}` : 'Contributor count unavailable'}${role.bonus ? ` · ${role.bonus.reportedCount}/${role.bonus.answeredCount} reported a bonus` : ''}</small>
            </article>`;
        })
        .join('');

    const primarySalaryRows = salaryRows(salaryRoleItems.slice(0, 6));
    const remainingSalaryRows = salaryRows(salaryRoleItems.slice(6), 'is-secondary');

    const specificJobs = response.jobs.filter(
      (job) =>
        !(
          response.careerUrl &&
          job.sourceUrl === response.careerUrl &&
          /career|opening/i.test(job.title)
        ),
    );
    const jobs = specificJobs.length
      ? specificJobs
          .map(
            (job) => `
              <a class="dme-job" href="${escapeHtml(job.sourceUrl)}" target="_blank" rel="noreferrer">
                <div><strong>${escapeHtml(job.title)}</strong><span>${escapeHtml(job.detail)}</span></div>
                <em>${escapeHtml(job.source)}</em>${externalIcon}
              </a>`,
          )
          .join('')
      : response.careerUrl
        ? `<a class="dme-career-cta" href="${escapeHtml(response.careerUrl)}" target="_blank" rel="noreferrer">
            <span><strong>Check current openings</strong><small>Open the company’s careers page</small></span>${externalIcon}
          </a>`
        : '<p class="dme-job-empty"><strong>No current opening found</strong><span>No sourced vacancy or careers page is available in this snapshot.</span></p>';

    const checkedAt = response.checkedAt
      ? new Intl.DateTimeFormat('en-BD', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(response.checkedAt))
      : 'Date unavailable';
    this.required<HTMLElement>('[data-view="jobs"]').innerHTML = `
      <section class="dme-intro dme-intro--compact">
        <p class="dme-eyebrow">Pay &amp; roles</p>
        <h3>Compare reported pay before you negotiate.</h3>
        <p>Community-submitted ranges are shown on one scale. Confirm the amount and pay period in writing.</p>
      </section>

      <section class="dme-pay-view">
        <div class="dme-section-heading">
          <div><span>Reported salary</span><h3>${escapeHtml(response.salary.label)}</h3></div>
          <strong>${salaryRoleItems.length} ${salaryRoleItems.length === 1 ? 'role' : 'roles'}</strong>
        </div>
        <p class="dme-section-copy">${escapeHtml(response.salary.summary)}</p>
        ${
          salaryRoleItems.length
            ? `<div class="dme-range-scale" aria-hidden="true"><span>৳0</span><i></i><span>${escapeHtml(formatBdt(maximumSalary))}</span></div>
              <div class="dme-range-chart">${primarySalaryRows}</div>
              ${
                remainingSalaryRows
                  ? `<details class="dme-more-ranges">
                      <summary>Show ${salaryRoleItems.length - 6} more ${salaryRoleItems.length - 6 === 1 ? 'role' : 'roles'}${chevronIcon}</summary>
                      <div class="dme-range-chart">${remainingSalaryRows}</div>
                    </details>`
                  : ''
              }`
            : '<div class="dme-empty-panel"><strong>No salary ranges yet</strong><p>The current dataset has no community-submitted pay evidence for this company.</p></div>'
        }
        <details class="dme-data-note">
          <summary>How to read these ranges${chevronIcon}</summary>
          <div>
            <p>${escapeHtml(response.salary.disclaimer || 'Salary evidence is not independently verified; confirm directly with the company.')}</p>
            ${response.salary.sourceUrl ? `<a href="${escapeHtml(response.salary.sourceUrl)}" target="_blank" rel="noreferrer">Open ${escapeHtml(response.salary.source || 'salary source')} ${externalIcon}</a>` : ''}
          </div>
        </details>
      </section>

      <section class="dme-openings">
        <div class="dme-section-heading">
          <div><span>Hiring now</span><h3>Current openings</h3></div>
          <strong>Checked ${escapeHtml(checkedAt)}</strong>
        </div>
        <div class="dme-job-card">${jobs}</div>
      </section>`;
  }

  private renderAsk(prefill = '') {
    const companyName = decodeLeetText(
      this.company?.name || this.active?.sourceName || 'this company',
      this.active?.slug,
    );
    const consented = this.consentedToAiRetention;
    const storyCount = this.company?.metrics.stories ?? 0;
    this.required<HTMLElement>('[data-view="ask"]').innerHTML = `
      <button class="dme-back" type="button" data-ask-back>${icon('<path d="m15 18-6-6 6-6"></path>')}<span>Back to insights</span></button>
      <section class="dme-intro dme-intro--ask">
        <p class="dme-eyebrow">Ask the evidence</p>
        <h3>What do you want to know about ${escapeHtml(companyName)}?</h3>
        <p>The answer searches ${storyCount || 'the available'} published ${storyCount === 1 ? 'story' : 'stories'} and comments, then links every supporting source.</p>
      </section>
      <form class="dme-ask-form" data-ask-form>
        <label for="dme-research-question">Question to verify</label>
        <textarea id="dme-research-question" data-question rows="4" maxlength="800" placeholder="Example: How often is overtime mentioned?" aria-label="Ask about ${escapeHtml(companyName)}">${escapeHtml(prefill)}</textarea>
        ${consented ? '' : `<label class="dme-consent"><input data-consent type="checkbox" /><span>Allow b4join to store this question, the cited excerpts, answer, and anonymous installation ID indefinitely.</span></label>`}
        <button class="dme-primary dme-primary--wide" type="submit"><span>Search company evidence</span>${chevronIcon}</button>
      </form>
      <div data-answer></div>
    `;
    const view = this.required<HTMLElement>('[data-view="ask"]');
    view.querySelector<HTMLButtonElement>('[data-ask-back]')?.addEventListener(
      'click',
      () => this.select('brief'),
    );
    view.querySelector<HTMLFormElement>('[data-ask-form]')?.addEventListener(
      'submit',
      (event) => void this.ask(event),
    );
  }

  private async ask(event: SubmitEvent) {
    event.preventDefault();
    if (!this.active) return;
    const form = event.currentTarget as HTMLFormElement;
    const question = form.querySelector<HTMLTextAreaElement>('[data-question]')?.value.trim() || '';
    const consent = form.querySelector<HTMLInputElement>('[data-consent]');
    const answer = this.required<HTMLElement>('[data-answer]');
    if (question.length < 3) {
      answer.innerHTML = '<p class="dme-inline-error">Enter a specific question first.</p>';
      return;
    }
    if (consent && !consent.checked) {
      answer.innerHTML = '<p class="dme-inline-error">Confirm the storage choice before searching the evidence.</p>';
      return;
    }
    if (consent) {
      this.consentedToAiRetention = await send<boolean>({
        type: 'consent:set',
        consented: true,
      });
    }
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) button.disabled = true;
    answer.innerHTML = '<div class="dme-state"><span class="dme-spinner"></span><strong>Reading the evidence</strong><p>This can take a few seconds.</p></div>';
    try {
      const response = await api<AskResponse>({
        method: 'POST',
        path: '/ask',
        body: { company: this.active.slug, question },
      });
      answer.innerHTML = `
        <article class="dme-answer">
          <div class="dme-source-label"><span>Answer from published reports</span><em>${response.citations.length} ${response.citations.length === 1 ? 'source' : 'sources'}</em></div>
          <div class="dme-answer-copy">${renderAnswerText(response.answer, response.citations)}</div>
          <div class="dme-citations">${response.citations
            .map(
              (citation) => `<a href="${escapeHtml(citation.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(citation.title)}">[${escapeHtml(citation.id)}] <span>${escapeHtml(citation.title)}</span></a>`,
            )
            .join('')}</div>
          <small>This summarizes personal reports. Open the cited stories before drawing a conclusion.</small>
        </article>`;
      consent?.closest('.dme-consent')?.remove();
    } catch (error) {
      answer.innerHTML = `<div class="dme-state dme-state--error"><strong>Ask could not complete</strong><p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p></div>`;
    } finally {
      if (button) button.disabled = false;
    }
  }
}

let panel: ResearchPanel;
const identities = new Map<string, Identity[]>();
let scanTimer: number | undefined;

const nameElementFor = (anchor: HTMLAnchorElement): HTMLElement | null => {
  const anchorText = anchor.textContent?.trim();
  if (anchorText && anchorText.length < 120) return anchor;

  const siblingName = [...(anchor.parentElement?.children ?? [])].find(
    (candidate): candidate is HTMLElement =>
      candidate instanceof HTMLElement &&
      candidate !== anchor &&
      candidate.tagName === 'SPAN' &&
      Boolean(candidate.textContent?.trim()),
  );
  if (siblingName) return siblingName;

  return (
    anchor.closest('article,section,li,div')?.querySelector<HTMLElement>('h1,h2,h3,h4,h5') ??
    null
  );
};

const discover = (): Identity[] => {
  const found: Identity[] = [];
  document.querySelectorAll<HTMLAnchorElement>('a[href*="/companies/"]').forEach((anchor) => {
    if (anchor.closest('[data-dme-ui]')) return;
    const slug = slugFromCompanyUrl(anchor.href);
    const element = nameElementFor(anchor);
    if (!slug || !element || element.dataset.dmeCompanySlug) return;
    const sourceName = element.textContent?.trim() || slug;
    const displayName = decodeLeetText(sourceName, slug);
    element.dataset.dmeCompanySlug = slug;
    element.dataset.dmeSourceName = sourceName;
    element.textContent = displayName;
    if (displayName !== sourceName) {
      element.title = `Originally shown as ${sourceName}`;
    }
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dme-research-trigger';
    trigger.dataset.dmeUi = 'trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = `${searchIcon}<span>Research</span>`;
    const identity: Identity = {
      slug,
      sourceName,
      element,
      trigger,
    };
    trigger.addEventListener('click', (event) => {
      if (!event.isTrusted) return;
      event.preventDefault();
      event.stopPropagation();
      void panel.open(identity);
    });
    element.insertAdjacentElement('afterend', trigger);
    found.push(identity);
  });
  return found;
};

const hydrate = async (found: Identity[]) => {
  found.forEach((identity) => {
    const existing = identities.get(identity.slug) || [];
    existing.push(identity);
    identities.set(identity.slug, existing);
  });
  const slugs = [...new Set(found.map((identity) => identity.slug))];
  if (!slugs.length) return;
  try {
    const response = await api<{ items: CompanyResearch[] }>({
      method: 'GET',
      path: `/companies?slugs=${encodeURIComponent(slugs.join(','))}`,
    });
    response.items.forEach((company) => {
      (identities.get(company.slug) || []).forEach((identity) => {
        identity.element.textContent = decodeLeetText(company.name, company.slug);
        identity.element.title =
          company.name === company.sourceName
            ? ''
            : `Originally shown as ${company.sourceName}`;
      });
    });
  } catch {
    // The trigger remains useful and opens a specific recoverable API state.
  }
};

const scan = () => void hydrate(discover());
const scheduleScan = () => {
  if (scanTimer !== undefined) return;
  scanTimer = window.setTimeout(() => {
    scanTimer = undefined;
    scan();
  }, 100);
};

const initialize = () => {
  panel = new ResearchPanel();
  scan();
  new MutationObserver((mutations) => {
    if (
      mutations.some(
        (mutation) =>
          !(mutation.target instanceof Element && mutation.target.closest('[data-dme-ui]')),
      )
    ) {
      scheduleScan();
    }
  }).observe(document.body, { childList: true, subtree: true });
};

initialize();
