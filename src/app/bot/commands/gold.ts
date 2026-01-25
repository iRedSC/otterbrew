import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { getOrCreateUser } from "../../services/user-service.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("gold")
    .setDescription("View your current gold balance"),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    await interaction.deferReply();

    try {
      const user = await getOrCreateUser(interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle("💰 Gold Balance")
        .setDescription(`You have **${user.gold.toLocaleString()}** gold`)
        .setColor(0xffd700)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in /gold command:", error);
      await interaction.editReply({
        content: "❌ An error occurred while fetching your gold balance.",
      });
    }
  },
};
