import { db } from "@db";
import type { Command } from "@definitions/command";
import { createUser, getByDiscordID, setGold } from "@queries/users_sql";
import { SlashCommandBuilder } from "discord.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("gold")
    .setDescription("Manage a user's gold balance.")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add gold to your account.")
        .addIntegerOption((opt) =>
          opt.setName("amount").setDescription("Amount to add").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove gold from your account.")
        .addIntegerOption((opt) =>
          opt.setName("amount").setDescription("Amount to remove").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("get")
        .setDescription("Get your current gold balance.")
    ),

  async execute(interaction) {
    const username = interaction.user.globalName

    const sub = interaction.options.getSubcommand();
    const discordId = interaction.user.id;
    console.log(`${username}: /gold ${sub}`)
    
    let user = await getByDiscordID(db, {discordId: discordId});
    console.log(`Found user ${user}`)
    if (!user) {
        await interaction.reply(`No user found.`);
        return;
    }
    
    if (sub === "get") {
        await interaction.reply(`You have ${user.gold} gold.`);
        return;
    }
    
    const amount = interaction.options.getInteger("amount", true);
    const newGold =
      sub === "add" ? user.gold + amount : Math.max(0, user.gold - amount);

    await setGold(db, {discordId: user.discordId, gold: newGold});

    await interaction.reply(
      `Your gold has been ${sub === "add" ? "increased" : "decreased"} to ${newGold}.`
    );
  },
};