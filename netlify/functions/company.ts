import { CompanyResearch } from '../../src/contracts';
import { activeSnapshot, database } from './_lib/db';
import {
  apiError,
  cleanSlug,
  json,
  methodNotAllowed,
  withErrors,
} from './_lib/http';

export default withErrors(async (request) => {
  if (request.method !== 'GET') return methodNotAllowed();
  const slug = cleanSlug(new URL(request.url).searchParams.get('slug'));
  if (!slug) return apiError('invalid_company', 'A valid company slug is required.', 400);
  const db = await database();
  const snapshot = await activeSnapshot(db);
  const company = await db.collection<CompanyResearch>('companies').findOne(
    { snapshotVersion: snapshot.version, slug },
    { projection: { _id: 0, searchName: 0 } },
  );
  if (!company) {
    return apiError('company_not_found', 'No published company record was found.', 404);
  }
  return json(company, 200, {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    ETag: `"company-${snapshot.version}-${slug}"`,
  });
});
