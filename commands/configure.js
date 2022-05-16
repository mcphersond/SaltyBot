const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users } = require('../db_objects.js');
const { logger } = require('../logger.js');
const { devId } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config')
		.setDescription('Set a default amount to wager. You can still specify an amount when using /bet.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('bet')
				.setDescription('Set your default bet amount.')
				.addIntegerOption(option =>
					option.setName('amount')
						.setDescription('How much salt do you want to bet by default?')
						.setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('shutdown')
				.setDescription('Shutdown the bot. Only available to developers.'),
		),


	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		// Set default wager
		if (subcommand === 'bet') {
			// Get inputs and validate them.
			const { user } = interaction;
			const amount = interaction.options.getInteger('amount');

			if (amount <= 0) {
				await interaction.reply({ content:'You can\'t bet less than 1 salt. Please try again.', ephemeral: true });
				return;
			}

			// Try to find the user's account. If they don't have one, make one.
			let account = await Users.findOne({ where: { user_id: user.id } });
			if (!account) {
				try {
					account = await Users.create({
						user_id: user.id,
						username: user.tag,
						stash: 2000,
					});
					logger.info(`Adding new user ${user.tag} to database: ${JSON.stringify(account)}`);
				}
				catch (err) {
					logger.error(err);
					await interaction.reply('Something went wrong.');
				}
			}

			// Set the user's defaultWager.
			try {
				await Users.update(
					{
						defaultWager: amount,
					},
					{
						where: { user_id: user.id },
					},
				);
				logger.info(`Updated User ${user.tag}'s default wager: ${JSON.stringify(amount)}`);
				await interaction.reply({ content: 'Your default bet is now **$' + amount + '**\nYou can still specify another amount using `/bet $name $choice $amount`\nIf you can\'t afford this amount in the future, your bet will be the maximum amount that you can afford.', ephemeral: true });
			}
			catch (err) {
				await interaction.reply('We couldn\'t update your default wager amount.');
				logger.info(err);
			}
		}
		// Shutdown the bot.
		else if (subcommand === 'shutdown') {
			const { user } = interaction;
			if (devId.includes(user.id)) {
				await interaction.reply({ content:'Bye bye.', ephemeral: true });
				logger.warn(`Shutdown process initiated by ${interaction.user.tag}. Shutting down.`);
				process.exit();
			}
			await interaction.reply({ content:'Only developers can use this command.', ephemeral: true });

		}

	},
};