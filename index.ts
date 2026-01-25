import { client } from "@bot/client";
import { db } from "@db";
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

client.on("interactionCreate", handleInteraction);

client.login(process.env.BOT_TOKEN);

process.on("beforeExit", async () => {
  await db.end();
});

// async function main() {


// }

// main()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error("❌ Error running DB test:", err);
//     process.exit(1);
//   });