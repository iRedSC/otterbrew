import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import path from "path";

const commandsPath = path.join(__dirname, "src", "app", "bot", "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".ts"));

const commands = commandFiles.map((file) => {
  const { command } = require(path.join(commandsPath, file));
  return command.data.toJSON();
});

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log("Registering application commands...");
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: commands }
    );
    console.log("Commands registered.");
  } catch (error) {
    console.error(error);
  }
})();