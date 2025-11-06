import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const profiles = sqliteTable('profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  displayName: text('display_name').notNull(),
  timezone: text('timezone').default('Europe/Paris'),
  createdAt: integer('created_at').notNull(),
});

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider').notNull(),
  profileId: text('profile_id').notNull(),
  content: text('content').notNull(),
  mediaJson: text('media_json'),
  scheduledAt: integer('scheduled_at'),
  publishedAt: integer('published_at'),
  status: text('status').notNull().default('draft'),
  error: text('error'),
  createdAt: integer('created_at').notNull(),
});

export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => posts.id),
  path: text('path').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  duration: integer('duration'),
  createdAt: integer('created_at').notNull(),
});

export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  postId: integer('post_id').references(() => posts.id),
  runAt: integer('run_at').notNull(),
  status: text('status').notNull().default('pending'),
  lastError: text('last_error'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const metricsDaily = sqliteTable('metrics_daily', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  provider: text('provider').notNull(),
  profileId: text('profile_id').notNull(),
  date: integer('date').notNull(),
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  engagements: integer('engagements').notNull().default(0),
  followers: integer('followers').notNull().default(0),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  payload: text('payload').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const preferences = sqliteTable('preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  key: text('key').notNull(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const featureFlags = sqliteTable('feature_flags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull(),
  enabled: integer('enabled').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});
