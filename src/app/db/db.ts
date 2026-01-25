import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "./schema/users.js";

console.log("[DB] Initializing database connection...");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[DB] DATABASE_URL is not set!");
  throw new Error("DATABASE_URL environment variable is required");
}

console.log("[DB] Creating postgres client...");
export const postgresClient = postgres(databaseUrl, {
  ssl: "require",
  connect_timeout: 10, // 10 second connection timeout
  idle_timeout: 20, // 20 second idle timeout
  max_lifetime: 60 * 30, // 30 minutes max lifetime
});

console.log("[DB] Creating Drizzle instance...");
export const db = drizzle(postgresClient, { schema: { users } });
console.log("[DB] Database connection initialized successfully");