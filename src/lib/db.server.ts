import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | undefined;

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  sql ??= neon(connectionString);

  return sql;
}
