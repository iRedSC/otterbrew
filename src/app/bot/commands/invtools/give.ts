import { type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getOrCreateUser } from "../../../services/user-service.js";
import {
  addItemToInventory,
  findItemByStringId,
} from "../../../services/item-service.js";

export async function handleGive(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  console.log(`[Invtools:Give] Command started by user ${interaction.user.id}`);

  try {
    await interaction.deferReply();

    const stringId = interaction.options.getString("id", true).toLowerCase();
    const quantity = interaction.options.getInteger("amount") || 1;

    // Find the item by stringId
    const item = await findItemByStringId(stringId);

    if (!item) {
      await interaction.editReply({
        content: `❌ Item with string ID "${stringId}" not found.`,
      });
      return;
    }

    // Get or create the user
    const user = await getOrCreateUser(interaction.user.id);

    // Add item to inventory
    const added = await addItemToInventory(
      user.discordId,
      item.itemType,
      item.itemId,
      quantity,
    );

    if (!added) {
      await interaction.editReply({
        content: `❌ Failed to add item. Your inventory might be full.`,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ Item Given")
      .setColor(0x00ff00)
      .setDescription(
        `Successfully added **${quantity}x ${item.details.name}** to your inventory!`,
      )
      .addFields(
        {
          name: "Item",
          value: item.details.name,
          inline: true,
        },
        {
          name: "Quantity",
          value: quantity.toString(),
          inline: true,
        },
        {
          name: "String ID",
          value: stringId,
          inline: true,
        },
      )
      .setTimestamp();

    if (item.details.rarity) {
      embed.addFields({
        name: "Rarity",
        value: item.details.rarity,
        inline: true,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Invtools:Give] Error:", error);
    if (error instanceof Error) {
      console.error("[Invtools:Give] Error message:", error.message);
      console.error("[Invtools:Give] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while giving the item.",
      });
    } catch (replyError) {
      console.error("[Invtools:Give] Failed to send error reply:", replyError);
    }
  }
}
