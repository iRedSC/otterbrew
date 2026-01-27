import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { handleClear } from "./database/clear.js";
import { handleConfirm } from "./database/confirm.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("database")
    .setDescription("Database management commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Clear a specific database table")
        .addStringOption((option) =>
          option
            .setName("table")
            .setDescription("The table to clear")
            .setRequired(true)
            .addChoices(
              { name: "Ingredients", value: "ingredients" },
              { name: "Seeds", value: "seeds" },
              { name: "Special Ingredients", value: "special_ingredients" },
              { name: "Potions", value: "potions" },
              { name: "Potion Recipes", value: "potion_recipes" },
              { name: "Potion Items", value: "potion_items" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("confirm")
        .setDescription("Confirm a pending database operation"),
    ),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "clear":
        await handleClear(interaction);
        break;
      case "confirm":
        await handleConfirm(interaction);
        break;
      default:
        await interaction.reply({
          content: "❌ Unknown subcommand.",
          ephemeral: true,
        });
    }
  },
};
