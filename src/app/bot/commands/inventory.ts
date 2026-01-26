import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";
import {
  getInventoryItems,
  parseInventory,
  type ItemDetails,
} from "../../services/item-service.js";
import type { InventorySlot } from "../../db/schema/users.js";
import {
  formatItemFieldValue,
  formatItemNameByTier,
  getItemDisplayName,
} from "../utils/embed-helpers.js";
import {
  handlePaginationButton,
  createPaginationMessage,
  type PaginationConfig,
} from "../utils/pagination.js";

type PageType = "ingredients" | "potions" | "modifiers" | "seeds";

interface GroupedItems {
  potion: Array<{ details: ItemDetails | null; quantity: number }>;
  ingredient: Array<{ details: ItemDetails | null; quantity: number }>;
  seed: Array<{ details: ItemDetails | null; quantity: number }>;
  grimoire: Array<{ details: ItemDetails | null; quantity: number }>;
  modifier: Array<{ details: ItemDetails | null; quantity: number }>;
}

/**
 * Groups inventory items by type and stacks duplicates.
 */
async function groupInventoryItems(
  userId: string,
): Promise<{ itemsByType: GroupedItems; user: Awaited<ReturnType<typeof getOrCreateUser>>; inventory: InventorySlot[] }> {
  const user = await getOrCreateUser(userId);
  const inventory = parseInventory(user.inventory);
  const itemsWithDetails = await getInventoryItems(inventory);

  // Group items by name and rarity to stack duplicates
  const stackedItems = new Map<
    string,
    {
      details: ItemDetails | null;
      quantity: number;
      type: "potion" | "ingredient" | "seed" | "grimoire" | "modifier";
    }
  >();

  itemsWithDetails.forEach((item) => {
    const name = item.details?.name || `Unknown ${item.itemType} (${item.itemId})`;
    const displayType =
      item.details?.type === "special_ingredient"
        ? "modifier"
        : item.itemType;
    const rarity = item.details?.rarity || "";
    const key = `${displayType}:${name}:${rarity}`;

    const existing = stackedItems.get(key);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      stackedItems.set(key, {
        details: item.details,
        quantity: item.quantity,
        type: displayType,
      });
    }
  });

  // Group stacked items by type
  const itemsByType: GroupedItems = {
    potion: [],
    ingredient: [],
    seed: [],
    grimoire: [],
    modifier: [],
  };

  stackedItems.forEach((item) => {
    if (itemsByType[item.type]) {
      itemsByType[item.type].push({
        details: item.details,
        quantity: item.quantity,
      });
    }
  });

  return { itemsByType, user, inventory };
}

function buildPageEmbed(
  pageType: PageType,
  itemsByType: GroupedItems,
  user: { maxInventorySlots: number },
  inventory: InventorySlot[],
): EmbedBuilder {
  const totalItems = inventory.reduce((sum, slot) => sum + slot.quantity, 0);
  const usedSlots = inventory.length;
  const emptySlots = user.maxInventorySlots - usedSlots;

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

  // Map PageType (plural) to GroupedItems key (singular)
  const typeMap: Record<PageType, keyof GroupedItems> = {
    ingredients: "ingredient",
    potions: "potion",
    modifiers: "modifier",
    seeds: "seed",
  };

  const items = itemsByType[typeMap[pageType]] || [];
  
  if (items.length === 0) {
    const pageLabels: Record<PageType, string> = {
      ingredients: "ingredients",
      potions: "potions",
      modifiers: "special ingredients",
      seeds: "seeds",
    };
    embed.setDescription(`You have no ${pageLabels[pageType]} in your inventory.`);
  } else {
    // Create individual fields for each item
    for (const item of items) {
      // Include quantity in the field name
      const itemName = getItemDisplayName(
        item.details,
        item.quantity,
        true, // showAmount
        true, // formatRarity
        true, // showEmoji
      );
      
      const fieldValue = formatItemFieldValue(item.details);
      
      embed.addFields({
        name: itemName,
        value: fieldValue,
        inline: true,
      });
    }
  }

  return embed;
}

/**
 * Creates a pagination configuration for inventory pages.
 */
function createInventoryPaginationConfig(
  userId: string,
  itemsByType: GroupedItems,
  user: Awaited<ReturnType<typeof getOrCreateUser>>,
  inventory: InventorySlot[],
): PaginationConfig<PageType> {
  const pageLabels: Record<PageType, string> = {
    ingredients: "🌿 Ingredients",
    potions: "🧪 Potions",
    modifiers: "✨ Modifiers",
    seeds: "🌱 Seeds",
  };

  return {
    handlerId: "inventory",
    pageLabels,
    buildPageEmbed: (page: PageType) =>
      buildPageEmbed(page, itemsByType, user, inventory),
    getAvailablePages: (): PageType[] => {
      const availablePages: PageType[] = [];
      if (itemsByType.ingredient.length > 0) availablePages.push("ingredients");
      if (itemsByType.potion.length > 0) availablePages.push("potions");
      if (itemsByType.modifier.length > 0) availablePages.push("modifiers");
      if (itemsByType.seed.length > 0) availablePages.push("seeds");
      // If no items, show ingredients page by default
      if (availablePages.length === 0) {
        availablePages.push("ingredients");
      }
      return availablePages;
    },
    getDefaultPage: (availablePages: PageType[]): PageType => {
      if (availablePages.length > 0) {
        return availablePages[0]!;
      }
      return "ingredients";
    },
    isValidPage: (page: string): page is PageType => {
      return ["ingredients", "potions", "modifiers", "seeds"].includes(page);
    },
  };
}

async function handleInventoryButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const customIdParts = interaction.customId.split(":");
  const userId = customIdParts[1];

  if (!userId) {
    await interaction.reply({
      content: "❌ Invalid button format.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    const { itemsByType, user, inventory } = await groupInventoryItems(userId);
    const config = createInventoryPaginationConfig(
      userId,
      itemsByType,
      user,
      inventory,
    );
    await handlePaginationButton(interaction, config);
  } catch (error) {
    console.error("[Inventory] Error handling button:", error);
    if (error instanceof Error) {
      console.error("[Inventory] Error message:", error.message);
      console.error("[Inventory] Error stack:", error.stack);
    }
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: "❌ An error occurred while updating the inventory page.",
        });
      } else {
        await interaction.reply({
          content: "❌ An error occurred while updating the inventory page.",
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      console.error("[Inventory] Failed to send error reply:", replyError);
    }
  }
}

export const command = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory"),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    console.log(`[Inventory] Command started for user ${interaction.user.id}`);

    let deferred = false;
    try {
      // Check if interaction is still valid
      if (interaction.replied || interaction.deferred) {
        console.warn(`[Inventory] Interaction already replied/deferred`);
        return;
      }

      console.log(`[Inventory] Deferring reply...`);
      try {
        await interaction.deferReply();
        deferred = true;
        console.log(`[Inventory] Reply deferred successfully`);
      } catch (deferError) {
        console.error("[Inventory] Failed to defer reply:", deferError);
        // If defer fails, the interaction might be invalid - check state
        if (interaction.replied || interaction.deferred) {
          console.log("[Inventory] Interaction already handled, aborting");
          return;
        }
        // If we can't defer, we need to process quickly and reply
        // But this is risky - interactions expire in 3 seconds
        // For now, just throw and let error handler deal with it
        throw deferError;
      }
      console.log(`[Inventory] Fetching user data...`);

      // Group inventory items (this also fetches user and parses inventory)
      const { itemsByType, user, inventory } = await groupInventoryItems(
        interaction.user.id,
      );
      console.log(`[Inventory] User data retrieved:`, {
        discordId: user.discordId,
        maxInventorySlots: user.maxInventorySlots,
        inventoryType: typeof user.inventory,
        inventoryLength: inventory.length,
      });

      // Create pagination configuration
      const config = createInventoryPaginationConfig(
        interaction.user.id,
        itemsByType,
        user,
        inventory,
      );

      // Create paginated message
      const { embed, components } = await createPaginationMessage(
        interaction.user.id,
        config,
      );

      console.log(`[Inventory] Sending response...`);
      if (deferred && !interaction.replied) {
        await interaction.editReply({
          embeds: [embed],
          components,
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          embeds: [embed],
          components,
        });
      } else {
        await interaction.reply({
          embeds: [embed],
          components,
        });
      }
      console.log(`[Inventory] Reply sent successfully`);
    } catch (error) {
      console.error("[Inventory] Error in /inventory command:", error);
      if (error instanceof Error) {
        console.error("[Inventory] Error message:", error.message);
        console.error("[Inventory] Error stack:", error.stack);
      }
      try {
        if (deferred) {
          await interaction.editReply({
            content: "❌ An error occurred while fetching your inventory.",
          });
        } else if (!interaction.replied) {
          await interaction.reply({
            content: "❌ An error occurred while fetching your inventory.",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.followUp({
            content: "❌ An error occurred while fetching your inventory.",
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (replyError) {
        console.error("[Inventory] Failed to send error reply:", replyError);
        if (replyError instanceof Error) {
          console.error("[Inventory] Reply error message:", replyError.message);
        }
      }
    }
  },
  handleButton: handleInventoryButton,
};
