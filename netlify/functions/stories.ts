import { StoryResult } from '../../src/contracts';
import { normalizeSearchText } from '../../src/text';
import { activeSnapshot, database } from './_lib/db';
import {
  apiError,
  cleanSlug,
  json,
  methodNotAllowed,
  regexLiteral,
  withErrors,
} from './_lib/http';

interface PublicStory extends StoryResult {
  snapshotVersion: string;
  companySlug: string;
  searchText: string;
  publishedAt: string | null;
}

export default withErrors(async (request) => {
  if (request.method !== 'GET') return methodNotAllowed();
  const url = new URL(request.url);
  const slug = cleanSlug(url.searchParams.get('company'));
  if (!slug) return apiError('invalid_company', 'A valid company slug is required.', 400);
  const query = normalizeSearchText(url.searchParams.get('q') || '');
  const vibe = (url.searchParams.get('vibe') || '').toLocaleLowerCase('en');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 20), 1), 50);
  const db = await database();
  const snapshot = await activeSnapshot(db);
  const filter: Record<string, unknown> = {
    snapshotVersion: snapshot.version,
    companySlug: slug,
  };
  if (query) filter.searchText = { $regex: regexLiteral(query), $options: 'i' };
  if (['positive', 'mixed', 'negative'].includes(vibe)) filter.vibe = vibe;
  const collection = db.collection<PublicStory>('stories_public');
  const [items, total] = await Promise.all([
    collection
      .find(filter, { projection: { _id: 0, searchText: 0, companySlug: 0 } })
      .sort({ publishedAt: -1, id: -1 })
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);
  return json(
    { snapshotVersion: snapshot.version, total, items },
    200,
    { 'Cache-Control': 'public, max-age=120' },
  );
});
