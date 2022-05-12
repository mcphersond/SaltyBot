const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Users } = require('../db_objects.js');
const { icon, footer } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stash')
		.setDescription('View your current salt stash'),
	async execute(interaction) {
		const user = interaction.user;
		let results = await Users.findOne({ where: { username: user.tag } });
		if (!results) {
			try {
				results = await Users.create({
					user_id: user.id,
					username: user.tag,
					stash: 2000,
				});
				console.log(`Adding new user to database: \n${JSON.stringify(results)}`);
			}
			catch (err) {
				console.log(err);
				await interaction.reply({ content: 'Something went wrong.', ephemeral: true });
			}
		}
		const embed = new MessageEmbed()
			.setColor('#10b981')
			.setTitle(`$${results.stash}`)
			.setAuthor({ name: user.tag, iconURL: icon })
		// .setDescription('```TODO winrates, joindates```')
			.setTimestamp()
			.setFooter({ text: footer, iconURL: icon });
		await interaction.reply({ content: { embeds: [embed] }, ephemeral: true });
	},
};