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
import {
  getPendingClear,
  clearPendingClear,
  tableMap,
  tableDisplayNames,
} from "./clear.js";

export async function handleConfirm(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  console.log(
    `[Database:Confirm] Command started for user ${interaction.user.id}`,
  );

  try {
    await interaction.deferReply({ ephemeral: true });

    const pendingTable = getPendingClear(interaction.user.id);

    if (!pendingTable) {
      const embed = new EmbedBuilder()
        .setTitle("❌ No Pending Operation")
        .setColor(0xff0000)
        .setDescription(
          "You don't have any pending database operations.\n\n" +
            "Use `/database clear` first to initiate a clear operation.",
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const table = tableMap[pendingTable as keyof typeof tableMap];

    if (!table) {
      await interaction.editReply({
        content: `❌ Unknown table: ${pendingTable}`,
      });
      clearPendingClear(interaction.user.id);
      return;
    }

    const displayName = tableDisplayNames[pendingTable] || pendingTable;

    // Execute the clear operation
    console.log(
      `[Database:Confirm] Clearing table ${pendingTable} for user ${interaction.user.id}`,
    );

    // Use DELETE FROM table_name to clear all rows
    await db.delete(table);

    // Clear pending operation
    clearPendingClear(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle("✅ Table Cleared")
      .setColor(0x00ff00)
      .setDescription(
        `Successfully cleared the **${displayName}** table.\n\n` +
          `All rows have been deleted.`,
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Database:Confirm] Error:", error);
    if (error instanceof Error) {
      console.error("[Database:Confirm] Error message:", error.message);
      console.error("[Database:Confirm] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while clearing the table.",
      });
    } catch (replyError) {
      console.error(
        "[Database:Confirm] Failed to send error reply:",
        replyError,
      );
    }
    // Clear pending operation even on error
    clearPendingClear(interaction.user.id);
  }
}
