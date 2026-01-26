import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";
import { getInventoryItems } from "../../services/item-service.js";
import type { InventorySlot } from "../../db/schema/users.js";
import { addLongField } from "../utils/embed-helpers.js";

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
        // Group items by name and rarity to stack duplicates
        // Items with same name but different rarity should be separate
        const stackedItems = new Map<
          string,
          {
            name: string;
            quantity: number;
            type: string;
            rarity?: string;
            displayType: "potion" | "ingredient" | "seed" | "grimoire" | "modifier";
          }
        >();

        itemsWithDetails.forEach((item) => {
          const name = item.details?.name || item.itemId;
          const displayType =
            item.details?.type === "potion_modifier"
              ? "modifier"
              : item.itemType;
          const rarity = item.details?.rarity || "";
          // Include rarity in key so items with same name but different rarity are separate
          const key = `${displayType}:${name}:${rarity}`;

          const existing = stackedItems.get(key);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            stackedItems.set(key, {
              name,
              quantity: item.quantity,
              type: displayType,
              rarity: item.details?.rarity,
            });
          }
        });

        // Group stacked items by type
        const itemsByType: Record<
          string,
          Array<{
            name: string;
            quantity: number;
            rarity?: string;
          }>
        > = {
          potion: [],
          ingredient: [],
          seed: [],
          grimoire: [],
          modifier: [],
        };

        stackedItems.forEach((item) => {
          if (itemsByType[item.displayType]) {
            itemsByType[item.displayType].push({
              name: item.name,
              quantity: item.quantity,
              rarity: item.rarity,
            });
          }
        });

        const itemDescriptions: string[] = [];

        // Display potions
        if (itemsByType.potion.length > 0) {
          const potionList = itemsByType.potion
            .map((item) => `• ${item.name} (x${item.quantity})`)
            .join("\n");
          itemDescriptions.push(`**🧪 Potions**\n${potionList}`);
        }

        // Display ingredients
        if (itemsByType.ingredient.length > 0) {
          const ingredientList = itemsByType.ingredient
            .map((item) => `• ${item.name} (x${item.quantity})`)
            .join("\n");
          itemDescriptions.push(`**🌿 Ingredients**\n${ingredientList}`);
        }

        // Display potion modifiers
        if (itemsByType.modifier.length > 0) {
          const modifierList = itemsByType.modifier
            .map((item) => {
              const rarity = item.rarity ? ` [${item.rarity}]` : "";
              return `• ${item.name}${rarity} (x${item.quantity})`;
            })
            .join("\n");
          itemDescriptions.push(`**✨ Potion Modifiers**\n${modifierList}`);
        }

        // Display seeds
        if (itemsByType.seed.length > 0) {
          const seedList = itemsByType.seed
            .map((item) => {
              const rarity = item.rarity ? ` [${item.rarity}]` : "";
              return `• ${item.name}${rarity} (x${item.quantity})`;
            })
            .join("\n");
          itemDescriptions.push(`**🌱 Seeds**\n${seedList}`);
        }

        // Display grimoires
        if (itemsByType.grimoire.length > 0) {
          const grimoireList = itemsByType.grimoire
            .map((item) => `• ${item.name} (x${item.quantity})`)
            .join("\n");
          itemDescriptions.push(`**📚 Grimoires**\n${grimoireList}`);
        }

        // Combine all item descriptions with double newlines
        const combinedItems = itemDescriptions.join("\n\n");
        addLongField(embed, "📋 Items", combinedItems);
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
