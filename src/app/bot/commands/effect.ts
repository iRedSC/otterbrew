import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type AutocompleteInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { randomUUID } from "node:crypto";
import { addEffect } from "../../services/effects/index.js";
import type {
  AffectedStat,
  EffectOperation,
  EffectTrigger,
} from "../../services/effects/types.js";
import {
  statEffectConfigs,
  isOperationSupported,
  isTriggerSupported,
} from "../../services/effects/config.js";

// Stat options for autocomplete
const STAT_OPTIONS: { name: string; value: AffectedStat }[] = [
  { name: "Gold", value: "gold" },
  { name: "Mana", value: "mana" },
  { name: "Brew Time", value: "brew_time" },
  { name: "Garden Growth Time", value: "garden_growth_time" },
  { name: "Garden Yield", value: "garden_yield" },
  { name: "Shop Reroll Cost", value: "shop_reroll_cost" },
  { name: "Adventure Cooldown", value: "adventure_cooldown" },
  { name: "Bazaar Cooldown", value: "bazaar_cooldown" },
  { name: "Ingredient Quality", value: "ingredient_quality" },
  { name: "Customer Satisfaction", value: "customer_satisfaction" },
  { name: "Discovery Bonus", value: "discovery_bonus" },
  { name: "Story Difficulty", value: "story_difficulty" },
];

// Operation options
const OPERATION_OPTIONS: { name: string; value: EffectOperation }[] = [
  { name: "Multiply", value: "multiply" },
  { name: "Add", value: "add" },
  { name: "Subtract", value: "subtract" },
  { name: "Set", value: "set" },
  { name: "Add Over Time", value: "add_over_time" },
  { name: "Subtract Over Time", value: "subtract_over_time" },
];

// Trigger options
const TRIGGER_OPTIONS: { name: string; value: EffectTrigger }[] = [
  { name: "Value (Instant)", value: "value" },
  { name: "Change Good", value: "change_good" },
  { name: "Change Bad", value: "change_bad" },
  { name: "Brewing", value: "brewing" },
  { name: "Adventure", value: "adventure" },
  { name: "Bazaar", value: "bazaar" },
  { name: "Combat", value: "combat" },
  { name: "Harvesting", value: "harvesting" },
  { name: "Shopping", value: "shopping" },
  { name: "On Consume", value: "on_consume" },
  { name: "On Craft", value: "on_craft" },
  { name: "Periodic", value: "periodic" },
];

export const command = {
  data: new SlashCommandBuilder()
    .setName("effect")
    .setDescription("Apply an effect (dev/testing only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("stat")
        .setDescription("Stat to affect")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("operation")
        .setDescription("Operation type")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addStringOption((option) =>
      option
        .setName("trigger")
        .setDescription("Trigger type")
        .setRequired(true)
        .setAutocomplete(true),
    )
    .addNumberOption((option) =>
      option
        .setName("value")
        .setDescription("Effect value")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription("Duration in seconds (0 for permanent)")
        .setRequired(false)
        .setMinValue(0),
    )
    .addIntegerOption((option) =>
      option
        .setName("tick_interval")
        .setDescription("Tick interval in seconds (for over_time/periodic)")
        .setRequired(false)
        .setMinValue(1),
    )
    .addStringOption((option) =>
      option
        .setName("display_name")
        .setDescription("Display name for the effect")
        .setRequired(false)
        .setMaxLength(100),
    )
    .addStringOption((option) =>
      option
        .setName("source_potion")
        .setDescription("Source potion name")
        .setRequired(false)
        .setMaxLength(50),
    ),
  async autocomplete(
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    const focused = interaction.options.getFocused(true);
    const statOption = interaction.options.getString("stat");

    try {
      if (focused.name === "stat") {
        // Filter stats based on search
        const filtered = STAT_OPTIONS.filter((stat) =>
          stat.name.toLowerCase().includes(focused.value.toLowerCase()),
        );
        await interaction.respond(
          filtered.slice(0, 25).map((stat) => ({
            name: stat.name,
            value: stat.value,
          })),
        );
      } else if (focused.name === "operation") {
        // Filter operations based on selected stat
        let filtered = OPERATION_OPTIONS;
        if (statOption) {
          const config = statEffectConfigs[statOption as AffectedStat];
          if (config) {
            filtered = OPERATION_OPTIONS.filter((op) =>
              config.supportedOperations.includes(op.value),
            );
          }
        }

        // Further filter by search
        filtered = filtered.filter((op) =>
          op.name.toLowerCase().includes(focused.value.toLowerCase()),
        );

        await interaction.respond(
          filtered.slice(0, 25).map((op) => ({
            name: op.name,
            value: op.value,
          })),
        );
      } else if (focused.name === "trigger") {
        // Filter triggers based on selected stat
        let filtered = TRIGGER_OPTIONS;
        if (statOption) {
          const config = statEffectConfigs[statOption as AffectedStat];
          if (config) {
            filtered = TRIGGER_OPTIONS.filter((trigger) =>
              config.supportedTriggers.includes(trigger.value),
            );
          }
        }

        // Further filter by search
        filtered = filtered.filter((trigger) =>
          trigger.name.toLowerCase().includes(focused.value.toLowerCase()),
        );

        await interaction.respond(
          filtered.slice(0, 25).map((trigger) => ({
            name: trigger.name,
            value: trigger.value,
          })),
        );
      }
    } catch (error) {
      console.error("[Effect] Autocomplete error:", error);
    }
  },
  execute: async (
    interaction: ChatInputCommandInteraction,
  ): Promise<void> => {
    console.log(`[Effect] Command started for user ${interaction.user.id}`);

    try {
      await interaction.deferReply();

      const stat = interaction.options.getString("stat", true) as AffectedStat;
      const operation = interaction.options.getString(
        "operation",
        true,
      ) as EffectOperation;
      const trigger = interaction.options.getString(
        "trigger",
        true,
      ) as EffectTrigger;
      const value = interaction.options.getNumber("value", true);
      const duration = interaction.options.getInteger("duration") ?? 300; // Default 5 minutes
      const tickInterval = interaction.options.getInteger("tick_interval");
      const displayName =
        interaction.options.getString("display_name") ??
        `${operation} ${stat} (${trigger})`;
      const sourcePotion =
        interaction.options.getString("source_potion") ?? "Dev Effect";

      // Validate stat, operation, and trigger combination
      const config = statEffectConfigs[stat];
      if (!config) {
        await interaction.editReply({
          content: `❌ Invalid stat: ${stat}`,
        });
        return;
      }

      if (!isOperationSupported(stat, operation)) {
        await interaction.editReply({
          content: `❌ Operation '${operation}' is not supported for stat '${stat}'`,
        });
        return;
      }

      if (!isTriggerSupported(stat, trigger)) {
        await interaction.editReply({
          content: `❌ Trigger '${trigger}' is not supported for stat '${stat}'`,
        });
        return;
      }

      // Validate tickInterval for over_time and periodic
      if (
        (operation === "add_over_time" ||
          operation === "subtract_over_time" ||
          trigger === "periodic") &&
        !tickInterval
      ) {
        await interaction.editReply({
          content:
            "❌ tick_interval is required for over_time operations and periodic triggers",
        });
        return;
      }

      // Create effect
      const effectId = randomUUID();
      const now = Date.now();
      const expiresAt = duration === 0 ? null : now + duration * 1000;

      await addEffect(interaction.user.id, {
        effectId,
        stat,
        operation,
        trigger,
        value,
        appliedAt: now,
        expiresAt,
        tickInterval: tickInterval ?? undefined,
        lastTickAt: now,
        sourcePotion,
        displayName,
      });

      const embed = new EmbedBuilder()
        .setTitle("✨ Effect Applied")
        .setDescription(`Successfully applied effect to ${interaction.user.username}`)
        .addFields(
          {
            name: "Stat",
            value: stat,
            inline: true,
          },
          {
            name: "Operation",
            value: operation,
            inline: true,
          },
          {
            name: "Trigger",
            value: trigger,
            inline: true,
          },
          {
            name: "Value",
            value: value.toString(),
            inline: true,
          },
          {
            name: "Duration",
            value: duration === 0 ? "Permanent" : `${duration}s`,
            inline: true,
          },
          {
            name: "Display Name",
            value: displayName,
            inline: false,
          },
        )
        .setColor(0x5865f2)
        .setTimestamp();

      if (tickInterval) {
        embed.addFields({
          name: "Tick Interval",
          value: `${tickInterval}s`,
          inline: true,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("[Effect] Error in /effect command:", error);
      if (error instanceof Error) {
        console.error("[Effect] Error message:", error.message);
        console.error("[Effect] Error stack:", error.stack);
      }
      try {
        await interaction.editReply({
          content: "❌ An error occurred while applying the effect.",
        });
      } catch (replyError) {
        console.error("[Effect] Failed to send error reply:", replyError);
      }
    }
  },
};
