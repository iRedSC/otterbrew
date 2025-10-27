import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import type { Command } from "@definitions/command";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const commands = new Collection<string, Command>();

// Load command modules dynamically
const commandsPath = path.join(__dirname, "src", "app",  "bot", "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".ts"));
for (const file of commandFiles) {
  const { command } = require(path.join(commandsPath, file));
  commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (readyClient) =>
  console.log(`Logged in as ${readyClient.user.tag}`)
);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = commands.get(interaction.commandName);
  if (!cmd) {
    await interaction.reply("Unknown command.");
    return;
  }

  try {
    await cmd.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing that command.",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);