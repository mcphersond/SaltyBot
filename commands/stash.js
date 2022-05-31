const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const UserController = require('../controllers/UserController.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stash')
		.setDescription('View your current salt stash'),


	async execute(interaction, client) {

		
		// Look up the user.
		var { user } = await UserController.findOrCreateUser(interaction.user, interaction.member.guild.id);
		
		var displayName = await UserController.getDisplayName(user, client);

		const embed = new MessageEmbed()
			.setColor('#10b981')
			.setTitle(`$${user.stash}`)
			.setAuthor({ name: displayName, iconURL: interaction.user.avatarURL() })
			.addFields(
				{ name: 'W/L Ratio', value: user.wl_ratio.toFixed(2), inline: true },
				{ name: 'Bets Placed', value: '' + user.bets_placed, inline: true },
				{ name: 'Default Wager', value: '$' + user.default_wager, inline: true },
			);
		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};