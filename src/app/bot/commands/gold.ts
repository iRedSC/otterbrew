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
    console.log(`[Gold] Command started for user ${interaction.user.id}`);
    
    try {
      console.log(`[Gold] Deferring reply...`);
      await interaction.deferReply();
      console.log(`[Gold] Reply deferred, fetching user data...`);

      const user = await getOrCreateUser(interaction.user.id);
      console.log(`[Gold] User data retrieved:`, {
        discordId: user.discordId,
        gold: user.gold,
      });

      console.log(`[Gold] Building embed...`);
      const embed = new EmbedBuilder()
        .setTitle("💰 Gold Balance")
        .setDescription(`You have **${user.gold.toLocaleString()}** gold`)
        .setColor(0xffd700)
        .setTimestamp();

      console.log(`[Gold] Sending editReply...`);
      await interaction.editReply({ embeds: [embed] });
      console.log(`[Gold] Reply sent successfully`);
    } catch (error) {
      console.error("[Gold] Error in /gold command:", error);
      if (error instanceof Error) {
        console.error("[Gold] Error message:", error.message);
        console.error("[Gold] Error stack:", error.stack);
      }
      try {
        await interaction.editReply({
          content: "❌ An error occurred while fetching your gold balance.",
        });
      } catch (replyError) {
        console.error("[Gold] Failed to send error reply:", replyError);
      }
    }
  },
};
