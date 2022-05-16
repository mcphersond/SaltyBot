const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users, Bets, Wagers, Choices } = require('../db_objects.js');
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
				.setName('set')
				.setDescription('Set a users stash.')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('Which user would you like to set?')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('amount')
						.setDescription('What to set the users stash to?')
						.setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('give')
				.setDescription('Give a user a specific amount of salt.')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('Which user would you like to give salt to?')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('amount')
						.setDescription('How much salt to give?')
						.setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('take')
				.setDescription('Remove salt from a users stash.')
				.addUserOption(option =>
					option.setName('user')
						.setDescription('Which user would you like to take salt from?')
						.setRequired(true))
				.addIntegerOption(option =>
					option.setName('amount')
						.setDescription('How much salt to remove?')
						.setRequired(true)),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Remove a specific bet.')
				.addStringOption(option =>
					option.setName('betname')
						.setDescription('Which bet would you like removed?')
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

		// Set users stash amount.
		else if (subcommand === 'set') {
			const user = interaction.options.getUser('user');
			const amount = interaction.options.getInteger('amount');
			let account = await Users.findOne({ where: { user_id: user.id } });
			if (!account) {
				try {
					account = await Users.create({
						user_id: user.id,
						username: user.tag,
						stash: amount,
					});
					logger.info(`Adding new user to database: \n${JSON.stringify(account)}`);
					await interaction.reply({ content:'User stash updated.', ephemeral: true });
				}
				catch (err) {
					logger.error(err);
					await interaction.reply({ content:'Something went wrong.', ephemeral: true });
				}
			}
			else {
				account.stash = amount;
				if (account.stash < 200) { account.stash = 200; }
				try {
					await Users.update(
						{
							stash: Math.floor(account.stash),
						},
						{
							where: { user_id: user.id },
						},
					);
					await interaction.reply({ content:'User stash updated.', ephemeral: true });
				}
				catch (err) {
					await interaction.reply({ content:'Something went wrong.', ephemeral: true });
					logger.error(err);
				}

			}
		}

		// Give ${amount} to users stash.
		else if (subcommand === 'give') {
			const user = interaction.options.getUser('user');
			const amount = interaction.options.getInteger('amount');
			let account = await Users.findOne({ where: { user_id: user.id } });
			if (!account) {
				try {
					account = await Users.create({
						user_id: user.id,
						username: user.tag,
						stash: 2000 + amount,
					});
					logger.info(`Adding new user to database: \n${JSON.stringify(account)}`);
					await interaction.reply({ content:'User stash updated.', ephemeral: true });
				}
				catch (err) {
					logger.error(err);
					await interaction.reply({ content:'Something went wrong.', ephemeral: true });
				}
			}
			else {
				account.stash = account.stash + amount;
				if (account.stash < 200) { account.stash = 200; }
				try {
					await Users.update(
						{
							stash: Math.floor(account.stash),
						},
						{
							where: { user_id: user.id },
						},
					);
					await interaction.reply({ content:'User stash updated.', ephemeral: true });
				}
				catch (err) {
					await interaction.reply({ content:'Something went wrong.', ephemeral: true });
					logger.error(err);
				}

			}
		}

		// Take ${amount} from users stash.
		else if (subcommand === 'take') {
			const user = interaction.options.getUser('user');
			const amount = interaction.options.getInteger('amount');
			let account = await Users.findOne({ where: { user_id: user.id } });
			if (!account) {
				try {
					account = await Users.create({
						user_id: user.id,
						username: user.tag,
						stash: 2000 - amount,
					});
					logger.info(`Adding new user to database: \n${JSON.stringify(account)}`);
					await interaction.reply({ content:'User stash updated.', ephemeral: true });
				}
				catch (err) {
					logger.error(err);
					await interaction.reply({ content:'Something went wrong.', ephemeral: true });
				}
			}
			else {
				account.stash = account.stash - amount;
				if (account.stash < 200) { account.stash = 200; }
				try {
					await Users.update(
						{
							stash: Math.floor(account.stash),
						},
						{
							where: { user_id: user.id },
						},
					);
					await interaction.reply({ content:'User stash updated.', ephemeral: true });
				}
				catch (err) {
					await interaction.reply({ content:'Something went wrong.', ephemeral: true });
					logger.error(err);
				}

			}
		}

		// Remove ${name} bet
		else if (subcommand === 'remove') {
			const betname = interaction.options.getString('betname');
			const bet = await Bets.findOne({ where: { name: betname } });
			if (!bet?.bet_id) {
				await interaction.reply({ content:'The bet name you have entered does not exist. Please try again.', ephemeral: true });
				return;
			}
			try {
				// Destroy the associated bet, choices, and wagers.
				await Bets.destroy({ where: { bet_id: bet.bet_id } });
				await Choices.destroy({ where: { bet_id: bet.bet_id } });
				logger.info(`Destroyed Bet ${bet.bet_id} and all associated choices.`);

				// Pay back any wagers on this bet, then destroy their records.
				const wagers = await Wagers.findAll({ where: { bet_id: bet.bet_id } });
				for (let i = 0; i < wagers.length; i++) {
					const account = await Users.findOne({ where: { user_id: wagers[i].user_id } });
					const amount = wagers[i].amount;
					account.stash = account.stash + amount;
					await Users.update(
						{ stash: account.stash },
						{ where: { user_id: account.user_id } },
					);
					logger.info(`Refunded Wager: ${ amount } --> ${ account.username }`);
				}
				await Wagers.destroy({ where: { bet_id: bet.bet_id } });
				logger.info(`Refunded and Destroyed Wagers associated Bet ${bet.bet_id}.`);
				await interaction.reply({ content:` ${betname} removed.`, ephemeral: true });
			}
			catch (err) {
				logger.error('Could not cancel Bet:', err);
			}
		}

		// Wipes all active bets associate with this guild.
		else if (subcommand === 'wipe') {
			await interaction.reply({ content:'Command not yet implemented.', ephemeral: true });

		}

	},
};