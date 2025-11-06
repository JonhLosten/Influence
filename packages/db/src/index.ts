import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditLogs, accounts, featureFlags, media, metricsDaily, posts, preferences, profiles, schedules, users } from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultPath = path.resolve(__dirname, '../../.data/influence.sqlite');
export const databasePath = process.env.INFLUENCE_DB_PATH ? path.resolve(process.env.INFLUENCE_DB_PATH) : defaultPath;

const sqlite = new Database(databasePath);
sqlite.pragma('journal_mode = WAL');

export const database = drizzle(sqlite, {
  schema: {
    users,
    profiles,
    accounts,
    posts,
    media,
    schedules,
    metricsDaily,
    auditLogs,
    preferences,
    featureFlags,
  },
});

export type Database = typeof database;
