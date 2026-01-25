import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Validate required environment variables
const requiredEnvVars = ["BOT_TOKEN", "CLIENT_ID", "GUILD_ID"] as const;
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`,
  );
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsPath = path.join(__dirname, "src", "app", "bot", "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".ts"));

const commands = await Promise.all(
  commandFiles.map(async (file) => {
    const filePath = path.join(commandsPath, file);
    const { command } = await import(filePath);
    return command.data.toJSON();
  }),
);

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);

try {
  console.log("Registering application commands...");
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID!,
      process.env.GUILD_ID!,
    ),
    { body: commands },
  );
  console.log("Commands registered.");
} catch (error) {
  console.error(error);
  process.exit(1);
}