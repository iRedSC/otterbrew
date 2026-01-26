import { type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "../../../services/user-service.js";
import { db } from "@db";
import { users } from "../../../db/schema/users.js";

export async function handleClear(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  console.log(`[Invtools:Clear] Command started for user ${interaction.user.id}`);

  try {
    await interaction.deferReply();

    const user = await getOrCreateUser(interaction.user.id);

    // Clear inventory by setting it to empty array
    await db
      .update(users)
      .set({
        inventory: [] as any,
        updatedAt: new Date(),
      })
      .where(eq(users.discordId, user.discordId));

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Inventory Cleared")
      .setColor(0xff9900)
      .setDescription("Your inventory has been cleared successfully.")
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Invtools:Clear] Error:", error);
    if (error instanceof Error) {
      console.error("[Invtools:Clear] Error message:", error.message);
      console.error("[Invtools:Clear] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while clearing your inventory.",
      });
    } catch (replyError) {
      console.error("[Invtools:Clear] Failed to send error reply:", replyError);
    }
  }
}
