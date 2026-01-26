import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { handleGiverandom } from "./invtools/giverandom.js";
import { handleGive } from "./invtools/give.js";
import { handleClear } from "./invtools/clear.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("invtools")
    .setDescription("Inventory management tools")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("giverandom")
        .setDescription("Give yourself random items for testing")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("Type of item to give")
            .setRequired(false)
            .addChoices(
              { name: "Seed", value: "seed" },
              { name: "Ingredient", value: "ingredient" },
              { name: "Potion Modifier", value: "modifier" },
              { name: "All", value: "all" },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName("quantity")
            .setDescription("Number of items to give (default: 1)")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("give")
        .setDescription("Give yourself an item by string ID")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("The string ID of the item (e.g., glowing_red_seeds)")
            .setRequired(true),
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Quantity to give (default: 1)")
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(1000),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Clear your entire inventory"),
    ),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "giverandom":
        await handleGiverandom(interaction);
        break;
      case "give":
        await handleGive(interaction);
        break;
      case "clear":
        await handleClear(interaction);
        break;
      default:
        await interaction.reply({
          content: "❌ Unknown subcommand.",
          ephemeral: true,
        });
    }
  },
};
