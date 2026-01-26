import { eq, inArray } from "drizzle-orm";
import { db } from "@db";
import { users, type InventorySlot } from "../db/schema/users.js";
import { seeds } from "../db/schema/seeds.js";
import { ingredients } from "../db/schema/ingredients.js";
import { specialIngredients } from "../db/schema/special-ingredients.js";
import { potions } from "../db/schema/potions.js";
import { potionItems } from "../db/schema/potion-items.js";
import type { Seed } from "../db/schema/seeds.js";
import type { Ingredient } from "../db/schema/ingredients.js";
import type { SpecialIngredient } from "../db/schema/special-ingredients.js";
import type { Potion } from "../db/schema/potions.js";
import type { PotionItem } from "../db/schema/potion-items.js";

/**
 * Parses inventory from various formats (array, string, object) into InventorySlot[]
 */
export function parseInventory(inventory: unknown): InventorySlot[] {
  if (!inventory) {
    return [];
  }

  if (Array.isArray(inventory)) {
    return inventory;
  }

  if (typeof inventory === "string") {
    try {
      const parsed = JSON.parse(inventory);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("[ItemService] Failed to parse inventory string:", e);
      return [];
    }
  }

  if (typeof inventory === "object") {
    // Might be a JSONB object that needs conversion
    return Array.isArray(inventory) ? inventory : [];
  }

  return [];
}

/**
 * Converts a name to a stringId (e.g., "Glowing Red Seeds" -> "glowing_red_seeds")
 */
export function nameToStringId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export interface ItemDetails {
  id: string;
  name: string;
  description: string;
  type: "seed" | "ingredient" | "special_ingredient" | "potion";
  rarity?: string;
  emoji?: string | null;
  attributes?: {
    spice: number;
    time: number;
    fizz: number;
    zest: number;
    bane: number;
    fantasy: number;
    chaos: number;
    darkness: number;
  };
  quality?: number;
  effects?: Potion["effects"];
}

export async function getItemDetails(
  itemType: InventorySlot["itemType"],
  itemId: string,
): Promise<ItemDetails | null> {
  try {
    console.log(`[ItemService] getItemDetails called:`, { itemType, itemId });
    if (itemType === "seed") {
      const seed = await db
        .select()
        .from(seeds)
        .where(eq(seeds.id, itemId))
        .limit(1);
      console.log(`[ItemService] Seed query result:`, {
        found: !!seed[0],
        seedId: seed[0]?.id,
        seedName: seed[0]?.name,
      });
      if (seed[0]) {
        return {
          id: seed[0].id,
          name: seed[0].name,
          description: seed[0].description,
          type: "seed",
          rarity: seed[0].rarity,
          emoji: seed[0].emoji,
        };
      }
    } else if (itemType === "ingredient") {
      // First check if it's a special ingredient
      const specialIngredient = await db
        .select()
        .from(specialIngredients)
        .where(eq(specialIngredients.id, itemId))
        .limit(1);
      console.log(`[ItemService] Special ingredient query result:`, {
        found: !!specialIngredient[0],
        specialIngredientId: specialIngredient[0]?.id,
        specialIngredientName: specialIngredient[0]?.name,
        emoji: specialIngredient[0]?.emoji,
        emojiType: typeof specialIngredient[0]?.emoji,
      });
      if (specialIngredient[0]) {
        return {
          id: specialIngredient[0].id,
          name: specialIngredient[0].name,
          description: specialIngredient[0].description,
          type: "special_ingredient",
          rarity: specialIngredient[0].rarity,
          emoji: specialIngredient[0].emoji,
        };
      }
      // Otherwise, it's a regular ingredient
      const ingredient = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, itemId))
        .limit(1);
      console.log(`[ItemService] Ingredient query result:`, {
        found: !!ingredient[0],
        ingredientId: ingredient[0]?.id,
        ingredientName: ingredient[0]?.name,
      });
      if (ingredient[0]) {
        return {
          id: ingredient[0].id,
          name: ingredient[0].name,
          description: ingredient[0].description,
          type: "ingredient",
          rarity: ingredient[0].rarity,
          attributes: ingredient[0].attributes as Ingredient["attributes"],
          emoji: ingredient[0].emoji,
        };
      }
    } else if (itemType === "grimoire") {
      // Grimoires will be handled separately when implemented
      console.log(`[ItemService] Grimoire type not yet implemented`);
      return null;
    } else if (itemType === "potion") {
      // For potions, itemId references PotionItem.id, not Potion.id
      const potionItem = await db
        .select()
        .from(potionItems)
        .where(eq(potionItems.id, itemId))
        .limit(1);
      console.log(`[ItemService] PotionItem query result:`, {
        found: !!potionItem[0],
        potionItemId: potionItem[0]?.id,
        potionId: potionItem[0]?.potionId,
        quality: potionItem[0]?.quality,
      });
      if (potionItem[0]) {
        // Get the potion definition
        const potion = await db
          .select()
          .from(potions)
          .where(eq(potions.id, potionItem[0].potionId))
          .limit(1);
        console.log(`[ItemService] Potion query result:`, {
          found: !!potion[0],
          potionId: potion[0]?.id,
          potionName: potion[0]?.name,
        });
        if (potion[0]) {
          return {
            id: potionItem[0].id,
            name: potion[0].name,
            description: potion[0].description,
            type: "potion",
            rarity: potion[0].tier,
            quality: potionItem[0].quality,
            effects: potion[0].effects as Potion["effects"],
          };
        }
      }
      console.log(`[ItemService] PotionItem or Potion not found`);
      return null;
    }
    console.log(`[ItemService] No item found for type ${itemType} with id ${itemId}`);
    return null;
  } catch (error) {
    console.error("[ItemService] Error fetching item details:", error);
    if (error instanceof Error) {
      console.error("[ItemService] Error message:", error.message);
      console.error("[ItemService] Error stack:", error.stack);
    }
    return null;
  }
}

/**
 * Find an item by stringId across all item types
 */
export async function findItemByStringId(
  stringId: string,
): Promise<{
  itemType: InventorySlot["itemType"];
  itemId: string;
  details: ItemDetails;
} | null> {
  try {
    // Try seeds first
    const seed = await db
      .select()
      .from(seeds)
      .where(eq(seeds.stringId, stringId))
      .limit(1);
    if (seed[0]) {
      return {
        itemType: "seed",
        itemId: seed[0].id,
        details: {
          id: seed[0].id,
          name: seed[0].name,
          description: seed[0].description,
          type: "seed",
          rarity: seed[0].rarity,
          emoji: seed[0].emoji,
        },
      };
    }

    // Try special ingredients
    const specialIngredient = await db
      .select()
      .from(specialIngredients)
      .where(eq(specialIngredients.stringId, stringId))
      .limit(1);
    if (specialIngredient[0]) {
      return {
        itemType: "ingredient", // Special ingredients are stored as ingredients
        itemId: specialIngredient[0].id,
        details: {
          id: specialIngredient[0].id,
          name: specialIngredient[0].name,
          description: specialIngredient[0].description,
          type: "special_ingredient",
          rarity: specialIngredient[0].rarity,
          emoji: specialIngredient[0].emoji,
        },
      };
    }

    // Try ingredients
    const ingredient = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.stringId, stringId))
      .limit(1);
    if (ingredient[0]) {
      return {
        itemType: "ingredient",
        itemId: ingredient[0].id,
        details: {
          id: ingredient[0].id,
          name: ingredient[0].name,
          description: ingredient[0].description,
          type: "ingredient",
          rarity: ingredient[0].rarity,
          attributes: ingredient[0].attributes as Ingredient["attributes"],
          emoji: ingredient[0].emoji,
        },
      };
    }

    return null;
  } catch (error) {
    console.error("[ItemService] Error finding item by stringId:", error);
    return null;
  }
}

export async function addItemToInventory(
  discordId: string,
  itemType: InventorySlot["itemType"],
  itemId: string,
  quantity: number = 1,
): Promise<boolean> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);

    if (!user[0]) {
      return false;
    }

    const inventory = parseInventory(user[0].inventory);

    // Check if item already exists in inventory
    const existingSlotIndex = inventory.findIndex(
      (slot) => slot.itemType === itemType && slot.itemId === itemId,
    );

    if (existingSlotIndex >= 0) {
      // Update quantity
      inventory[existingSlotIndex].quantity += quantity;
    } else {
      // Check if inventory is full
      if (inventory.length >= user[0].maxInventorySlots) {
        return false; // Inventory full
      }
      // Add new slot
      inventory.push({
        itemType,
        itemId,
        quantity,
      });
    }

    // Update database
    await db
      .update(users)
      .set({
        inventory: inventory satisfies InventorySlot[],
        updatedAt: new Date(),
      })
      .where(eq(users.discordId, discordId));

    return true;
  } catch (error) {
    console.error("[ItemService] Error adding item to inventory:", error);
    return false;
  }
}

export async function getInventoryItems(
  inventory: InventorySlot[],
): Promise<Array<InventorySlot & { details: ItemDetails | null }>> {
  const itemsWithDetails = await Promise.all(
    inventory.map(async (slot) => {
      const details = await getItemDetails(slot.itemType, slot.itemId);
      return {
        ...slot,
        details,
      };
    }),
  );

  return itemsWithDetails;
}
