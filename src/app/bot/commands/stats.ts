import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";
import {
  formatEffectsList,
  groupEffectsByStat,
} from "../../services/effects/index.js";
import type { ActiveEffect } from "../../services/effects/types.js";
import { addLongField } from "../utils/embed-helpers.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View your player statistics"),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    console.log(`[Stats] Command started for user ${interaction.user.id}`);
    
    try {
      console.log(`[Stats] Deferring reply...`);
      await interaction.deferReply();
      console.log(`[Stats] Reply deferred, fetching user data...`);

      const user = await getOrCreateUser(interaction.user.id);
      console.log(`[Stats] User data retrieved:`, {
        discordId: user.discordId,
        gold: user.gold,
      });

      // Get all active effects
      const allEffects: ActiveEffect[] =
        (user.activeEffects as ActiveEffect[]) ?? [];
      const now = Date.now();
      const activeEffects = allEffects.filter(
        (effect) => effect.expiresAt === null || effect.expiresAt >= now,
      );

      console.log(`[Stats] Building embed...`);
      const embed = new EmbedBuilder()
        .setTitle(`${interaction.user.username}'s Statistics`)
        .setColor(0x5865f2)
        .addFields(
          {
            name: "💰 Gold",
            value: user.gold.toString(),
            inline: true,
          },
          {
            name: "🧪 Potions Discovered",
            value: user.potionsDiscovered.toString(),
            inline: true,
          },
          {
            name: "⚗️ Potions Brewed",
            value: user.potionsBrewed.toString(),
            inline: true,
          },
          {
            name: "💎 Total Gold Earned",
            value: user.totalGoldEarned.toString(),
            inline: true,
          },
          {
            name: "🗺️ Adventures Completed",
            value: user.adventuresCompleted.toString(),
            inline: true,
          },
          {
            name: "🏪 Bazaar Encounters",
            value: user.bazaarEncountersCompleted.toString(),
            inline: true,
          },
          {
            name: "📚 Grimoires Collected",
            value: user.grimoiresCollected.toString(),
            inline: true,
          },
          {
            name: "🎒 Inventory Slots",
            value: `${user.maxInventorySlots} max`,
            inline: true,
          },
        )
        .setTimestamp()
        .setFooter({
          text: `Player since ${new Date(user.createdAt).toLocaleDateString()}`,
        });

      // Add active effects section if any exist
      if (activeEffects.length > 0) {
        const groupedEffects = groupEffectsByStat(activeEffects);
        const effectFields: string[] = [];

        for (const [stat, effects] of Object.entries(groupedEffects)) {
          const effectsText = formatEffectsList(effects);
          effectFields.push(`**${stat}**:\n${effectsText}`);
        }

        const effectsText = effectFields.join("\n\n");
        addLongField(embed, "✨ Active Effects", effectsText);
      } else {
        embed.addFields({
          name: "✨ Active Effects",
          value: "No active effects",
        });
      }

      console.log(`[Stats] Sending editReply...`);
      await interaction.editReply({ embeds: [embed] });
      console.log(`[Stats] Reply sent successfully`);
    } catch (error) {
      console.error("[Stats] Error in /stats command:", error);
      if (error instanceof Error) {
        console.error("[Stats] Error message:", error.message);
        console.error("[Stats] Error stack:", error.stack);
      }
      try {
        await interaction.editReply({
          content: "❌ An error occurred while fetching your statistics.",
        });
      } catch (replyError) {
        console.error("[Stats] Failed to send error reply:", replyError);
      }
    }
  },
};
