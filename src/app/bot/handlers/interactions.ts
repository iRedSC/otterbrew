import {
  type Interaction,
  InteractionType,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
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

interface ButtonHandler {
  handleButton: (interaction: ButtonInteraction) => Promise<void>;
}

const commands = new Map<string, Command>();
const buttonHandlers = new Map<string, ButtonHandler>();

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
    // Check if command has button handler
    if (command?.handleButton) {
      const handlerId = command.data?.name || file.replace(".ts", "");
      buttonHandlers.set(handlerId, command);
    }
  }),
);

export async function handleInteraction(
  interaction: Interaction,
): Promise<void> {
  console.log(
    `[Interaction] Received interaction: ${interaction.type} from user ${interaction.user?.id}`,
  );

  // Handle button interactions
  if (interaction.type === InteractionType.MessageComponent) {
    if (interaction.isButton()) {
      console.log(`[Interaction] Processing button: ${interaction.customId}`);
      
      // Extract handler ID from customId (format: "handler:userId:data")
      const customIdParts = interaction.customId.split(":");
      const handlerId = customIdParts[0];
      
      const handler = buttonHandlers.get(handlerId);
      if (handler) {
        try {
          await handler.handleButton(interaction);
          console.log(`[Interaction] Button handler ${handlerId} completed successfully`);
        } catch (error) {
          console.error(`[Interaction] Error executing button handler ${handlerId}:`, error);
          if (error instanceof Error) {
            console.error(`[Interaction] Error stack:`, error.stack);
          }
          try {
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp({
                content: "❌ An error occurred while processing this button.",
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await interaction.reply({
                content: "❌ An error occurred while processing this button.",
                flags: MessageFlags.Ephemeral,
              });
            }
          } catch (replyError) {
            console.error(`[Interaction] Failed to send error reply:`, replyError);
          }
        }
      } else {
        console.warn(`[Interaction] No handler found for button: ${handlerId}`);
        try {
          await interaction.reply({
            content: "❌ This button is no longer valid.",
            flags: MessageFlags.Ephemeral,
          });
        } catch (replyError) {
          // Button might have already been handled or expired
          console.error(`[Interaction] Failed to send error reply:`, replyError);
        }
      }
      return;
    }
  }

  // Handle slash commands
  if (interaction.type !== InteractionType.ApplicationCommand) {
    console.log(`[Interaction] Not an application command, ignoring`);
    return;
  }

  if (!interaction.isChatInputCommand()) {
    console.log(`[Interaction] Not a chat input command, ignoring`);
    return;
  }

  console.log(`[Interaction] Processing command: ${interaction.commandName}`);

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`[Interaction] No command matching ${interaction.commandName} was found.`);
    await interaction.reply({
      content: "❌ This command is not available.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  console.log(`[Interaction] Executing command: ${interaction.commandName}`);
  try {
    await command.execute(interaction);
    console.log(`[Interaction] Command ${interaction.commandName} completed successfully`);
  } catch (error) {
    console.error(`[Interaction] Error executing ${interaction.commandName}:`, error);
    if (error instanceof Error) {
      console.error(`[Interaction] Error stack:`, error.stack);
    }
    const replyOptions = {
      content:
        "❌ An error occurred while executing this command. Please try again later.",
      flags: MessageFlags.Ephemeral,
    };

    try {
      if (interaction.replied || interaction.deferred) {
        console.log(`[Interaction] Sending followUp for ${interaction.commandName}`);
        await interaction.followUp(replyOptions);
      } else {
        console.log(`[Interaction] Sending reply for ${interaction.commandName}`);
        await interaction.reply(replyOptions);
      }
    } catch (replyError) {
      console.error(`[Interaction] Failed to send error reply:`, replyError);
    }
  }
}
