import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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
  addLongField,
  getItemDisplayName,
} from "../utils/embed-helpers.js";

type PageType = "ingredients" | "potions" | "modifiers" | "seeds";

interface GroupedItems {
  potion: Array<{ details: ItemDetails | null; quantity: number }>;
  ingredient: Array<{ details: ItemDetails | null; quantity: number }>;
  seed: Array<{ details: ItemDetails | null; quantity: number }>;
  grimoire: Array<{ details: ItemDetails | null; quantity: number }>;
  modifier: Array<{ details: ItemDetails | null; quantity: number }>;
}

function buildPaginationButtons(
  userId: string,
  currentPage: PageType,
  availablePages: PageType[],
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  const pageLabels: Record<PageType, string> = {
    ingredients: "🌿 Ingredients",
    potions: "🧪 Potions",
    modifiers: "✨ Modifiers",
    seeds: "🌱 Seeds",
  };

  for (const page of availablePages) {
    const isActive = page === currentPage;
    const button = new ButtonBuilder()
      .setCustomId(`inventory:${userId}:${page}`)
      .setLabel(pageLabels[page])
      .setStyle(isActive ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(isActive);
    row.addComponents(button);
  }

  return row;
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
      modifiers: "potion modifiers",
      seeds: "seeds",
    };
    embed.setDescription(`You have no ${pageLabels[pageType]} in your inventory.`);
  } else {
    let itemList: string;
    let fieldName: string;
    let showRarity = false;
    let showEmoji = true;

    switch (pageType) {
      case "ingredients":
        itemList = items
          .map((item) =>
            getItemDisplayName(item.details, item.quantity, true, false, true),
          )
          .join("\n");
        fieldName = "🌿 Ingredients";
        break;
      case "potions":
        itemList = items
          .map((item) =>
            getItemDisplayName(item.details, item.quantity, true, false, true),
          )
          .join("\n");
        fieldName = "🧪 Potions";
        break;
      case "modifiers":
        itemList = items
          .map((item) =>
            getItemDisplayName(item.details, item.quantity, true, true, true),
          )
          .join("\n");
        fieldName = "✨ Potion Modifiers";
        showRarity = true;
        break;
      case "seeds":
        itemList = items
          .map((item) =>
            getItemDisplayName(item.details, item.quantity, true, true, true),
          )
          .join("\n");
        fieldName = "🌱 Seeds";
        showRarity = true;
        break;
    }

    addLongField(embed, fieldName, itemList);
  }

  return embed;
}

async function handleInventoryButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const customIdParts = interaction.customId.split(":");
  const userId = customIdParts[1];
  const pageType = customIdParts[2] as PageType;

  // Verify the button belongs to the user who clicked it
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "❌ This button is not for you.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await interaction.deferUpdate();

    const user = await getOrCreateUser(userId);
    const inventory = parseInventory(user.inventory);
    const itemsWithDetails = await getInventoryItems(inventory);

    // Group items by type
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
        item.details?.type === "potion_modifier"
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

    // Determine available pages (only show pages that have items)
    const availablePages: PageType[] = [];
    if (itemsByType.ingredient.length > 0) availablePages.push("ingredients");
    if (itemsByType.potion.length > 0) availablePages.push("potions");
    if (itemsByType.modifier.length > 0) availablePages.push("modifiers");
    if (itemsByType.seed.length > 0) availablePages.push("seeds");

    // If no items, show ingredients page by default
    if (availablePages.length === 0) {
      availablePages.push("ingredients");
    }

    const embed = buildPageEmbed(pageType, itemsByType, user, inventory);
    const buttons = buildPaginationButtons(userId, pageType, availablePages);

    await interaction.editReply({
      embeds: [embed],
      components: [buttons],
    });
  } catch (error) {
    console.error("[Inventory] Error handling button:", error);
    if (error instanceof Error) {
      console.error("[Inventory] Error message:", error.message);
      console.error("[Inventory] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while updating the inventory page.",
      });
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

      const user = await getOrCreateUser(interaction.user.id);
      console.log(`[Inventory] User data retrieved:`, {
        discordId: user.discordId,
        maxInventorySlots: user.maxInventorySlots,
        inventoryType: typeof user.inventory,
        inventoryValue: JSON.stringify(user.inventory),
        inventoryLength: Array.isArray(user.inventory)
          ? user.inventory.length
          : 0,
      });

      const inventory = parseInventory(user.inventory);
      console.log(`[Inventory] Parsed inventory:`, {
        length: inventory.length,
        items: JSON.stringify(inventory, null, 2),
      });

      // Fetch item details
      const itemsWithDetails = await getInventoryItems(inventory);
      console.log(`[Inventory] Items with details:`, {
        count: itemsWithDetails.length,
        items: JSON.stringify(
          itemsWithDetails.map((item) => ({
            itemType: item.itemType,
            itemId: item.itemId,
            quantity: item.quantity,
            hasDetails: !!item.details,
            detailsName: item.details?.name || "null",
          })),
          null,
          2,
        ),
      });

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
          item.details?.type === "potion_modifier"
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

      // Determine available pages (only show pages that have items)
      const availablePages: PageType[] = [];
      if (itemsByType.ingredient.length > 0) availablePages.push("ingredients");
      if (itemsByType.potion.length > 0) availablePages.push("potions");
      if (itemsByType.modifier.length > 0) availablePages.push("modifiers");
      if (itemsByType.seed.length > 0) availablePages.push("seeds");

      // Default to first available page, or ingredients if empty
      const defaultPage: PageType =
        availablePages.length > 0 ? availablePages[0] : "ingredients";

      console.log(`[Inventory] Building embed for page: ${defaultPage}`);
      const embed = buildPageEmbed(defaultPage, itemsByType, user, inventory);
      const buttons = buildPaginationButtons(
        interaction.user.id,
        defaultPage,
        availablePages.length > 0 ? availablePages : ["ingredients"],
      );

      console.log(`[Inventory] Sending response...`);
      if (deferred && !interaction.replied) {
        await interaction.editReply({
          embeds: [embed],
          components: availablePages.length > 1 ? [buttons] : [],
        });
      } else if (interaction.replied) {
        await interaction.followUp({
          embeds: [embed],
          components: availablePages.length > 1 ? [buttons] : [],
        });
      } else {
        await interaction.reply({
          embeds: [embed],
          components: availablePages.length > 1 ? [buttons] : [],
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
