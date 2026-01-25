import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View your player statistics"),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    await interaction.deferReply();

    try {
      const user = await getOrCreateUser(interaction.user.id);

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
        )
        .setTimestamp()
        .setFooter({
          text: `Player since ${new Date(user.createdAt).toLocaleDateString()}`,
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in /stats command:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching your statistics.",
      });
    }
  },
};
