const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Users } = require('../db_objects.js');
const { logger } = require('../logger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Who has the most crippling gambling addiction?'),
	async execute(interaction) {
		const results = await Users.findAll({ order:[ ['stash', 'DESC'] ], limit: 10 });
		if (!results) {
			await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
		}

		const usernameLength = Math.max('User'.length, ...(results.map(user => user.username.length)));
		const stashLength = Math.max('Stash'.length, ...(results.map(user => user.stash.toString().length)));

		// Build a table of winners.
		let table = `# ${'User'.padEnd(usernameLength)}    ${'Stash'.padEnd(stashLength)}    W/L     Bets Won\n`;
		for (let i = 0; i < results.length; i++) {
			const user = results[i];
			let winrate = user.wins.toFixed(2);
			if (user.losses > 0) winrate = (user.wins / user.losses).toFixed(2);
			const line = `${ i + 1 } ${ user.username.padEnd(usernameLength) }    ${ user.stash.toString().padEnd(stashLength) }    ${ winrate }    ${ user.wins }\n`;
			table += line;
		}

		const embed = new MessageEmbed()
			.setColor('#10b981')
			.setTitle('Leaderboard')
			.setDescription('```' + table + '```');
		await interaction.reply({ embeds: [embed] });
	},
};