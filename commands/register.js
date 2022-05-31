const { SlashCommandBuilder } = require('@discordjs/builders');
const UserController = require('../controllers/UserController.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('register')
		.setDescription('Register with SaltyBot'),


	async execute(interaction) {
		const { user } = interaction;
		const results = await Users.findOne({ where: { username: user.tag } });
		if (!results) {
			try {
				const newUser = await Users.create({
					user_id: user.id,
					username: user.tag,
					stash: 2000,
				});
				logger.info(`Adding new user ${user.tag} to database: ${JSON.stringify(newUser)}`);
				await interaction.reply({ content: 'You have been registered with 2000 Salt!', ephemeral: true });
			}
			catch (err) {
				logger.error(err);
				await interaction.reply('Something got fucky wucky, please try again');
			}
		}
		else {
			await interaction.reply({ content: 'User already exists! Check your stash with /stash', ephemeral: true });
			return;
		}
	},
};