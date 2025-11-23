import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import {
  JobStatusSchema,
  VideoPublishPayloadSchema,
  SocialNetworkSchema,
} from "../apps/server/src/publisher";

export const publishingJobs = sqliteTable("publishing_jobs", {
  id: text("id").primaryKey().notNull(),
  payload: text("payload", { mode: "json" })
    .$type<VideoPublishPayloadSchema>()
    .notNull(),
  status: text("status", { enum: JobStatusSchema.options }).notNull(),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  scheduledFor: text("scheduled_for"),
  publishedUrls: text("published_urls", { mode: "json" }).$type<
    Record<z.infer<typeof SocialNetworkSchema>, string>
  >(),
  error: text("error", { mode: "json" }).$type<{
    code: string;
    message: string;
    details?: Record<string, any>;
  }>(),
  retryCount: integer("retry_count").default(0).notNull(),
  lastAttempt: text("last_attempt"),
});
