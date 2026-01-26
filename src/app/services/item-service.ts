import { eq, inArray } from "drizzle-orm";
import { db } from "@db";
import { users, type InventorySlot } from "../db/schema/users.js";
import { seeds } from "../db/schema/seeds.js";
import { ingredients } from "../db/schema/ingredients.js";
import { potionModifiers } from "../db/schema/potion-modifiers.js";
import type { Seed } from "../db/schema/seeds.js";
import type { Ingredient } from "../db/schema/ingredients.js";
import type { PotionModifier } from "../db/schema/potion-modifiers.js";

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
  type: "seed" | "ingredient" | "potion_modifier";
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
        emoji: seed[0]?.emoji,
        emojiType: typeof seed[0]?.emoji,
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
      // First check if it's a potion modifier
      const modifier = await db
        .select()
        .from(potionModifiers)
        .where(eq(potionModifiers.id, itemId))
        .limit(1);
      console.log(`[ItemService] Modifier query result:`, {
        found: !!modifier[0],
        modifierId: modifier[0]?.id,
        modifierName: modifier[0]?.name,
        emoji: modifier[0]?.emoji,
        emojiType: typeof modifier[0]?.emoji,
      });
      if (modifier[0]) {
        return {
          id: modifier[0].id,
          name: modifier[0].name,
          description: modifier[0].description,
          type: "potion_modifier",
          rarity: modifier[0].rarity,
          emoji: modifier[0].emoji,
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
        emoji: ingredient[0]?.emoji,
        emojiType: typeof ingredient[0]?.emoji,
      });
      if (ingredient[0]) {
        return {
          id: ingredient[0].id,
          name: ingredient[0].name,
          description: ingredient[0].description,
          type: "ingredient",
          attributes: ingredient[0].attributes as Ingredient["attributes"],
          emoji: ingredient[0].emoji,
        };
      }
    } else if (itemType === "grimoire") {
      // Grimoires will be handled separately when implemented
      console.log(`[ItemService] Grimoire type not yet implemented`);
      return null;
    } else if (itemType === "potion") {
      console.log(`[ItemService] Potion type not yet implemented in getItemDetails`);
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

    // Try potion modifiers
    const modifier = await db
      .select()
      .from(potionModifiers)
      .where(eq(potionModifiers.stringId, stringId))
      .limit(1);
    if (modifier[0]) {
      return {
        itemType: "ingredient", // Modifiers are stored as ingredients
        itemId: modifier[0].id,
        details: {
          id: modifier[0].id,
          name: modifier[0].name,
          description: modifier[0].description,
          type: "potion_modifier",
          rarity: modifier[0].rarity,
          emoji: modifier[0].emoji,
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
