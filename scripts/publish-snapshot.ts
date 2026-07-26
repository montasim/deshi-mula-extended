import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { Db, MongoClient } from 'mongodb';
import {
  CompanyResearch,
  CompanyTheme,
  HiringSignal,
  JobsResponse,
  ResearchLink,
  StoryResult,
  VerificationStatus,
} from '../src/contracts';
import { excerpt, normalizeSearchText, slugFromCompanyUrl } from '../src/text';

type JsonRecord = Record<string, any>;

const argument = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const dryRun = process.argv.includes('--dry-run');
const dataset = resolve(
  argument('--dataset') ||
    process.env.DESHI_MULA_DATASET ||
    '../deshi mula data/github-dataset-release',
);

const jsonl = async (name: string): Promise<JsonRecord[]> =>
  (await readFile(join(dataset, 'data', name), 'utf8'))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as JsonRecord);

const [companiesSource, storiesSource, webProfiles] = await Promise.all([
  jsonl('companies.jsonl'),
  jsonl('stories.jsonl'),
  jsonl('company_web_profiles.jsonl'),
]);
const datasetVersion = String(companiesSource[0]?.dataset_version || 'unknown');
const snapshotDate = String(companiesSource[0]?.source_snapshot_date || new Date().toISOString().slice(0, 10));
const snapshotVersion =
  argument('--version') ||
  `${datasetVersion}-${snapshotDate.replaceAll('-', '')}-${createHash('sha256')
    .update(`${companiesSource.length}:${storiesSource.length}:${webProfiles.length}`)
    .digest('hex')
    .slice(0, 8)}`;

const storySlug = (story: JsonRecord): string | null =>
  story.company_url ? slugFromCompanyUrl(String(story.company_url)) : null;
const storiesByCompany = new Map<string, JsonRecord[]>();
for (const story of storiesSource) {
  const slug = storySlug(story);
  if (!slug) continue;
  const bucket = storiesByCompany.get(slug) || [];
  bucket.push(story);
  storiesByCompany.set(slug, bucket);
}

const webBySlug = new Map(
  webProfiles.map((record) => [String(record.company_slug), record]),
);

const THEME_RULES: Array<[string, string, RegExp]> = [
  ['Job security', 'Layoffs, termination, and stability', /layoff|terminate|termination|ছাঁটাই|বরখাস্ত|job security/giu],
  ['Management', 'Leadership and communication', /management|manager|leadership|ম্যানেজমেন্ট|ম্যানেজার/giu],
  ['Compensation', 'Salary, benefits, and payment', /salary|compensation|benefit|বেতন|স্যালারি/giu],
  ['Work-life balance', 'Hours, workload, and leave', /work.?life|overtime|workload|leave|ছুটি|অতিরিক্ত কাজ/giu],
  ['Learning & growth', 'Learning, mentorship, and progression', /learn|growth|mentor|training|শেখা|ক্যারিয়ার/giu],
  ['Culture', 'Team behavior and workplace environment', /culture|team|environment|সংস্কৃতি|পরিবেশ|টিম/giu],
];

const themesFor = (stories: JsonRecord[]): CompanyTheme[] =>
  THEME_RULES.map(([label, detail, pattern]) => ({
    label,
    detail,
    count: stories.reduce((sum, story) => {
      pattern.lastIndex = 0;
      return sum + Math.min((String(story.body || '').match(pattern) || []).length, 3);
    }, 0),
  }))
    .filter((theme) => theme.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);

const verification = (value: unknown): VerificationStatus =>
  ['verified', 'probable', 'needs_review', 'unresolved'].includes(String(value))
    ? (value as VerificationStatus)
    : 'unresolved';

const companyDocuments: Array<CompanyResearch & { searchName: string; nameAliases: string[] }> =
  companiesSource.map((company) => {
    const slug = String(company.company_slug);
    const web = webBySlug.get(slug) || {};
    const stories = storiesByCompany.get(slug) || [];
    const name = String(web.display_name || company.display_name);
    const sourceName = String(company.display_name);
    const sentiment = {
      positive: Number(company.positive_count || 0),
      mixed: Number(company.mixed_count || 0),
      negative: Number(company.negative_count || 0),
    };
    const themes = themesFor(stories);
    const links: ResearchLink[] = [
      {
        label: 'Deshi Mula profile',
        url: String(company.source_url),
        kind: 'deshimula',
        verification: 'native',
      },
    ];
    for (const [field, label, kind] of [
      ['website_url', 'Official website', 'website'],
      ['linkedin_url', 'LinkedIn', 'linkedin'],
      ['careers_url', 'Career page', 'careers'],
    ] as const) {
      if (web[field]) {
        links.push({
          label,
          url: String(web[field]),
          kind,
          verification: verification(web.verification_status),
        });
      }
    }
    const dominant =
      sentiment.negative > sentiment.positive + sentiment.mixed
        ? 'Recent reports lean negative.'
        : sentiment.positive > sentiment.negative
          ? 'Positive reports are the largest group.'
          : 'Published experiences are mixed.';
    return {
      snapshotVersion,
      snapshotDate,
      slug,
      name,
      sourceName,
      searchName: normalizeSearchText(`${name} ${sourceName} ${slug.replaceAll('-', ' ')}`),
      nameAliases: [...new Set([name, sourceName])],
      brief: {
        headline: `${stories.length} ${stories.length === 1 ? 'story' : 'stories'}. ${dominant}`,
        copy: themes[0]
          ? `${themes[0].label} is the most frequently matched theme in this snapshot. Read individual stories before drawing conclusions.`
          : 'This snapshot does not have enough repeated theme matches for a useful headline.',
        disclaimer:
          'Stories are unverified personal accounts. Counts describe the published snapshot, not an independent verdict about the company.',
      },
      metrics: {
        stories: stories.length,
        rating:
          typeof company.glassdoor_rating === 'number'
            ? company.glassdoor_rating
            : null,
        recommendPercent:
          typeof company.recommend_to_friend_percent === 'number'
            ? company.recommend_to_friend_percent
            : null,
        sentiment,
      },
      themes,
      links,
      verificationStatus: verification(web.verification_status),
      confidence: Number(web.confidence || 0),
    };
  });

const publicStories: Array<
  StoryResult & {
    snapshotVersion: string;
    companySlug: string;
    searchText: string;
    publishedAt: string | null;
  }
> = [];
const privateStories: JsonRecord[] = [];
for (const story of storiesSource) {
  const companySlug = storySlug(story);
  if (!companySlug) continue;
  const common = {
    snapshotVersion,
    companySlug,
    id: String(story.story_id),
    title: String(story.title || ''),
    url: String(story.source_url),
    publishedAt: story.published_at_iso ? String(story.published_at_iso) : null,
  };
  publicStories.push({
    ...common,
    excerpt: excerpt(String(story.excerpt || story.body || ''), 360),
    role: story.job_title ? String(story.job_title) : null,
    date: story.published_at_display ? String(story.published_at_display) : null,
    vibe: String(story.vibe || 'unknown').toLocaleLowerCase('en'),
    reactions: Number(story.upvotes || 0) + Number(story.downvotes || 0),
    comments: Number(story.comments || 0),
    searchText: normalizeSearchText(
      `${story.title || ''} ${story.job_title || ''} ${story.body || ''}`,
    ),
  });
  privateStories.push({ ...common, body: String(story.body || '') });
}

const jobsPath = join(process.cwd(), 'prototype', 'jobs-snapshot.json');
const jobsSource = JSON.parse(await readFile(jobsPath, 'utf8')) as JsonRecord;
const companyBySearch = new Map(
  companyDocuments.flatMap((company) =>
    company.nameAliases.map((name) => [normalizeSearchText(name), company] as const),
  ),
);
const companyByWebsite = new Map(
  companyDocuments.flatMap((company) =>
    company.links
      .filter((link) => link.kind === 'website')
      .map((link) => {
        const host = new URL(link.url).hostname.replace(/^www\./, '');
        return [host, company] as const;
      }),
  ),
);
const hiringDocuments: Array<JobsResponse & { companySlug: string }> = [];
for (const source of jobsSource.companies || []) {
  const websiteHost = source.website
    ? new URL(String(source.website)).hostname.replace(/^www\./, '')
    : '';
  const company =
    companyBySearch.get(normalizeSearchText(String(source.company))) ||
    companyByWebsite.get(websiteHost);
  if (!company) continue;
  const jobs: HiringSignal[] = (source.jobs || []).map(
    (job: JsonRecord, index: number) => {
      const age = Number(job.posted_age_observed_days || 0);
      const detail = [
        job.experience,
        job.employment_type,
        job.location,
        job.workplace,
        job.posted_age_observed
          ? `Posted ${job.posted_age_observed} ago`
          : age
            ? `Listed ${age} days ago`
            : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return {
        id: `${company.slug}-${index + 1}`,
        title: String(job.title),
        detail,
        source:
          job.source === 'official_linkedin_company_post'
            ? 'Official LinkedIn'
            : 'Career page',
        sourceUrl: String(job.source_url),
        observedAt: String(jobsSource.checked_at),
        status: age > 90 ? 'stale' : 'open',
        salaryDisclosure: job.salary_disclosure
          ? String(job.salary_disclosure)
          : null,
      };
    },
  );
  const salary = source.salary_evidence
    ? {
        status:
          source.salary_evidence.published_amount !== null
            ? ('disclosed' as const)
            : ('partial' as const),
        label: String(source.salary_evidence.published_text || 'Partial disclosure'),
        summary: String(source.salary_evidence.notes || 'No numerical range was published.'),
        source: 'Official LinkedIn and career page',
        observedAt: String(jobsSource.checked_at),
      }
    : {
        status: 'unavailable' as const,
        label: 'No sourced salary evidence',
        summary: String(source.notes || 'No salary disclosure is available.'),
        source: null,
        observedAt: String(jobsSource.checked_at),
      };
  hiringDocuments.push({
    snapshotVersion,
    companySlug: company.slug,
    checkedAt: String(jobsSource.checked_at),
    jobs,
    salary,
    careerUrl:
      source.career_page ||
      company.links.find((link) => link.kind === 'careers')?.url ||
      null,
  });
}

const report = {
  dataset: basename(dataset),
  datasetVersion,
  snapshotVersion,
  snapshotDate,
  companies: companyDocuments.length,
  publicStories: publicStories.length,
  privateStories: privateStories.length,
  hiringRecords: hiringDocuments.length,
  verifiedCompanyLinks: companyDocuments.filter(
    (company) => company.verificationStatus === 'verified',
  ).length,
  rawFilesRead: 0,
};

if (companyDocuments.length !== 781 || storiesSource.length !== 2498) {
  throw new Error(`Dataset count validation failed: ${JSON.stringify(report)}`);
}
if (publicStories.length !== privateStories.length) {
  throw new Error('Public/private Story relationship validation failed');
}

if (dryRun) {
  await writeFile(
    join(process.cwd(), 'snapshot-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required to publish');
const client = new MongoClient(uri);
await client.connect();
const db: Db = client.db(process.env.MONGODB_DB || 'deshimula');
const collections = [
  ['companies', companyDocuments],
  ['stories_public', publicStories],
  ['stories_private', privateStories],
  ['hiring_signals', hiringDocuments],
] as const;

try {
  for (const [name, documents] of collections) {
    const collection = db.collection(name);
    await collection.deleteMany({ snapshotVersion });
    if (documents.length) await collection.insertMany(documents, { ordered: false });
  }
  await Promise.all([
    db.collection('companies').createIndex(
      { snapshotVersion: 1, slug: 1 },
      { unique: true },
    ),
    db.collection('companies').createIndex({ snapshotVersion: 1, searchName: 1 }),
    db.collection('stories_public').createIndex({
      snapshotVersion: 1,
      companySlug: 1,
      publishedAt: -1,
    }),
    db.collection('stories_private').createIndex({
      snapshotVersion: 1,
      companySlug: 1,
      publishedAt: -1,
    }),
    db.collection('hiring_signals').createIndex(
      { snapshotVersion: 1, companySlug: 1 },
      { unique: true },
    ),
    db.collection('installations').createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection('ai_usage').createIndex({ tokenHash: 1, day: 1 }, { unique: true }),
    db.collection('ai_requests').createIndex({ requestId: 1 }, { unique: true }),
  ]);
  const counts = {
    companies: await db.collection('companies').countDocuments({ snapshotVersion }),
    publicStories: await db.collection('stories_public').countDocuments({ snapshotVersion }),
    privateStories: await db.collection('stories_private').countDocuments({ snapshotVersion }),
  };
  if (
    counts.companies !== report.companies ||
    counts.publicStories !== report.publicStories ||
    counts.privateStories !== report.privateStories
  ) {
    throw new Error(`MongoDB count validation failed: ${JSON.stringify(counts)}`);
  }
  await db.collection<{ _id: string }>('snapshot_metadata').updateOne(
    { _id: 'active' },
    {
      $set: {
        version: snapshotVersion,
        snapshotDate,
        activatedAt: new Date(),
        counts,
        report,
        publishId: randomUUID(),
      },
    },
    { upsert: true },
  );
  console.log(JSON.stringify({ ...report, activated: true }, null, 2));
} finally {
  await client.close();
}
