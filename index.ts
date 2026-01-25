import { client } from "@bot/client";
import { postgresClient, db } from "@db";
import { sql } from "drizzle-orm";
import { handleInteraction } from "@bot/handlers/interactions";

// Validate required environment variables
const requiredEnvVars = ["BOT_TOKEN", "DATABASE_URL"] as const;
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`,
  );
  process.exit(1);
}

// Test database connection before starting bot
async function testDatabaseConnection() {
  console.log("[Startup] Testing database connection...");
  try {
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("[Startup] Database connection successful:", result);
    return true;
  } catch (error) {
    console.error("[Startup] Database connection failed:", error);
    if (error instanceof Error) {
      console.error("[Startup] Error message:", error.message);
      console.error("[Startup] Error stack:", error.stack);
    }
    return false;
  }
}

// Start bot after database test
testDatabaseConnection().then((connected) => {
  if (!connected) {
    console.error("[Startup] Failed to connect to database. Exiting...");
    process.exit(1);
  }
  
  console.log("[Startup] Starting Discord bot...");
  client.on("interactionCreate", handleInteraction);
  client.login(process.env.BOT_TOKEN);
});

process.on("beforeExit", async () => {
  console.log("[Shutdown] Closing database connection...");
  await postgresClient.end();
});

// async function main() {


// }

// main()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error("❌ Error running DB test:", err);
//     process.exit(1);
//   });