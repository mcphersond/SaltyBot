const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users } = require('../db_objects.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register with SaltyBot'),


	async execute(interaction) {
		const { user } = interaction;
		try {
			const newUser = await Users.create({
				user_id: user.id,
				username: user.tag,
				stash: 2000,
			});
			console.log(`Adding new user to database: \n${JSON.stringify(newUser)}`);
			await interaction.reply('You have been registered with 2000 Salt!');
		}
		catch (err) {
			console.log(err);
			await interaction.reply('Something got fucky wucky, please try again');
		}
	},
};