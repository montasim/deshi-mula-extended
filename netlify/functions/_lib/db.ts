import { Db, MongoClient } from 'mongodb';

declare global {
  var __dmeMongoClient: Promise<MongoClient> | undefined;
}

const connection = (): Promise<MongoClient> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  globalThis.__dmeMongoClient ??= new MongoClient(uri, {
    maxPoolSize: 8,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5_000,
  }).connect();
  return globalThis.__dmeMongoClient;
};

export const database = async (): Promise<Db> => {
  const client = await connection();
  return client.db(process.env.MONGODB_DB || 'deshimula');
};

export interface ActiveSnapshot {
  version: string;
  snapshotDate: string;
  activatedAt: Date;
  counts: {
    companies: number;
    publicStories: number;
    privateStories: number;
  };
}

export const activeSnapshot = async (db: Db): Promise<ActiveSnapshot> => {
  const snapshot = await db
    .collection<ActiveSnapshot>('snapshot_metadata')
    .findOne({ _id: 'active' } as never);
  if (!snapshot) throw new Error('No Published Snapshot is active');
  return snapshot;
};
