import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const postgresClient = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
});

export const db = drizzle(postgresClient);