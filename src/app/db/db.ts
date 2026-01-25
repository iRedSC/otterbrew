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
// Let the connection string handle SSL configuration
// Many managed databases (like Railway, Supabase, etc.) configure SSL via URL params
export const postgresClient = postgres(databaseUrl, {
  connect_timeout: 10, // 10 second connection timeout
  idle_timeout: 20, // 20 second idle timeout
  max_lifetime: 60 * 30, // 30 minutes max lifetime
  onnotice: () => {}, // Suppress notices
  // Don't set ssl option - let connection string handle it
  // If SSL is required, it should be in the URL as ?sslmode=require
});

console.log("[DB] Creating Drizzle instance...");
export const db = drizzle(postgresClient, { schema: { users } });
console.log("[DB] Database connection initialized successfully");