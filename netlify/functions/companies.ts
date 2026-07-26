import { CompanyResearch } from '../../src/contracts';
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

export default withErrors(async (request) => {
  if (request.method !== 'GET') return methodNotAllowed();
  const url = new URL(request.url);
  const db = await database();
  const snapshot = await activeSnapshot(db);
  const collection = db.collection<CompanyResearch & { searchName: string }>(
    'companies',
  );

  const slugValues = (url.searchParams.get('slugs') || '')
    .split(',')
    .map((value) => cleanSlug(value))
    .filter((value): value is string => Boolean(value))
    .slice(0, 50);
  if (slugValues.length) {
    const items = await collection
      .find(
        { snapshotVersion: snapshot.version, slug: { $in: slugValues } },
        { projection: { searchName: 0, _id: 0 } },
      )
      .toArray();
    return json(
      { snapshotVersion: snapshot.version, items },
      200,
      { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    );
  }

  const query = normalizeSearchText(url.searchParams.get('q') || '');
  if (query.length < 2) {
    return apiError('invalid_query', 'Enter at least two characters.', 400);
  }
  const escaped = regexLiteral(query);
  const items = await collection
    .find(
      {
        snapshotVersion: snapshot.version,
        searchName: { $regex: escaped, $options: 'i' },
      },
      { projection: { searchName: 0, _id: 0 } },
    )
    .sort({ confidence: -1, name: 1 })
    .limit(12)
    .toArray();
  return json(
    { snapshotVersion: snapshot.version, items },
    200,
    { 'Cache-Control': 'public, max-age=120' },
  );
});
