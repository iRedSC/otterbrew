import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";
import { addItemToInventory } from "../../services/item-service.js";
import { db } from "@db";
import { seeds } from "../../db/schema/seeds.js";
import { ingredients } from "../../db/schema/ingredients.js";
import { potionModifiers } from "../../db/schema/potion-modifiers.js";
import type { RarityTier } from "../../db/schema/seeds.js";
import type { IngredientAttributes } from "../../db/schema/ingredients.js";

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

export const command = {
  data: new SlashCommandBuilder()
    .setName("giverandom")
    .setDescription("Give yourself random items for testing")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of item to give")
        .setRequired(false)
        .addChoices(
          { name: "Seed", value: "seed" },
          { name: "Ingredient", value: "ingredient" },
          { name: "Potion Modifier", value: "modifier" },
          { name: "All", value: "all" },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Number of items to give (default: 1)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10),
    ),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    console.log(`[GiveRandom] Command started for user ${interaction.user.id}`);

    try {
      await interaction.deferReply();

      const user = await getOrCreateUser(interaction.user.id);
      const itemType = interaction.options.getString("type") || "all";
      const quantity = interaction.options.getInteger("quantity") || 1;

      const givenItems: Array<{
        type: string;
        name: string;
        rarity?: string;
      }> = [];

      // Give seeds
      if (itemType === "seed" || itemType === "all") {
        for (let i = 0; i < quantity; i++) {
          const rarity = getRandomRarity();
          const seedName =
            SEED_NAMES[Math.floor(Math.random() * SEED_NAMES.length)];
          const seed = await db
            .insert(seeds)
            .values({
              name: seedName,
              description: `A mysterious ${rarity} seed that glimmers with potential.`,
              rarity,
            })
            .returning();

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
                rarity,
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
          const attributes = generateRandomAttributes();
          const ingredient = await db
            .insert(ingredients)
            .values({
              name: ingredientName,
              description: `A powerful alchemical ingredient with mysterious properties.`,
              attributes: attributes as any,
            })
            .returning();

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
          const modifier = await db
            .insert(potionModifiers)
            .values({
              name: modifierName,
              description: `A ${rarity} modifier that transforms potions in mysterious ways.`,
              rarity,
            })
            .returning();

          if (modifier[0]) {
            // Potion modifiers are stored as ingredients in inventory
            // We'll need to handle this differently - for now, store as ingredient
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
                rarity,
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
            const rarityText = item.rarity ? ` [${item.rarity}]` : "";
            return `• **${item.name}** (${item.type})${rarityText}`;
          })
          .join("\n");
        embed.addFields({
          name: "📦 Items Added",
          value: itemList,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[GiveRandom] Error in /giverandom command:", error);
      if (error instanceof Error) {
        console.error("[GiveRandom] Error message:", error.message);
        console.error("[GiveRandom] Error stack:", error.stack);
      }
      try {
        await interaction.editReply({
          content: "❌ An error occurred while giving random items.",
        });
      } catch (replyError) {
        console.error("[GiveRandom] Failed to send error reply:", replyError);
      }
    }
  },
};
