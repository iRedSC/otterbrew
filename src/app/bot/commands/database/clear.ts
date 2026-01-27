import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { db } from "@db";
import { ingredients } from "../../../db/schema/ingredients.js";
import { seeds } from "../../../db/schema/seeds.js";
import { specialIngredients } from "../../../db/schema/special-ingredients.js";
import { potions } from "../../../db/schema/potions.js";
import { potionRecipes } from "../../../db/schema/potion-recipes.js";
import { potionItems } from "../../../db/schema/potion-items.js";

// Store pending clear operations: userId -> tableName
const pendingClears = new Map<string, string>();

export function getPendingClear(userId: string): string | undefined {
  return pendingClears.get(userId);
}

export function setPendingClear(userId: string, tableName: string): void {
  pendingClears.set(userId, tableName);
}

export function clearPendingClear(userId: string): void {
  pendingClears.delete(userId);
}

const tableMap = {
  ingredients,
  seeds,
  special_ingredients: specialIngredients,
  potions,
  potion_recipes: potionRecipes,
  potion_items: potionItems,
} as const;

const tableDisplayNames: Record<string, string> = {
  ingredients: "Ingredients",
  seeds: "Seeds",
  special_ingredients: "Special Ingredients",
  potions: "Potions",
  potion_recipes: "Potion Recipes",
  potion_items: "Potion Items",
};

export async function handleClear(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  console.log(
    `[Database:Clear] Command started for user ${interaction.user.id}`,
  );

  try {
    await interaction.deferReply({ ephemeral: true });

    const tableName = interaction.options.getString("table", true);
    const table = tableMap[tableName as keyof typeof tableMap];

    if (!table) {
      await interaction.editReply({
        content: `❌ Unknown table: ${tableName}`,
      });
      return;
    }

    // Store pending operation
    setPendingClear(interaction.user.id, tableName);

    const displayName = tableDisplayNames[tableName] || tableName;

    const embed = new EmbedBuilder()
      .setTitle("⚠️ Confirm Database Clear")
      .setColor(0xff9900)
      .setDescription(
        `You are about to clear the **${displayName}** table.\n\n` +
          `⚠️ **This action cannot be undone!**\n\n` +
          `Type \`/database confirm\` to proceed with clearing the table.`,
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Database:Clear] Error:", error);
    if (error instanceof Error) {
      console.error("[Database:Clear] Error message:", error.message);
      console.error("[Database:Clear] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while processing your request.",
      });
    } catch (replyError) {
      console.error("[Database:Clear] Failed to send error reply:", replyError);
    }
  }
}
