export type VerificationStatus =
  | 'verified'
  | 'probable'
  | 'needs_review'
  | 'unresolved';

export interface ResearchLink {
  label: string;
  url: string;
  kind: 'deshimula' | 'website' | 'linkedin' | 'careers' | 'glassdoor';
  verification: VerificationStatus | 'native';
}

export interface CompanyMetrics {
  stories: number;
  rating: number | null;
  recommendPercent: number | null;
  sentiment: {
    positive: number;
    mixed: number;
    negative: number;
  };
}

export interface CompanyTheme {
  label: string;
  detail: string;
  count: number;
}

export type ReportedWorkMode =
  | 'remote'
  | 'onsite'
  | 'hybrid'
  | 'mixed'
  | 'unknown';

export type DerivedConfidence = 'high' | 'medium' | 'low' | 'unknown';

export interface DerivedRange {
  minimum: number;
  maximum: number;
  mentionCount: number;
}

export interface WorkArrangementEvidence {
  sourceKind: 'story' | 'comment';
  sourceId: string;
  storyId: string;
  sourceUrl: string;
  role: string;
  publishedAt: string | null;
  publishedAtLabel: string;
  excerpt: string;
  verificationStatus: 'unverified_personal_account';
}

export interface CompanyWorkArrangement {
  datasetVersion: string;
  derivationVersion: string;
  derivedAt: string;
  companySlug: string;
  displayName: string;
  sourceSnapshotDate: string;
  verificationStatus: 'unverified_derived_data';
  disclaimer: string;
  workArrangement: {
    reportedMode: ReportedWorkMode;
    confidence: DerivedConfidence;
    hasConflictingReports: boolean;
    evidenceSourceCount: number;
    modeEvidenceCounts: {
      remote: number;
      onsite: number;
      hybrid: number;
    };
    remoteRestrictedEvidenceCount: number;
  };
  reportedSchedule: {
    confidence: DerivedConfidence;
    evidenceSourceCount: number;
    dailyHours: DerivedRange[];
    timeRanges: Array<{
      start: string;
      end: string;
      mentionCount: number;
    }>;
    workdaysPerWeek: DerivedRange[];
    flexibleEvidenceCount: number;
    overtimeEvidenceCount: number;
    afterHoursEvidenceCount: number;
  };
  evidencePeriod: {
    start: string | null;
    end: string | null;
  };
  evidenceMentions: WorkArrangementEvidence[];
}

export interface CompanyResearch {
  snapshotVersion: string;
  snapshotDate: string;
  slug: string;
  name: string;
  sourceName: string;
  brief: {
    headline: string;
    copy: string;
    disclaimer: string;
  };
  metrics: CompanyMetrics;
  themes: CompanyTheme[];
  links: ResearchLink[];
  verificationStatus: VerificationStatus;
  confidence: number;
  questions?: EvidenceQuestion[];
  workArrangement?: CompanyWorkArrangement | null;
}

export interface EvidenceQuestion {
  id: string;
  title: string;
  guidance: string;
  rationale: string;
  citations: string[];
  gap?: string;
}

export interface StoryResult {
  id: string;
  title: string;
  excerpt: string;
  role: string | null;
  date: string | null;
  vibe: string;
  reactions: number;
  comments: number;
  url: string;
}

export interface StorySearchResponse {
  snapshotVersion: string;
  total: number;
  items: StoryResult[];
}

export interface HiringSignal {
  id: string;
  title: string;
  detail: string;
  source: string;
  sourceUrl: string;
  observedAt: string;
  status: 'open' | 'stale' | 'unknown';
  salaryDisclosure: string | null;
}

export interface SalaryEvidence {
  status: 'disclosed' | 'partial' | 'not_disclosed' | 'unavailable';
  label: string;
  summary: string;
  source: string | null;
  observedAt: string | null;
}

export interface JobsResponse {
  snapshotVersion: string;
  checkedAt: string | null;
  jobs: HiringSignal[];
  salary: SalaryEvidence;
  careerUrl: string | null;
}

export interface Citation {
  id: string;
  storyId: string;
  title: string;
  url: string;
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  provider: string;
  model: string;
  snapshotVersion: string;
  requestId: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export type ApiRequest =
  | { method: 'GET'; path: string }
  | { method: 'POST'; path: string; body: unknown };

export type BackgroundMessage =
  | { type: 'api'; request: ApiRequest }
  | { type: 'consent:get' }
  | { type: 'consent:set'; consented: boolean };

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}
