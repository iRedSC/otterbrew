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
import { formatAttributes } from "../utils/embed-helpers.js";

async function handleGenSeed(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  try {
    await interaction.deferReply();

    console.log(`[Gen:Seed] Generating seed for user ${interaction.user.id}`);

    const generated = await generateSeed();
    const stringId = nameToStringId(generated.name);

    // Check if seed already exists
    const existing = await db
      .select()
      .from(seeds)
      .where(eq(seeds.stringId, stringId))
      .limit(1);

    if (existing[0]) {
      const embed = new EmbedBuilder()
        .setTitle("🌱 Seed Generated")
        .setDescription(
          `A seed with this name already exists! Here's the existing seed:`,
        )
        .setColor(0x90ee90)
        .addFields(
          {
            name: "Name",
            value: existing[0].name,
            inline: true,
          },
          {
            name: "Rarity",
            value: existing[0].rarity,
            inline: true,
          },
          {
            name: "Description",
            value: existing[0].description,
          },
        )
        .setTimestamp();

      if (existing[0].emoji) {
        embed.setDescription(
          `${existing[0].emoji} ${existing[0].name} already exists!`,
        );
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

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

    if (!newSeed[0]) {
      throw new Error("Failed to create seed in database");
    }

    const embed = new EmbedBuilder()
      .setTitle("🌱 Seed Generated")
      .setDescription(
        `Successfully generated a new seed: **${newSeed[0].name}**`,
      )
      .setColor(0x90ee90)
      .addFields(
        {
          name: "Name",
          value: newSeed[0].name,
          inline: true,
        },
        {
          name: "Rarity",
          value: newSeed[0].rarity,
          inline: true,
        },
        {
          name: "Description",
          value: newSeed[0].description,
        },
      )
      .setTimestamp();

    if (newSeed[0].emoji) {
      embed.setDescription(
        `Successfully generated: ${newSeed[0].emoji} **${newSeed[0].name}**`,
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
        content: "❌ An error occurred while generating the seed.",
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

    console.log(
      `[Gen:Ingredient] Generating ingredient for user ${interaction.user.id}`,
    );

    const generated = await generateIngredient();
    const stringId = nameToStringId(generated.name);

    // Check if ingredient already exists
    const existing = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.stringId, stringId))
      .limit(1);

    if (existing[0]) {
      const attrs = existing[0].attributes as typeof generated.attributes;
      const attrStr = formatAttributes(attrs);

      const embed = new EmbedBuilder()
        .setTitle("✨ Ingredient Generated")
        .setDescription(
          `An ingredient with this name already exists! Here's the existing ingredient:`,
        )
        .setColor(0x9370db)
        .addFields(
          {
            name: "Name",
            value: existing[0].name,
            inline: true,
          },
          {
            name: "Description",
            value: existing[0].description,
          },
          {
            name: "Attributes",
            value: attrStr,
          },
        )
        .setTimestamp();

      if (existing[0].emoji) {
        embed.setDescription(
          `${existing[0].emoji} ${existing[0].name} already exists!`,
        );
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Create new ingredient
    const newIngredient = await db
      .insert(ingredients)
      .values({
        stringId,
        name: generated.name,
        description: generated.description,
        attributes: generated.attributes as any,
        emoji: generated.emoji,
      })
      .returning();

    if (!newIngredient[0]) {
      throw new Error("Failed to create ingredient in database");
    }

    const attrs = newIngredient[0].attributes as typeof generated.attributes;
    const attrStr = formatAttributes(attrs);

    const embed = new EmbedBuilder()
      .setTitle("✨ Ingredient Generated")
      .setDescription(
        `Successfully generated a new ingredient: **${newIngredient[0].name}**`,
      )
      .setColor(0x9370db)
      .addFields(
        {
          name: "Name",
          value: newIngredient[0].name,
          inline: true,
        },
        {
          name: "Description",
          value: newIngredient[0].description,
        },
        {
          name: "Attributes",
          value: attrStr,
        },
      )
      .setTimestamp();

    if (newIngredient[0].emoji) {
      embed.setDescription(
        `Successfully generated: ${newIngredient[0].emoji} **${newIngredient[0].name}**`,
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
        content: "❌ An error occurred while generating the ingredient.",
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

    console.log(
      `[Gen:Modifier] Generating special ingredient for user ${interaction.user.id}`,
    );

    const generated = await generateSpecialIngredient();
    const stringId = nameToStringId(generated.name);

    // Check if special ingredient already exists
    const existing = await db
      .select()
      .from(specialIngredients)
      .where(eq(specialIngredients.stringId, stringId))
      .limit(1);

    if (existing[0]) {
      const embed = new EmbedBuilder()
        .setTitle("✨ Special Ingredient Generated")
        .setDescription(
          `A special ingredient with this name already exists! Here's the existing one:`,
        )
        .setColor(0xff69b4)
        .addFields(
          {
            name: "Name",
            value: existing[0].name,
            inline: true,
          },
          {
            name: "Rarity",
            value: existing[0].rarity,
            inline: true,
          },
          {
            name: "Description",
            value: existing[0].description,
          },
        )
        .setTimestamp();

      if (existing[0].emoji) {
        embed.setDescription(
          `${existing[0].emoji} ${existing[0].name} already exists!`,
        );
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

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

    if (!newSpecialIngredient[0]) {
      throw new Error("Failed to create special ingredient in database");
    }

    const embed = new EmbedBuilder()
      .setTitle("✨ Special Ingredient Generated")
      .setDescription(
        `Successfully generated a new special ingredient: **${newSpecialIngredient[0].name}**`,
      )
      .setColor(0xff69b4)
      .addFields(
        {
          name: "Name",
          value: newSpecialIngredient[0].name,
          inline: true,
        },
        {
          name: "Rarity",
          value: newSpecialIngredient[0].rarity,
          inline: true,
        },
        {
          name: "Description",
          value: newSpecialIngredient[0].description,
        },
      )
      .setTimestamp();

    if (newSpecialIngredient[0].emoji) {
      embed.setDescription(
        `Successfully generated: ${newSpecialIngredient[0].emoji} **${newSpecialIngredient[0].name}**`,
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
        content: "❌ An error occurred while generating the special ingredient.",
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
        .setName("seeds")
        .setDescription("Generate a new seed"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ingredients")
        .setDescription("Generate a new ingredient"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("modifiers")
        .setDescription("Generate a new special ingredient"),
    ),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "seeds":
        await handleGenSeed(interaction);
        break;
      case "ingredients":
        await handleGenIngredient(interaction);
        break;
      case "modifiers":
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
