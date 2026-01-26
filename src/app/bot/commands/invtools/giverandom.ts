import { type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "../../../services/user-service.js";
import {
  addItemToInventory,
  nameToStringId,
} from "../../../services/item-service.js";
import { db } from "@db";
import { seeds } from "../../../db/schema/seeds.js";
import { ingredients } from "../../../db/schema/ingredients.js";
import { potionModifiers } from "../../../db/schema/potion-modifiers.js";
import type { RarityTier } from "../../../db/schema/seeds.js";
import type { IngredientAttributes } from "../../../db/schema/ingredients.js";
import {
  addLongField,
  formatItemNameByTier,
} from "../../utils/embed-helpers.js";

const RARITY_TIERS: RarityTier[] = [
  "basic",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

function getRandomRarity(): RarityTier {
  const weights = [40, 30, 15, 10, 4, 1]; // Weighted towards lower rarities
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return RARITY_TIERS[i];
    }
  }
  return "basic";
}

function generateRandomAttributes(): IngredientAttributes {
  const rarity = getRandomRarity();
  const maxValue = {
    basic: 5,
    uncommon: 10,
    rare: 20,
    epic: 35,
    legendary: 50,
    mythic: 100,
  }[rarity];

  return {
    spice: Math.floor(Math.random() * maxValue * 2) - maxValue,
    time: Math.floor(Math.random() * maxValue * 2) - maxValue,
    fizz: Math.floor(Math.random() * maxValue * 2) - maxValue,
    zest: Math.floor(Math.random() * maxValue * 2) - maxValue,
    bane: Math.floor(Math.random() * maxValue * 2) - maxValue,
    fantasy: Math.floor(Math.random() * maxValue * 2) - maxValue,
    chaos: Math.floor(Math.random() * maxValue * 2) - maxValue,
    darkness: Math.floor(Math.random() * maxValue * 2) - maxValue,
  };
}

const SEED_NAMES = [
  "Glowing Red Seeds",
  "Crystalline Blue Seeds",
  "Shadowy Black Seeds",
  "Golden Sun Seeds",
  "Silver Moon Seeds",
  "Emerald Green Seeds",
  "Fiery Orange Seeds",
  "Frosty White Seeds",
];

const INGREDIENT_NAMES = [
  "Dragon Scale",
  "Phoenix Feather",
  "Unicorn Horn",
  "Basilisk Eye",
  "Mandrake Root",
  "Wolfsbane",
  "Moonstone Dust",
  "Sunstone Crystal",
  "Shadow Essence",
  "Light Fragment",
];

const MODIFIER_NAMES = [
  "Antimatter",
  "Amplifier",
  "Nullifier",
  "Inverter",
  "Catalyst",
  "Stabilizer",
];

export async function handleGiverandom(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  console.log(`[Invtools:GiveRandom] Command started for user ${interaction.user.id}`);

  try {
    await interaction.deferReply();

    const user = await getOrCreateUser(interaction.user.id);
    const itemType = interaction.options.getString("type") || "all";
    const quantity = interaction.options.getInteger("quantity") || 1;

    const givenItems: Array<{
      type: string;
      name: string;
      rarity?: string;
      emoji?: string | null;
    }> = [];

    // Give seeds
    if (itemType === "seed" || itemType === "all") {
      for (let i = 0; i < quantity; i++) {
        const rarity = getRandomRarity();
        const seedName =
          SEED_NAMES[Math.floor(Math.random() * SEED_NAMES.length)];
        const stringId = nameToStringId(seedName);

        // Try to find existing seed by stringId
        let seed = await db
          .select()
          .from(seeds)
          .where(eq(seeds.stringId, stringId))
          .limit(1);

        // If not found, create it
        if (!seed[0]) {
          const newSeed = await db
            .insert(seeds)
            .values({
              stringId,
              name: seedName,
              description: `A mysterious ${rarity} seed that glimmers with potential.`,
              rarity,
            })
            .returning();
          seed = newSeed;
        }

        if (seed[0]) {
          const added = await addItemToInventory(
            user.discordId,
            "seed",
            seed[0].id,
            1,
          );
          if (added) {
            givenItems.push({
              type: "Seed",
              name: seedName,
              rarity: seed[0].rarity,
              emoji: seed[0].emoji,
            });
          }
        }
      }
    }

    // Give ingredients
    if (itemType === "ingredient" || itemType === "all") {
      for (let i = 0; i < quantity; i++) {
        const ingredientName =
          INGREDIENT_NAMES[Math.floor(Math.random() * INGREDIENT_NAMES.length)];
        const stringId = nameToStringId(ingredientName);
        const attributes = generateRandomAttributes();

        // Try to find existing ingredient by stringId
        let ingredient = await db
          .select()
          .from(ingredients)
          .where(eq(ingredients.stringId, stringId))
          .limit(1);

        // If not found, create it
        if (!ingredient[0]) {
          const newIngredient = await db
            .insert(ingredients)
            .values({
              stringId,
              name: ingredientName,
              description: `A powerful alchemical ingredient with mysterious properties.`,
              attributes: attributes as any,
            })
            .returning();
          ingredient = newIngredient;
        }

        if (ingredient[0]) {
          const added = await addItemToInventory(
            user.discordId,
            "ingredient",
            ingredient[0].id,
            1,
          );
          if (added) {
            givenItems.push({
              type: "Ingredient",
              name: ingredientName,
              emoji: ingredient[0].emoji,
            });
          }
        }
      }
    }

    // Give potion modifiers
    if (itemType === "modifier" || itemType === "all") {
      for (let i = 0; i < quantity; i++) {
        const rarity = getRandomRarity();
        const modifierName =
          MODIFIER_NAMES[Math.floor(Math.random() * MODIFIER_NAMES.length)];
        const stringId = nameToStringId(modifierName);

        // Try to find existing modifier by stringId
        let modifier = await db
          .select()
          .from(potionModifiers)
          .where(eq(potionModifiers.stringId, stringId))
          .limit(1);

        // If not found, create it
        if (!modifier[0]) {
          const newModifier = await db
            .insert(potionModifiers)
            .values({
              stringId,
              name: modifierName,
              description: `A ${rarity} modifier that transforms potions in mysterious ways.`,
              rarity,
            })
            .returning();
          modifier = newModifier;
        }

        if (modifier[0]) {
          // Potion modifiers are stored as ingredients in inventory
          const added = await addItemToInventory(
            user.discordId,
            "ingredient",
            modifier[0].id,
            1,
          );
          if (added) {
            givenItems.push({
              type: "Potion Modifier",
              name: modifierName,
              rarity: modifier[0].rarity,
              emoji: modifier[0].emoji,
            });
          }
        }
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🎁 Random Items Given")
      .setColor(0x00ff00)
      .setDescription(
        givenItems.length > 0
          ? `Successfully added ${givenItems.length} item(s) to your inventory!`
          : "❌ Failed to add items. Your inventory might be full.",
      )
      .setTimestamp();

    if (givenItems.length > 0) {
      const itemList = givenItems
        .map((item) => {
          const formattedName = formatItemNameByTier(
            item.name,
            item.rarity,
            item.emoji,
          );
          return `• ${formattedName} (${item.type})`;
        })
        .join("\n");

      addLongField(embed, "📦 Items Added", itemList);
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Invtools:GiveRandom] Error:", error);
    if (error instanceof Error) {
      console.error("[Invtools:GiveRandom] Error message:", error.message);
      console.error("[Invtools:GiveRandom] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while giving random items.",
      });
    } catch (replyError) {
      console.error("[Invtools:GiveRandom] Failed to send error reply:", replyError);
    }
  }
}
