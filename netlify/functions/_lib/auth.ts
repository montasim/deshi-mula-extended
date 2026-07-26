import { createHash, randomBytes } from 'node:crypto';
import { Db } from 'mongodb';

export interface Installation {
  tokenHash: string;
  createdAt: Date;
  lastSeenAt: Date;
  revoked: boolean;
}

const pepper = (): string => {
  const value = process.env.INSTALL_TOKEN_PEPPER;
  if (!value) throw new Error('INSTALL_TOKEN_PEPPER is not configured');
  return value;
};

export const hashInstallationToken = (token: string): string =>
  createHash('sha256').update(`${pepper()}:${token}`).digest('hex');

export const issueInstallation = async (
  db: Db,
): Promise<{ token: string; tokenHash: string }> => {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashInstallationToken(token);
  const now = new Date();
  await db.collection<Installation>('installations').insertOne({
    tokenHash,
    createdAt: now,
    lastSeenAt: now,
    revoked: false,
  });
  return { token, tokenHash };
};

export const authenticateInstallation = async (
  request: Request,
  db: Db,
): Promise<string | null> => {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice(7).trim()
    : '';
  if (!token || token.length < 30) return null;
  const tokenHash = hashInstallationToken(token);
  const installation = await db
    .collection<Installation>('installations')
    .findOneAndUpdate(
      { tokenHash, revoked: false },
      { $set: { lastSeenAt: new Date() } },
      { returnDocument: 'after' },
    );
  return installation ? tokenHash : null;
};

export const consumeDailyAiQuota = async (
  db: Db,
  tokenHash: string,
): Promise<{ allowed: boolean; used: number; limit: number }> => {
  const limit = Number(process.env.AI_DAILY_LIMIT || 40);
  const day = new Date().toISOString().slice(0, 10);
  const result = await db.collection('ai_usage').findOneAndUpdate(
    { tokenHash, day },
    {
      $inc: { requests: 1 },
      $setOnInsert: { createdAt: new Date() },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' },
  );
  const used = Number(result?.requests || 1);
  return { allowed: used <= limit, used, limit };
};
