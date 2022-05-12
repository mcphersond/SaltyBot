const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Users } = require('../db_objects.js');
const { icon, footer } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Who has the most crippling gambling addiction?'),
	async execute(interaction) {
		let results = await Users.find({ order: ['stash', 'DESC'], limit: 10 });
		if (!results) {
			await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
		}

		//Build a table of winners.
		let table = '';
		for (let i = 0; i < results.length; i++) {
			let user = results[i];
			let line = `${ user.username }  ${ user.stash }\n`;
			table += line;
		}

		let winrate = results.wins;
		if (results.losses > 0) winrate = results.wins / results.losses;
		const embed = new MessageEmbed()
			.setColor('#10b981')
			.setTitle(`Leaderboard`)
			.setDescription('```' + table + '```')
		await interaction.reply({ embeds: [embed] });
	},
};