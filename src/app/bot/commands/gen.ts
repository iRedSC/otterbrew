import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { seeds } from "../../db/schema/seeds.js";
import { ingredients } from "../../db/schema/ingredients.js";
import { specialIngredients } from "../../db/schema/special-ingredients.js";
import {
  generateSeed,
  generateIngredient,
  generateSpecialIngredient,
} from "../../services/ai/generators.js";
import { nameToStringId } from "../../services/item-service.js";
import { formatAttributes, addLongField } from "../utils/embed-helpers.js";

async function handleGenSeed(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();

    const amount = interaction.options.getInteger("amount") ?? 1;
    console.log(
      `[Gen:Seed] Generating ${amount} seed(s) for user ${interaction.user.id}`,
    );

    // Generate all seeds in parallel
    const seedResults = await Promise.allSettled(
      Array.from({ length: amount }, () => generateSeed()),
    );

    const results: Array<{
      generated: Awaited<ReturnType<typeof generateSeed>>;
      existing: typeof seeds.$inferSelect | null;
      created: typeof seeds.$inferSelect | null;
    }> = [];

    // Check for existing seeds and create new ones
    for (const result of seedResults) {
      if (result.status === "rejected") {
        console.error("[Gen:Seed] Failed to generate seed:", result.reason);
        continue;
      }
      const generated = result.value;
      const stringId = nameToStringId(generated.name);

      // Check if seed already exists
      const existing = await db
        .select()
        .from(seeds)
        .where(eq(seeds.stringId, stringId))
        .limit(1);

      if (existing[0]) {
        results.push({
          generated,
          existing: existing[0],
          created: null,
        });
      } else {
        // Create new seed
        const newSeed = await db
          .insert(seeds)
          .values({
            stringId,
            name: generated.name,
            description: generated.description,
            rarity: generated.rarity,
            emoji: generated.emoji,
          })
          .returning();

        results.push({
          generated,
          existing: null,
          created: newSeed[0] ?? null,
        });
      }
    }

    const created = results.filter((r) => r.created !== null);
    const duplicates = results.filter((r) => r.existing !== null);

    const embed = new EmbedBuilder()
      .setTitle("🌱 Seed Generated")
      .setColor(0x90ee90)
      .setTimestamp();

    if (created.length > 0) {
      const createdList = created
        .map((r) => {
          const seed = r.created!;
          const emoji = seed.emoji ? `${seed.emoji} ` : "";
          return `${emoji}**${seed.name}** (${seed.rarity})\n${seed.description}`;
        })
        .join("\n\n");

      addLongField(
        embed,
        `✅ Created (${created.length})`,
        createdList,
        false,
      );
    }

    if (duplicates.length > 0) {
      const duplicateList = duplicates
        .map((r) => {
          const seed = r.existing!;
          const emoji = seed.emoji ? `${seed.emoji} ` : "";
          return `${emoji}**${seed.name}** (${seed.rarity})\n${seed.description}`;
        })
        .join("\n\n");

      addLongField(
        embed,
        `⚠️ Already Exists (${duplicates.length})`,
        duplicateList,
        false,
      );
    }

    if (created.length === 0 && duplicates.length === 0) {
      embed.setDescription("❌ Failed to generate any seeds.");
    } else if (created.length === amount) {
      embed.setDescription(
        `Successfully generated ${amount} new seed${amount > 1 ? "s" : ""}!`,
      );
    } else {
      embed.setDescription(
        `Generated ${created.length} new seed${created.length !== 1 ? "s" : ""} and found ${duplicates.length} duplicate${duplicates.length !== 1 ? "s" : ""}.`,
      );
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Gen:Seed] Error:", error);
    if (error instanceof Error) {
      console.error("[Gen:Seed] Error message:", error.message);
      console.error("[Gen:Seed] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while generating the seed(s).",
      });
    } catch (replyError) {
      console.error("[Gen:Seed] Failed to send error reply:", replyError);
    }
  }
}

async function handleGenIngredient(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();

    const amount = interaction.options.getInteger("amount") ?? 1;
    console.log(
      `[Gen:Ingredient] Generating ${amount} ingredient(s) for user ${interaction.user.id}`,
    );

    // Generate all ingredients in parallel
    const ingredientResults = await Promise.allSettled(
      Array.from({ length: amount }, () => generateIngredient()),
    );

    const results: Array<{
      generated: Awaited<ReturnType<typeof generateIngredient>>;
      existing: typeof ingredients.$inferSelect | null;
      created: typeof ingredients.$inferSelect | null;
    }> = [];

    // Check for existing ingredients and create new ones
    for (const result of ingredientResults) {
      if (result.status === "rejected") {
        console.error("[Gen:Ingredient] Failed to generate ingredient:", result.reason);
        continue;
      }
      const generated = result.value;
      try {
        const stringId = nameToStringId(generated.name);

        // Check if ingredient already exists
        const existing = await db
          .select()
          .from(ingredients)
          .where(eq(ingredients.stringId, stringId))
          .limit(1);

        if (existing[0]) {
          results.push({
            generated,
            existing: existing[0],
            created: null,
          });
        } else {
          // Create new ingredient
          console.log(`[Gen:Ingredient] Inserting ingredient: ${generated.name} (${stringId})`);
          const newIngredient = await db
            .insert(ingredients)
            .values({
              stringId,
              name: generated.name,
              description: generated.description,
              attributes: generated.attributes as any,
              rarity: generated.rarity,
              emoji: generated.emoji,
            })
            .returning();

          if (newIngredient[0]) {
            console.log(`[Gen:Ingredient] Successfully inserted ingredient: ${newIngredient[0].id} - ${newIngredient[0].name}`);
            results.push({
              generated,
              existing: null,
              created: newIngredient[0],
            });
          } else {
            console.error(`[Gen:Ingredient] Failed to insert ingredient: ${generated.name} - no returned value`);
            results.push({
              generated,
              existing: null,
              created: null,
            });
          }
        }
      } catch (error) {
        console.error(`[Gen:Ingredient] Error processing ingredient ${generated.name}:`, error);
        if (error instanceof Error) {
          console.error(`[Gen:Ingredient] Error message:`, error.message);
          console.error(`[Gen:Ingredient] Error stack:`, error.stack);
        }
        // Still add to results so we can show what failed
        results.push({
          generated,
          existing: null,
          created: null,
        });
      }
    }

    const created = results.filter((r) => r.created !== null);
    const duplicates = results.filter((r) => r.existing !== null);

    const embed = new EmbedBuilder()
      .setTitle("✨ Ingredient Generated")
      .setColor(0x9370db)
      .setTimestamp();

    if (created.length > 0) {
      const createdList = created
        .map((r) => {
          const ingredient = r.created!;
          const attrs = ingredient.attributes as typeof r.generated.attributes;
          const attrStr = formatAttributes(attrs);
          const emoji = ingredient.emoji ? `${ingredient.emoji} ` : "";
          return `${emoji}**${ingredient.name}** (${ingredient.rarity})\n${ingredient.description}\n${attrStr}`;
        })
        .join("\n\n");

      addLongField(
        embed,
        `✅ Created (${created.length})`,
        createdList,
        false,
      );
    }

    if (duplicates.length > 0) {
      const duplicateList = duplicates
        .map((r) => {
          const ingredient = r.existing!;
          const attrs = ingredient.attributes as typeof r.generated.attributes;
          const attrStr = formatAttributes(attrs);
          const emoji = ingredient.emoji ? `${ingredient.emoji} ` : "";
          return `${emoji}**${ingredient.name}** (${ingredient.rarity})\n${ingredient.description}\n${attrStr}`;
        })
        .join("\n\n");

      addLongField(
        embed,
        `⚠️ Already Exists (${duplicates.length})`,
        duplicateList,
        false,
      );
    }

    if (created.length === 0 && duplicates.length === 0) {
      embed.setDescription("❌ Failed to generate any ingredients.");
    } else if (created.length === amount) {
      embed.setDescription(
        `Successfully generated ${amount} new ingredient${amount > 1 ? "s" : ""}!`,
      );
    } else {
      embed.setDescription(
        `Generated ${created.length} new ingredient${created.length !== 1 ? "s" : ""} and found ${duplicates.length} duplicate${duplicates.length !== 1 ? "s" : ""}.`,
      );
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Gen:Ingredient] Error:", error);
    if (error instanceof Error) {
      console.error("[Gen:Ingredient] Error message:", error.message);
      console.error("[Gen:Ingredient] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while generating the ingredient(s).",
      });
    } catch (replyError) {
      console.error("[Gen:Ingredient] Failed to send error reply:", replyError);
    }
  }
}

async function handleGenModifier(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();

    const amount = interaction.options.getInteger("amount") ?? 1;
    console.log(
      `[Gen:Modifier] Generating ${amount} special ingredient(s) for user ${interaction.user.id}`,
    );

    // Generate all special ingredients in parallel
    const modifierResults = await Promise.allSettled(
      Array.from({ length: amount }, () => generateSpecialIngredient()),
    );

    const results: Array<{
      generated: Awaited<ReturnType<typeof generateSpecialIngredient>>;
      existing: typeof specialIngredients.$inferSelect | null;
      created: typeof specialIngredients.$inferSelect | null;
    }> = [];

    // Check for existing special ingredients and create new ones
    for (const result of modifierResults) {
      if (result.status === "rejected") {
        console.error("[Gen:Modifier] Failed to generate special ingredient:", result.reason);
        continue;
      }
      const generated = result.value;
      const stringId = nameToStringId(generated.name);

      // Check if special ingredient already exists
      const existing = await db
        .select()
        .from(specialIngredients)
        .where(eq(specialIngredients.stringId, stringId))
        .limit(1);

      if (existing[0]) {
        results.push({
          generated,
          existing: existing[0],
          created: null,
        });
      } else {
        // Create new special ingredient
        const newSpecialIngredient = await db
          .insert(specialIngredients)
          .values({
            stringId,
            name: generated.name,
            description: generated.description,
            rarity: generated.rarity,
            emoji: generated.emoji,
          })
          .returning();

        results.push({
          generated,
          existing: null,
          created: newSpecialIngredient[0] ?? null,
        });
      }
    }

    const created = results.filter((r) => r.created !== null);
    const duplicates = results.filter((r) => r.existing !== null);

    const embed = new EmbedBuilder()
      .setTitle("✨ Special Ingredient Generated")
      .setColor(0xff69b4)
      .setTimestamp();

    if (created.length > 0) {
      const createdList = created
        .map((r) => {
          const modifier = r.created!;
          const emoji = modifier.emoji ? `${modifier.emoji} ` : "";
          return `${emoji}**${modifier.name}** (${modifier.rarity})\n${modifier.description}`;
        })
        .join("\n\n");

      addLongField(
        embed,
        `✅ Created (${created.length})`,
        createdList,
        false,
      );
    }

    if (duplicates.length > 0) {
      const duplicateList = duplicates
        .map((r) => {
          const modifier = r.existing!;
          const emoji = modifier.emoji ? `${modifier.emoji} ` : "";
          return `${emoji}**${modifier.name}** (${modifier.rarity})\n${modifier.description}`;
        })
        .join("\n\n");

      addLongField(
        embed,
        `⚠️ Already Exists (${duplicates.length})`,
        duplicateList,
        false,
      );
    }

    if (created.length === 0 && duplicates.length === 0) {
      embed.setDescription("❌ Failed to generate any special ingredients.");
    } else if (created.length === amount) {
      embed.setDescription(
        `Successfully generated ${amount} new special ingredient${amount > 1 ? "s" : ""}!`,
      );
    } else {
      embed.setDescription(
        `Generated ${created.length} new special ingredient${created.length !== 1 ? "s" : ""} and found ${duplicates.length} duplicate${duplicates.length !== 1 ? "s" : ""}.`,
      );
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Gen:Modifier] Error:", error);
    if (error instanceof Error) {
      console.error("[Gen:Modifier] Error message:", error.message);
      console.error("[Gen:Modifier] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while generating the special ingredient(s).",
      });
    } catch (replyError) {
      console.error("[Gen:Modifier] Failed to send error reply:", replyError);
    }
  }
}

export const command = {
  data: new SlashCommandBuilder()
    .setName("gen")
    .setDescription("Generate AI content for game items")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("seed")
        .setDescription("Generate a new seed")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Number of seeds to generate")
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ingredient")
        .setDescription("Generate a new ingredient")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Number of ingredients to generate")
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("modifier")
        .setDescription("Generate a new special ingredient")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Number of special ingredients to generate")
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(false),
        ),
    ),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "seed":
        await handleGenSeed(interaction);
        break;
      case "ingredient":
        await handleGenIngredient(interaction);
        break;
      case "modifier":
        await handleGenModifier(interaction);
        break;
      default:
        await interaction.reply({
          content: "❌ Unknown subcommand.",
          flags: MessageFlags.Ephemeral,
        });
    }
  },
};
