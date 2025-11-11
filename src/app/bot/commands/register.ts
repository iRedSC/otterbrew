import { db } from "@db";
import type { Command } from "@definitions/command";
import { createUser } from "@queries/users_sql";

import { SlashCommandBuilder } from "discord.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register into the game!"),

  async execute(interaction) {
    const user = createUser(db, {discordId: interaction.user.id})
    await interaction.reply("Your user has been registered!");
  },
};