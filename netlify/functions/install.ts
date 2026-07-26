import type { Config } from '@netlify/functions';
import { issueInstallation } from './_lib/auth';
import { database } from './_lib/db';
import { json, methodNotAllowed, withErrors } from './_lib/http';

export default withErrors(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed();
  const db = await database();
  const { token } = await issueInstallation(db);
  return json({ token, issuedAt: new Date().toISOString() }, 201);
});

export const config: Config = {
  path: '/api/install',
  rateLimit: { action: 'rate_limit', aggregateBy: ['ip'], windowLimit: 20, windowSize: 60 },
};
