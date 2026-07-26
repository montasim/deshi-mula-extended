import { activeSnapshot, database } from './_lib/db';
import { json, methodNotAllowed, withErrors } from './_lib/http';

export default withErrors(async (request) => {
  if (request.method !== 'GET') return methodNotAllowed();
  const db = await database();
  const snapshot = await activeSnapshot(db);
  return json(
    {
      ok: true,
      service: 'deshi-mula-research-api',
      snapshotVersion: snapshot.version,
      snapshotDate: snapshot.snapshotDate,
    },
    200,
    { 'Cache-Control': 'public, max-age=60' },
  );
});
