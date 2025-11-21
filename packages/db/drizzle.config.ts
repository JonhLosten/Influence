import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts", // Path to your Drizzle schema file
  out: "./drizzle", // Directory for migration files
  driver: "better-sqlite", // Or 'sqlite', depending on your driver
  dialect: "sqlite", // Specify the dialect
  dbCredentials: {
    url: "sqlite.db", // This will be overridden at runtime for the actual app
  },
  verbose: true,
  strict: true,
} satisfies Config;
