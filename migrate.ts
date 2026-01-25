import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

console.log("[Migration] Starting database migrations...");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[Migration] DATABASE_URL is not set!");
  process.exit(1);
}

const client = postgres(databaseUrl, {
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
  onnotice: () => {},
});

const db = drizzle(client);

async function runMigrations() {
  try {
    console.log("[Migration] Running migrations from ./drizzle...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[Migration] Migrations completed successfully!");
  } catch (error) {
    console.error("[Migration] Error running migrations:", error);
    if (error instanceof Error) {
      console.error("[Migration] Error message:", error.message);
      console.error("[Migration] Error stack:", error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations()
  .then(() => {
    console.log("[Migration] Migration process completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[Migration] Fatal error:", err);
    process.exit(1);
  });
