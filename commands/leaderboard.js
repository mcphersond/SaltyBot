const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const { logger } = require('../logger.js');
const utils = require('../utils.js');
const UserController = require('../controllers/UserController.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Who has the most crippling gambling addiction?'),
	async execute(interaction, client) {
		try {
			const results = await UserController.getLeaders(undefined, interaction.member.guild.id, client);

			// Add some buttons for quick interactions.
			let buttons = new utils.ButtonList();
			buttons.push(
				new MessageButton()
					.setCustomId(`lbSort_wlratio`)
					.setLabel('W/L Ratio')
					.setStyle('SECONDARY')
			);
			buttons.push(
				new MessageButton()
					.setCustomId(`lbSort_wins`)
					.setLabel('Wins')
					.setStyle('SECONDARY')
			);
			buttons.push(
				new MessageButton()
					.setCustomId(`lbSort_losses`)
					.setLabel('Losses')
					.setStyle('SECONDARY')
			);
			buttons.push(
				new MessageButton()
					.setCustomId(`lbSort_betsplaced`)
					.setLabel('Bets Placed')
					.setStyle('SECONDARY')
			);
			buttons.push(
				new MessageButton()
					.setCustomId(`lbSort_stash`)
					.setLabel('Stash Size')
					.setStyle('SECONDARY')
			);
			const rows = buttons.getComponentList();
			console.log(results);
			// Find Column widths for users and stash amounts.
			const usernameLength = Math.max('User'.length, ...(results.map(user => user.nickname.length)));
			const stashLength = Math.max('Stash'.length, ...(results.map(user => user.stash.toString().length)));

			// Build a table of winners.
			let table = `# ${'User'.padEnd(usernameLength)}    ${'Stash'.padEnd(stashLength)}    W/L     Won    Lost    Placed\n`;
			for (let i = 0; i < results.length; i++) {
				const user = results[i];
				const line = `${ i+1 } ${ user.nickname.padEnd(usernameLength) }    ${ user.stash.toString().padEnd(stashLength) }    ${ user.wl_ratio.toFixed(2) }    ${ user.wins.toString().padEnd(3) }    ${ user.losses.toString().padEnd(4) }    ${user.bets_placed}\n`;
				table += line;
			}
			
			const embed = new MessageEmbed()
				.setColor('#10b981')
				.setTitle('Leaderboard')
				.setDescription('```' + table + '```Get leaderboards for different statistics using the buttons below.');
			await interaction.reply({ embeds: [embed], components: rows });
		} catch(err) {
			logger.error('/leaderboard: ', err);
			await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
		}
	},
};