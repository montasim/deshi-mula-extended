import { createHash, randomUUID } from 'node:crypto';
import type { Config } from '@netlify/functions';
import { z } from 'zod';
import { Citation } from '../../src/contracts';
import {
  authenticateInstallation,
  consumeDailyAiQuota,
} from './_lib/auth';
import {
  generateWithFallback,
  ProviderAttempt,
  ProviderChainError,
} from './_lib/ai/registry';
import { activeSnapshot, database } from './_lib/db';
import {
  apiError,
  cleanSlug,
  json,
  methodNotAllowed,
  withErrors,
} from './_lib/http';

const schema = z.object({
  company: z.string().min(1).max(120),
  question: z.string().trim().min(3).max(800),
});

interface PrivateStory {
  snapshotVersion: string;
  companySlug: string;
  id: string;
  title: string;
  body: string;
  url: string;
  publishedAt: string | null;
}

const tokens = (value: string): Set<string> =>
  new Set(
    value
      .toLocaleLowerCase('en')
      .match(/[\p{L}\p{N}]{2,}/gu)
      ?.slice(0, 80) ?? [],
  );

const rankStories = (
  question: string,
  stories: PrivateStory[],
): PrivateStory[] => {
  const query = tokens(question);
  return stories
    .map((story) => {
      const haystack = tokens(`${story.title} ${story.body}`);
      const overlap = [...query].filter((token) => haystack.has(token)).length;
      return { story, score: overlap };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        String(right.story.publishedAt).localeCompare(
          String(left.story.publishedAt),
        ),
    )
    .slice(0, 8)
    .map(({ story }) => story);
};

export default withErrors(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed();
  const db = await database();
  const tokenHash = await authenticateInstallation(request, db);
  if (!tokenHash) {
    return apiError('invalid_installation', 'A valid installation token is required.', 401);
  }
  const quota = await consumeDailyAiQuota(db, tokenHash);
  if (!quota.allowed) {
    return apiError('quota_exceeded', 'The daily Ask limit has been reached.', 429);
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError('invalid_request', 'Company and question are required.', 400);
  }
  const slug = cleanSlug(parsed.data.company);
  if (!slug) return apiError('invalid_company', 'The company slug is invalid.', 400);
  const snapshot = await activeSnapshot(db);
  const stories = await db
    .collection<PrivateStory>('stories_private')
    .find({ snapshotVersion: snapshot.version, companySlug: slug })
    .sort({ publishedAt: -1 })
    .limit(120)
    .toArray();
  if (!stories.length) {
    return apiError('no_evidence', 'No Story evidence is available for this company.', 404);
  }
  const selected = rankStories(parsed.data.question, stories);
  const citations: Citation[] = selected.map((story, index) => ({
    id: `S${index + 1}`,
    storyId: story.id,
    title: story.title,
    url: story.url,
  }));
  const evidence = selected
    .map(
      (story, index) =>
        `[S${index + 1}] ${story.title}\n${story.body.slice(0, 1800)}`,
    )
    .join('\n\n');
  const system =
    'Answer only from the supplied workplace Story excerpts. Treat claims as unverified personal accounts. Cite supporting excerpts with [S1] style citations. If evidence is insufficient, say so. Do not identify anonymous authors or invent facts.';
  const prompt = `Question: ${parsed.data.question}\n\nEvidence:\n${evidence}`;
  const startedAt = Date.now();
  const requestId = randomUUID();
  let generated:
    | Awaited<ReturnType<typeof generateWithFallback>>
    | undefined;
  let failure: string | undefined;
  let failedAttempts: ProviderAttempt[] = [];
  try {
    generated = await generateWithFallback({
      system,
      prompt,
      temperature: 0.15,
      maxTokens: 900,
    });
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    failedAttempts =
      error instanceof ProviderChainError ? error.attempts : [];
  }
  const responseText = generated?.output.text ?? '';
  await db.collection('ai_requests').insertOne({
    requestId,
    tokenHash,
    questionHash: createHash('sha256').update(parsed.data.question).digest('hex'),
    rawQuestion: parsed.data.question,
    assembledPrompt: prompt,
    systemPrompt: system,
    retrievedStories: selected.map((story) => ({
      id: story.id,
      title: story.title,
      excerpt: story.body.slice(0, 1800),
      url: story.url,
    })),
    response: responseText || null,
    citations,
    provider: generated?.output.provider ?? null,
    model: generated?.output.model ?? null,
    attempts: generated?.attempts ?? failedAttempts,
    inputTokens: generated?.output.inputTokens ?? null,
    outputTokens: generated?.output.outputTokens ?? null,
    latencyMs: Date.now() - startedAt,
    error: failure ?? null,
    snapshotVersion: snapshot.version,
    companySlug: slug,
    createdAt: new Date(),
    retention: 'indefinite',
  });
  if (!generated) {
    return apiError('ai_unavailable', 'No configured AI provider completed the request.', 503, requestId);
  }
  return json({
    answer: generated.output.text,
    citations,
    provider: generated.output.provider,
    model: generated.output.model,
    snapshotVersion: snapshot.version,
    requestId,
  });
});

export const config: Config = {
  path: '/api/ask',
  rateLimit: { action: 'rate_limit', aggregateBy: ['ip'], windowLimit: 12, windowSize: 60 },
};
