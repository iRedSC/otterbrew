import { client } from "@bot/client";
import { db } from "@db";


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