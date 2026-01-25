import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "./schema/users.js";

export const postgresClient = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  connect_timeout: 10, // 10 second connection timeout
  idle_timeout: 20, // 20 second idle timeout
  max_lifetime: 60 * 30, // 30 minutes max lifetime
});

export const db = drizzle(postgresClient, { schema: { users } });