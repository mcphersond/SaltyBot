const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Users } = require('../db_objects.js');
const { icon, footer } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stash')
        .setDescription('View your current salt stash'),
    async execute(interaction) {
        let user = interaction.user;
        let results = await Users.findOne({ where: { username: user.tag }});
        console.log(results);
        const embed = new MessageEmbed()
            .setColor('#10b981')
            .setTitle(`$${results.stash}`)
            .setAuthor({ name: user.tag, iconURL: icon })
            //.setDescription('```TODO winrates, joindates```')
            .setTimestamp()
            .setFooter({ text: footer, iconURL: icon });
        await interaction.reply({ embeds: [embed] });
    },
};