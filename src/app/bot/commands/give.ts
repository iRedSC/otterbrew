import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";
import {
  addItemToInventory,
  findItemByStringId,
} from "../../services/item-service.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give an item to a player")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to give the item to")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The string ID of the item (e.g., glowing_red_seeds)")
        .setRequired(true)
        .setAutocomplete(false),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Quantity to give (default: 1)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1000),
    ),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    console.log(`[Give] Command started by user ${interaction.user.id}`);

    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser("user", true);
      const stringId = interaction.options.getString("item", true).toLowerCase();
      const quantity = interaction.options.getInteger("quantity") || 1;

      // Find the item by stringId
      const item = await findItemByStringId(stringId);

      if (!item) {
        await interaction.editReply({
          content: `❌ Item with string ID "${stringId}" not found.`,
        });
        return;
      }

      // Get or create the target user
      const user = await getOrCreateUser(targetUser.id);

      // Add item to inventory
      const added = await addItemToInventory(
        user.discordId,
        item.itemType,
        item.itemId,
        quantity,
      );

      if (!added) {
        await interaction.editReply({
          content: `❌ Failed to add item. ${targetUser.username}'s inventory might be full.`,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("✅ Item Given")
        .setColor(0x00ff00)
        .setDescription(
          `Successfully gave **${quantity}x ${item.details.name}** to ${targetUser.username}!`,
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
      console.error("[Give] Error in /give command:", error);
      if (error instanceof Error) {
        console.error("[Give] Error message:", error.message);
        console.error("[Give] Error stack:", error.stack);
      }
      try {
        await interaction.editReply({
          content: "❌ An error occurred while giving the item.",
        });
      } catch (replyError) {
        console.error("[Give] Failed to send error reply:", replyError);
      }
    }
  },
};
