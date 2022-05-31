const { Wagers, Bets, Choices } = require('../../db_objects.js');
const { MessageEmbed } = require('discord.js');
const utils = require('../../utils.js');
const UserController = require('../../controllers/UserController');
const { logger } = require('../../logger.js');

module.exports = {
  data: {
    name: 'lbSort'
  },

  async execute(interaction, client) {
    // Decode inputs based on the button's customId.
    var customIdComponents = interaction.customId.split('_');
    var sortBy = customIdComponents[1];
		
		const results = await UserController.getLeaders(sortBy, interaction.member.guild.id, client);
		// Find Column widths for users and stash amounts.
		const usernameLength = Math.min(27, Math.max('User'.length, ...(results.map(user => user.nickname.length))));
		const stashLength = Math.max('Stash'.length, ...(results.map(user => user.stash.toString().length)));

		// Build a table of winners.
		let table = `# ${'User'.padEnd(usernameLength)}  ${'Stash'.padEnd(stashLength)}  W/L   Won  Lost  Placed\n`;
		for (let i = 0; i < results.length; i++) {
			const user = results[i];
			const line = `${ i+1 } ${ user.nickname.padEnd(usernameLength).substring(0, 27) }  ${ user.stash.toString().padEnd(stashLength) }  ${ user.wl_ratio.toFixed(2) }  ${ user.wins.toString().padEnd(3) }  ${ user.losses.toString().padEnd(4) }  ${user.bets_placed}\n`;
			table += line;
		}

		const embed = new MessageEmbed()
			.setColor('#10b981')
			.setTitle(`Leaderboard (${sortBy})`)
			.setDescription('```' + table + '```Sort by different statistics using the buttons below.');

		interaction.message.edit({ embeds: [embed] });

		return interaction.deferUpdate();
	}
}