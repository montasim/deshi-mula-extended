import {
  ApiResult,
  AskResponse,
  BackgroundMessage,
  CompanyResearch,
  JobsResponse,
  StorySearchResponse,
} from '../src/contracts';
import { decodeLeetText, escapeHtml, slugFromCompanyUrl } from '../src/text';

const SUPPORT_WIDGET_SRC = 'https://www.supportkori.com/widget.js';
const SUPPORT_URL = 'https://www.supportkori.com/montasim';
const B4JOIN_URL = 'http://localhost:3001';
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

const ensureSupportKoriWidget = () => {
  if (document.querySelector('script[data-dme-support-kori]')) return;
  const script = document.createElement('script');
  script.src = SUPPORT_WIDGET_SRC;
  script.dataset.id = 'montasim';
  script.dataset.message = 'Support montasim';
  script.dataset.color = '#FFDD00';
  script.dataset.position = 'right';
  script.dataset.dmeSupportKori = 'true';
  document.head.appendChild(script);
};

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
  canonicalName: string | undefined;
  element: HTMLElement;
  trigger: HTMLButtonElement;
}

class ResearchPanel {
  private readonly root: HTMLElement;
  private readonly panel: HTMLElement;
  private readonly backdrop: HTMLElement;
  private active?: Identity;
  private company: CompanyResearch | undefined;
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
          <div class="dme-panel-title"><span>Researching</span><h2 id="dme-panel-company">Company</h2></div>
          <div class="dme-header-actions">
            <a class="dme-support" href="${SUPPORT_URL}" target="_blank" rel="noreferrer" aria-label="Open SupportKori in a new tab">${heartIcon}<span>Support</span></a>
            <button class="dme-icon-button" data-close type="button" aria-label="Close Research">${icon('<path d="m6 6 12 12M18 6 6 18"></path>')}</button>
          </div>
        </header>
        <nav class="dme-nav" aria-label="Company research">
          <button class="is-active" data-tab="brief" type="button">Brief</button>
          <button data-tab="stories" type="button">Stories</button>
          <button data-tab="jobs" type="button">Jobs &amp; salary</button>
          <button data-tab="ask" type="button">Ask</button>
        </nav>
        <div class="dme-scroll" data-scroll>
          <section class="dme-view is-active" data-view="brief"></section>
          <section class="dme-view" data-view="stories" hidden></section>
          <section class="dme-view" data-view="jobs" hidden></section>
          <section class="dme-view" data-view="ask" hidden></section>
        </div>
        <footer class="dme-footer"><span><i></i><b data-snapshot>Connecting to API</b></span><nav><a href="${B4JOIN_URL}" target="_blank" rel="noreferrer">b4join ↗</a><a href="#" data-sources>Sources</a></nav></footer>
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
    this.consentedToAiRetention = await send<boolean>({ type: 'consent:get' });
    this.required<HTMLElement>('#dme-panel-company').textContent =
      identity.sourceName || 'Company';
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
        company.value.name;
      this.renderBrief(company.value);
      this.renderAsk();
      this.required<HTMLElement>('[data-snapshot]').textContent =
        `Dataset snapshot · ${company.value.snapshotDate}`;
    } else {
      this.renderError('brief', company.reason);
      this.renderAsk();
    }
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
      this.root
        .querySelector('[data-link-list]')
        ?.scrollIntoView({ behavior: 'smooth' });
    });
    document.addEventListener('keydown', (event) => {
      if (!this.panel.classList.contains('is-open')) return;
      if (event.key === 'Escape') this.close();
      if (event.key === 'Tab') this.trapFocus(event);
    });
  }

  private select(view: string) {
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      const selected = button.dataset.tab === view;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
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
    (['brief', 'stories', 'jobs', 'ask'] as const).forEach((view) => {
      this.required<HTMLElement>(`[data-view="${view}"]`).innerHTML =
        '<div class="dme-state"><span class="dme-spinner"></span><strong>Loading research</strong><p>The API is assembling the latest published evidence.</p></div>';
    });
    this.required<HTMLElement>('[data-snapshot]').textContent = 'Connecting to API';
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

  private renderWorkSetup(
    company: CompanyResearch | undefined,
    includeEvidence = false,
  ) {
    const record = company?.workArrangement;
    if (!record) {
      return `
        <details class="dme-section dme-work-setup">
          <summary class="dme-work-toggle">
            <span><small>Unverified derived evidence</small><strong>Reported work setup</strong></span>
            <em>Unavailable</em>
            ${chevronIcon}
          </summary>
          <div class="dme-work-content">
            <p class="dme-empty-row">No derived work-arrangement record is available for this company.</p>
          </div>
        </details>`;
    }

    const mode = record.workArrangement.reportedMode;
    const modeLabel =
      mode === 'unknown'
        ? 'No explicit work-mode evidence'
        : mode === 'mixed'
          ? 'Conflicting work-mode reports'
          : `Reported ${mode}`;
    const hours = record.reportedSchedule.dailyHours
      .map((range) =>
        range.minimum === range.maximum
          ? `${range.minimum} hours/day`
          : `${range.minimum}–${range.maximum} hours/day`,
      )
      .join(', ');
    const days = record.reportedSchedule.workdaysPerWeek
      .map((range) =>
        range.minimum === range.maximum
          ? `${range.minimum} days/week`
          : `${range.minimum}–${range.maximum} days/week`,
      )
      .join(', ');
    const signals = [
      hours,
      days,
      record.reportedSchedule.flexibleEvidenceCount
        ? `${record.reportedSchedule.flexibleEvidenceCount} flexible-work mention${record.reportedSchedule.flexibleEvidenceCount === 1 ? '' : 's'}`
        : '',
      record.reportedSchedule.overtimeEvidenceCount
        ? `${record.reportedSchedule.overtimeEvidenceCount} overtime mention${record.reportedSchedule.overtimeEvidenceCount === 1 ? '' : 's'}`
        : '',
      record.reportedSchedule.afterHoursEvidenceCount
        ? `${record.reportedSchedule.afterHoursEvidenceCount} after-hours mention${record.reportedSchedule.afterHoursEvidenceCount === 1 ? '' : 's'}`
        : '',
    ].filter(Boolean);
    const evidence = includeEvidence
      ? record.evidenceMentions
          .slice(0, 3)
          .map(
            (mention) => `
              <a class="dme-work-evidence" href="${escapeHtml(mention.sourceUrl)}" target="_blank" rel="noreferrer">
                <small>Unverified ${escapeHtml(mention.sourceKind)} · ${escapeHtml(mention.role || 'Anonymous')} · ${escapeHtml(mention.publishedAtLabel || 'Date unavailable')}</small>
                <span>“${escapeHtml(mention.excerpt)}”</span>
                ${externalIcon}
              </a>`,
          )
          .join('')
      : '';

    return `
      <details class="dme-section dme-work-setup">
        <summary class="dme-work-toggle">
          <span><small>Unverified derived evidence</small><strong>Reported work setup</strong></span>
          <em>${escapeHtml(record.workArrangement.confidence)} confidence</em>
          ${chevronIcon}
        </summary>
        <div class="dme-work-content">
          <div class="dme-work-summary">
            <article>
              <small>Arrangement</small>
              <strong>${escapeHtml(modeLabel)}</strong>
              <span>${record.workArrangement.evidenceSourceCount} evidence source${record.workArrangement.evidenceSourceCount === 1 ? '' : 's'}</span>
            </article>
            <article>
              <small>Reported schedule</small>
              <strong>${escapeHtml(signals[0] || 'No explicit schedule')}</strong>
              <span>${record.reportedSchedule.evidenceSourceCount} evidence source${record.reportedSchedule.evidenceSourceCount === 1 ? '' : 's'}</span>
            </article>
          </div>
          ${signals.length ? `<div class="dme-work-signals">${signals.map((signal) => `<span>${escapeHtml(signal)}</span>`).join('')}</div>` : `<p class="dme-empty-row">${mode === 'unknown' ? 'The available accounts did not state work mode or schedule clearly enough to extract. Unknown does not mean onsite.' : 'No explicit schedule details were extracted from the available accounts.'}</p>`}
          ${evidence ? `<div class="dme-work-evidence-list">${evidence}</div>` : ''}
          <p class="dme-unverified-note"><strong>Not verified.</strong> ${escapeHtml(record.disclaimer)}</p>
        </div>
      </details>`;
  }

  private renderBrief(company: CompanyResearch) {
    const total = Math.max(company.metrics.stories, 1);
    const sentiment = company.metrics.sentiment;
    const links = company.links
      .map(
        (link) => `
          <a class="dme-source-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
            <span>${escapeHtml(link.label)}</span>
            <small>${escapeHtml(link.verification)}</small>${externalIcon}
          </a>`,
      )
      .join('');
    const questions = company.questions?.length
      ? company.questions
          .slice(0, 5)
          .map(
            (question) => `
              <li><div><strong>${escapeHtml(question.title)}</strong><span>${escapeHtml(question.guidance)}</span></div></li>`,
          )
          .join('')
      : '<li class="dme-empty-row">Open Ask to generate company-specific questions.</li>';
    this.required<HTMLElement>('[data-view="brief"]').innerHTML = `
      <article class="dme-evidence">
        <div class="dme-source-label"><span>Deshi Mula evidence</span><em>Snapshot · ${escapeHtml(company.snapshotDate)}</em></div>
        <h3>${escapeHtml(company.brief.headline)}</h3>
        <p>${escapeHtml(company.brief.copy)}</p>
      </article>
      <div class="dme-metrics">
        <article><span>Stories</span><strong>${company.metrics.stories}</strong></article>
        <article><span>Rating</span><strong>${company.metrics.rating ?? '—'}</strong><small>Glassdoor / 5</small></article>
        <article><span>Recommend</span><strong>${company.metrics.recommendPercent === null ? '—' : `${company.metrics.recommendPercent}%`}</strong><small>Glassdoor</small></article>
      </div>
      <section class="dme-section">
        <div class="dme-section-heading"><div><span>Story mix</span><h3>Published experiences</h3></div><strong>${company.metrics.stories} stories</strong></div>
        <div class="dme-sentiment" aria-label="Story sentiment distribution">
          <span class="positive" style="width:${(sentiment.positive / total) * 100}%"></span>
          <span class="mixed" style="width:${(sentiment.mixed / total) * 100}%"></span>
          <span class="negative" style="width:${(sentiment.negative / total) * 100}%"></span>
        </div>
        <div class="dme-legend"><span><i class="positive"></i>Positive <b>${sentiment.positive}</b></span><span><i class="mixed"></i>Mixed <b>${sentiment.mixed}</b></span><span><i class="negative"></i>Negative <b>${sentiment.negative}</b></span></div>
      </section>
      ${this.renderWorkSetup(company)}
      <section class="dme-section">
        <div class="dme-section-heading"><div><span>Personalized checkpoint</span><h3>Questions to verify</h3></div><strong>${company.questions?.length ?? 0} questions</strong></div>
        <ul class="dme-theme-list">${questions}</ul>
      </section>
      <section class="dme-section" data-link-list>
        <div class="dme-section-heading"><div><span>Verified destinations</span><h3>Continue your research</h3></div></div>
        <div class="dme-source-links">${links || '<p class="dme-empty-row">No verified destinations are available.</p>'}</div>
      </section>
      <p class="dme-disclaimer">${escapeHtml(company.brief.disclaimer)}</p>`;
  }

  private renderStories(response: StorySearchResponse) {
    const view = this.required<HTMLElement>('[data-view="stories"]');
    view.innerHTML = `
      <p class="dme-eyebrow">Source explorer</p>
      <h3 class="dme-view-title">Find the stories that matter.</h3>
      <p class="dme-view-copy">Search title, role, or words inside this company’s published stories.</p>
      <label class="dme-search">${searchIcon}<input data-story-search type="search" placeholder="Search title, role, or word" /></label>
      <div class="dme-story-filters"><button class="is-active" data-vibe="" type="button">Recent</button><button data-vibe="positive" type="button">Positive</button><button data-vibe="mixed" type="button">Mixed</button><button data-vibe="negative" type="button">Negative</button></div>
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
        .map(
          (story) => `
          <a href="${escapeHtml(story.url)}" target="_blank" rel="noreferrer">
            <strong>${escapeHtml(story.title || 'Untitled story')}</strong>
            <span>${escapeHtml(story.role || 'Anonymous')} · ${escapeHtml(story.date || 'Date unavailable')}</span>
            <small><em class="dme-vibe dme-vibe--${escapeHtml(story.vibe)}">${escapeHtml(story.vibe)}</em> ↑ ${story.reactions} · ◌ ${story.comments}</small>
            ${externalIcon}
          </a>`,
        )
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
    const jobs = response.jobs.length
      ? response.jobs
          .map(
            (job) => `
              <a class="dme-job" href="${escapeHtml(job.sourceUrl)}" target="_blank" rel="noreferrer">
                <div><strong>${escapeHtml(job.title)}</strong><span>${escapeHtml(job.detail)}</span></div>
                <em>${escapeHtml(job.source)}</em>${externalIcon}
              </a>`,
          )
          .join('')
      : '<p class="dme-job-empty"><strong>No current hiring signal</strong><span>The API has no verified opening for this snapshot. Use the career page when available.</span></p>';
    this.required<HTMLElement>('[data-view="jobs"]').innerHTML = `
      <p class="dme-eyebrow">Opportunity check</p>
      <h3 class="dme-view-title">Open roles, with workplace context.</h3>
      <p class="dme-view-copy">Hiring comes from sourced listings. Availability can change after the observation date.</p>
      <section class="dme-job-card">
        <div class="dme-source-label"><span>Sourced hiring</span><em>${escapeHtml(response.checkedAt || 'Not checked')}</em></div>
        ${jobs}
        ${response.careerUrl ? `<a class="dme-career-link" href="${escapeHtml(response.careerUrl)}" target="_blank" rel="noreferrer">Open career page ${externalIcon}</a>` : ''}
      </section>
      <section class="dme-section">
        <div class="dme-section-heading"><div><span>Salary evidence</span><h3>${escapeHtml(response.salary.label)}</h3></div></div>
        <article class="dme-salary">
          <span>${escapeHtml(response.salary.status.replace('_', ' '))}</span>
          <p>${escapeHtml(response.salary.summary)}</p>
          <small>${escapeHtml(response.salary.source || 'No source')} ${response.salary.observedAt ? `· ${escapeHtml(response.salary.observedAt)}` : ''}</small>
        </article>
      </section>
      ${this.renderWorkSetup(this.company, true)}`;
  }

  private renderAsk() {
    const companyName = this.company?.name || this.active?.sourceName || 'this company';
    const consented = this.consentedToAiRetention;
    const questions = this.company?.questions || [];
    const questionCards = questions.length
      ? `<section class="dme-question-list"><div class="dme-section-heading"><div><span>Company-specific checkpoint</span><h3>Questions to verify</h3></div><strong>${questions.length} questions</strong></div>${questions
          .map(
            (question) => `<button class="dme-question-card" type="button" data-evidence-question="${escapeHtml(question.title)}"><strong>${escapeHtml(question.title)}</strong><span>${escapeHtml(question.guidance)}</span><small>${escapeHtml(question.rationale)}</small>${question.gap ? `<em>Evidence gap: ${escapeHtml(question.gap)}</em>` : ''}</button>`,
          )
          .join('')}</section>`
      : '<div class="dme-state"><strong>No company-specific questions yet</strong><p>Use Ask to explore the available stories.</p></div>';
    this.required<HTMLElement>('[data-view="ask"]').innerHTML = `
      <p class="dme-eyebrow dme-ask-eyebrow">Cited research</p>
      <h3 class="dme-view-title">Ask another focused question.</h3>
      <p class="dme-view-copy">Relevant story excerpts are sent only after you choose Find answer.</p>
      <div class="dme-ask-prompts" aria-label="Suggested questions">
        <button type="button">What do engineers report?</button>
        <button type="button">What changed recently?</button>
        <button type="button">Show mixed experiences</button>
      </div>
      <form class="dme-ask-form" data-ask-form>
        <label for="dme-research-question">Your question</label>
        <textarea id="dme-research-question" data-question rows="4" maxlength="800" placeholder="Ask about a role, subject, or time period" aria-label="Ask about ${escapeHtml(companyName)}"></textarea>
        ${consented ? '' : `<label class="dme-consent"><input data-consent type="checkbox" /><span>Store my question, prompt, retrieved excerpts, answer, provider metadata, and pseudonymous installation ID indefinitely.</span></label>`}
        <button class="dme-primary" type="submit"><span>Find answer</span>${chevronIcon}</button>
      </form>
      <div data-answer></div>
      <div class="dme-personalized-after-ask">
        <p class="dme-eyebrow">Personalized research</p>
        <h3 class="dme-view-title">Start with this company’s evidence.</h3>
        <p class="dme-view-copy">These questions are generated from ${escapeHtml(companyName)} stories and comments. Select one to ask for a cited answer.</p>
        ${questionCards}
      </div>
    `;
    const view = this.required<HTMLElement>('[data-view="ask"]');
    view.querySelectorAll<HTMLButtonElement>('[data-evidence-question]').forEach((button) =>
      button.addEventListener('click', () => {
        const input = view.querySelector<HTMLTextAreaElement>('[data-question]');
        if (input) {
          input.value = button.dataset.evidenceQuestion || '';
          input.focus();
        }
      }),
    );
    view.querySelectorAll<HTMLButtonElement>('.dme-ask-prompts button').forEach((button) =>
      button.addEventListener('click', () => {
        const input = view.querySelector<HTMLTextAreaElement>('[data-question]');
        if (input) {
          input.value = button.textContent || '';
          input.focus();
        }
      }),
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
      answer.innerHTML = '<p class="dme-inline-error">Confirm the indefinite-retention disclosure to use Ask.</p>';
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
          <div class="dme-source-label"><span>Generated from selected stories</span><em>${response.citations.length} citations · ${escapeHtml(response.provider)}</em></div>
          <div class="dme-answer-copy">${renderAnswerText(response.answer, response.citations)}</div>
          <div class="dme-citations">${response.citations
            .map(
              (citation) => `<a href="${escapeHtml(citation.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(citation.title)}">[${escapeHtml(citation.id)}] <span>${escapeHtml(citation.title)}</span></a>`,
            )
            .join('')}</div>
          <small>This summarizes user reports. Open the cited stories before drawing a conclusion. · Request ${escapeHtml(response.requestId.slice(0, 8))}</small>
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
    element.dataset.dmeCompanySlug = slug;
    element.dataset.dmeSourceName = sourceName;
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
      canonicalName: undefined,
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
        identity.canonicalName = company.name;
        identity.element.textContent = decodeLeetText(company.name);
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
  ensureSupportKoriWidget();
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
