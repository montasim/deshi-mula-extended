import { JobsResponse } from '../../src/contracts';
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
  const slug = cleanSlug(new URL(request.url).searchParams.get('company'));
  if (!slug) return apiError('invalid_company', 'A valid company slug is required.', 400);
  const db = await database();
  const snapshot = await activeSnapshot(db);
  const record = await db.collection<JobsResponse & { companySlug: string }>(
    'hiring_signals',
  ).findOne(
    { snapshotVersion: snapshot.version, companySlug: slug },
    { projection: { _id: 0, companySlug: 0 } },
  );
  const response: JobsResponse =
    record ??
    {
      snapshotVersion: snapshot.version,
      checkedAt: null,
      jobs: [],
      salary: {
        status: 'unavailable',
        label: 'No sourced salary evidence',
        summary: 'No current salary disclosure is published in this snapshot.',
        source: null,
        observedAt: null,
      },
      careerUrl: null,
    };
  return json(response, 200, {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800',
  });
});
