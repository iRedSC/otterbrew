import {
  type Interaction,
  InteractionType,
  type ChatInputCommandInteraction,
  MessageFlags,
} from "discord.js";
import { readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Command {
  data: {
    name: string;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands = new Map<string, Command>();

// Load all commands
const commandsPath = path.join(__dirname, "..", "commands");
const commandFiles = readdirSync(commandsPath).filter((file) =>
  file.endsWith(".ts"),
);

await Promise.all(
  commandFiles.map(async (file) => {
    const filePath = path.join(commandsPath, file);
    const { command } = await import(filePath);
    if (command?.data?.name && command?.execute) {
      commands.set(command.data.name, command);
    }
  }),
);

export async function handleInteraction(
  interaction: Interaction,
): Promise<void> {
  if (interaction.type !== InteractionType.ApplicationCommand) {
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    await interaction.reply({
      content: "❌ This command is not available.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const replyOptions = {
      content:
        "❌ An error occurred while executing this command. Please try again later.",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  }
}
