import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";
import { getInventoryItems } from "../../services/item-service.js";
import type { InventorySlot } from "../../db/schema/users.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory"),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    console.log(`[Inventory] Command started for user ${interaction.user.id}`);

    try {
      console.log(`[Inventory] Deferring reply...`);
      await interaction.deferReply();
      console.log(`[Inventory] Reply deferred, fetching user data...`);

      const user = await getOrCreateUser(interaction.user.id);
      console.log(`[Inventory] User data retrieved:`, {
        discordId: user.discordId,
        maxInventorySlots: user.maxInventorySlots,
        inventoryLength: Array.isArray(user.inventory)
          ? user.inventory.length
          : 0,
      });

      const inventory: InventorySlot[] = Array.isArray(user.inventory)
        ? user.inventory
        : [];

      const totalItems = inventory.reduce(
        (sum, slot) => sum + slot.quantity,
        0,
      );
      const usedSlots = inventory.length;
      const emptySlots = user.maxInventorySlots - usedSlots;

      // Fetch item details
      const itemsWithDetails = await getInventoryItems(inventory);

      console.log(`[Inventory] Building embed...`);
      const embed = new EmbedBuilder()
        .setTitle("🎒 Inventory")
        .setColor(0x5865f2)
        .addFields(
          {
            name: "📊 Capacity",
            value: `${usedSlots}/${user.maxInventorySlots} slots used`,
            inline: true,
          },
          {
            name: "📦 Total Items",
            value: totalItems.toString(),
            inline: true,
          },
          {
            name: "🔄 Empty Slots",
            value: emptySlots.toString(),
            inline: true,
          },
        )
        .setTimestamp();

      if (inventory.length === 0) {
        embed.setDescription("Your inventory is empty.");
      } else {
        // Group items by type for better display
        const itemsByType: Record<string, typeof itemsWithDetails> = {
          potion: [],
          ingredient: [],
          seed: [],
          grimoire: [],
        };

        itemsWithDetails.forEach((item) => {
          const type = item.itemType;
          if (itemsByType[type]) {
            itemsByType[type].push(item);
          }
        });

        const itemDescriptions: string[] = [];

        // Display potions
        if (itemsByType.potion.length > 0) {
          const potionList = itemsByType.potion
            .map(
              (item) =>
                `• ${item.details?.name || item.itemId} (x${item.quantity})`,
            )
            .join("\n");
          itemDescriptions.push(`**🧪 Potions**\n${potionList}`);
        }

        // Display ingredients (including potion modifiers)
        if (itemsByType.ingredient.length > 0) {
          const regularIngredients = itemsByType.ingredient.filter(
            (item) => item.details?.type !== "potion_modifier",
          );
          const modifiers = itemsByType.ingredient.filter(
            (item) => item.details?.type === "potion_modifier",
          );

          if (regularIngredients.length > 0) {
            const ingredientList = regularIngredients
              .map(
                (item) =>
                  `• ${item.details?.name || item.itemId} (x${item.quantity})`,
              )
              .join("\n");
            itemDescriptions.push(`**🌿 Ingredients**\n${ingredientList}`);
          }

          if (modifiers.length > 0) {
            const modifierList = modifiers
              .map((item) => {
                const name = item.details?.name || item.itemId;
                const rarity = item.details?.rarity
                  ? ` [${item.details.rarity}]`
                  : "";
                return `• ${name}${rarity} (x${item.quantity})`;
              })
              .join("\n");
            itemDescriptions.push(`**✨ Potion Modifiers**\n${modifierList}`);
          }
        }

        // Display seeds
        if (itemsByType.seed.length > 0) {
          const seedList = itemsByType.seed
            .map((item) => {
              const name = item.details?.name || item.itemId;
              const rarity = item.details?.rarity
                ? ` [${item.details.rarity}]`
                : "";
              return `• ${name}${rarity} (x${item.quantity})`;
            })
            .join("\n");
          itemDescriptions.push(`**🌱 Seeds**\n${seedList}`);
        }

        // Display grimoires
        if (itemsByType.grimoire.length > 0) {
          const grimoireList = itemsByType.grimoire
            .map(
              (item) =>
                `• ${item.details?.name || item.itemId} (x${item.quantity})`,
            )
            .join("\n");
          itemDescriptions.push(`**📚 Grimoires**\n${grimoireList}`);
        }

        // Split into multiple fields if needed (Discord embed field limit is 1024 chars)
        const maxFieldLength = 1000;
        let currentField = "";
        let fieldCount = 0;

        itemDescriptions.forEach((section) => {
          if (
            currentField.length + section.length + 2 > maxFieldLength &&
            currentField.length > 0
          ) {
            embed.addFields({
              name: fieldCount === 0 ? "📋 Items" : "\u200b",
              value: currentField.trim(),
              inline: false,
            });
            currentField = section;
            fieldCount++;
          } else {
            currentField +=
              (currentField.length > 0 ? "\n\n" : "") + section;
          }
        });

        if (currentField.length > 0) {
          embed.addFields({
            name: fieldCount === 0 ? "📋 Items" : "\u200b",
            value: currentField.trim(),
            inline: false,
          });
        }
      }

      console.log(`[Inventory] Sending editReply...`);
      await interaction.editReply({ embeds: [embed] });
      console.log(`[Inventory] Reply sent successfully`);
    } catch (error) {
      console.error("[Inventory] Error in /inventory command:", error);
      if (error instanceof Error) {
        console.error("[Inventory] Error message:", error.message);
        console.error("[Inventory] Error stack:", error.stack);
      }
      try {
        await interaction.editReply({
          content: "❌ An error occurred while fetching your inventory.",
        });
      } catch (replyError) {
        console.error("[Inventory] Failed to send error reply:", replyError);
      }
    }
  },
};
