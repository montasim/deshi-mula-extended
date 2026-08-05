export interface ResearchLink {
  label: string;
  url: string;
  verification:
    | 'verified'
    | 'probable'
    | 'needs_review'
    | 'unresolved'
    | 'native';
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
}

export interface WorkArrangementEvidence {
  sourceKind: 'story' | 'comment';
  sourceUrl: string;
  role: string;
  publishedAtLabel: string;
  excerpt: string;
}

export interface CompanyWorkArrangement {
  disclaimer: string;
  workArrangement: {
    reportedMode: ReportedWorkMode;
    confidence: DerivedConfidence;
    evidenceSourceCount: number;
  };
  reportedSchedule: {
    evidenceSourceCount: number;
    dailyHours: DerivedRange[];
    workdaysPerWeek: DerivedRange[];
    flexibleEvidenceCount: number;
    overtimeEvidenceCount: number;
    afterHoursEvidenceCount: number;
  };
  evidenceMentions: WorkArrangementEvidence[];
}

export interface EvidenceQuestion {
  title: string;
  guidance: string;
  rationale: string;
  gap?: string;
}

export interface CompanyResearch {
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
  links: ResearchLink[];
  questions?: EvidenceQuestion[];
  workArrangement?: CompanyWorkArrangement | null;
}

export interface StoryResult {
  title: string;
  role: string | null;
  date: string | null;
  vibe: string;
  reactions: number;
  comments: number;
  url: string;
}

export interface StorySearchResponse {
  total: number;
  items: StoryResult[];
}

export interface HiringSignal {
  title: string;
  detail: string;
  source: string;
  sourceUrl: string;
}

export interface SalaryEvidence {
  status: 'unverified' | 'unavailable';
  label: string;
  summary: string;
  source: string | null;
  sourceUrl: string | null;
  observedAt: string | null;
  verificationStatus: 'unverified_user_submitted' | null;
  disclaimer: string;
  roles: SalaryRoleEvidence[];
}

export interface SalaryRoleEvidence {
  id: string;
  role: string;
  minimumBdt: number;
  maximumBdt: number;
  currency: 'BDT';
  payPeriod: 'unspecified';
  sampleSize: number | null;
  bonus: {
    reportedCount: number;
    answeredCount: number;
    mostCommonFrequency: string | null;
  } | null;
  sourceUrl: string;
  verificationStatus: 'unverified_user_submitted';
}

export interface JobsResponse {
  checkedAt: string | null;
  jobs: HiringSignal[];
  salary: SalaryEvidence;
  careerUrl: string | null;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  provider: string;
  requestId: string;
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
