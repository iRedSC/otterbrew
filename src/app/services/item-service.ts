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
    if (itemType === "seed") {
      const seed = await db
        .select()
        .from(seeds)
        .where(eq(seeds.id, itemId))
        .limit(1);
      if (seed[0]) {
        return {
          id: seed[0].id,
          name: seed[0].name,
          description: seed[0].description,
          type: "seed",
          rarity: seed[0].rarity,
        };
      }
    } else if (itemType === "ingredient") {
      // First check if it's a potion modifier
      const modifier = await db
        .select()
        .from(potionModifiers)
        .where(eq(potionModifiers.id, itemId))
        .limit(1);
      if (modifier[0]) {
        return {
          id: modifier[0].id,
          name: modifier[0].name,
          description: modifier[0].description,
          type: "potion_modifier",
          rarity: modifier[0].rarity,
        };
      }
      // Otherwise, it's a regular ingredient
      const ingredient = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, itemId))
        .limit(1);
      if (ingredient[0]) {
        return {
          id: ingredient[0].id,
          name: ingredient[0].name,
          description: ingredient[0].description,
          type: "ingredient",
          attributes: ingredient[0].attributes as Ingredient["attributes"],
        };
      }
    } else if (itemType === "grimoire") {
      // Grimoires will be handled separately when implemented
      return null;
    }
    return null;
  } catch (error) {
    console.error("[ItemService] Error fetching item details:", error);
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

    const inventory: InventorySlot[] = Array.isArray(user[0].inventory)
      ? user[0].inventory
      : [];

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
        inventory: inventory as any,
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
