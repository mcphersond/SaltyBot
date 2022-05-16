const { Users, Wagers, Bets, Choices } = require('../../db_objects.js');
const { MessageEmbed } = require('discord.js');
const utils = require('../../utils.js');
const { logger } = require('../../logger.js');

module.exports = {
	data: {
		name: 'betWager',
	},

	async execute(interaction, client) {
		// Decode inputs based on the button's customId.
		const customIdComponents = interaction.customId.split('_');
		const bet_id = customIdComponents[1];
		const choice_id = customIdComponents[2];

		// Look up the user, or create a user if there isn't one.
		let account = await Users.findOne({ where: { username: interaction.user.tag } });
		if (!account) {
			try {
				account = await Users.create({
					user_id: user.id,
					username: user.tag,
					stash: 2000,
				});
				logger.info(`Adding new user to database: \n${JSON.stringify(account)}`);
			}
			catch (err) {
				logger.error(err);
				await interaction.reply('Something went wrong.');
			}
		}

		// Validate the wager amount. If the user didn't provide one, use their built-in default.
		// The user can't bet more than what's in their stash.
		// If the user bets a negative amount, they are all-in.
		let overdraftProtection = false;
		let allIn = false;
		let attemptedAmount = 0;
		let amount = account.defaultWager;
		if (amount <= 0) {
			allIn = true;
			attemptedAmount = amount;
			amount = account.stash;
		}
		if (amount > account.stash) {
			overdraftProtection = true;
			attemptedAmount = amount;
			amount = account.stash;
		}


		// Attempt to create a wager using the user's default wager amount.
		try {
			// Check for duplicate wagers. Normally this would be done with unique indexes in sequelize, but our db doesn't support it.
			const existingWager = await Wagers.findOne({ where: { user_id: account.user_id, bet_id: bet_id } });
			logger.info('Existing Wager: ', existingWager);
			if (existingWager) {
				return await interaction.reply({ content:'You already have a wager in place.', ephemeral: true });
			}

			const wager = await Wagers.create(
				{
					user_id: account.user_id,
					bet_id: bet_id,
					choice_id: choice_id,
					amount: account.defaultWager,
				},
			);
			const created = wager.dataValues;
			if (created) {
				state = 'created';
				logger.info(`Created wager: \n\t\t${JSON.stringify(wager)}`);
			}
			else {
				state = 'updated';
				logger.info(`Updated wager: \n\t\t${JSON.stringify(wager)}`);
			}

			// If the user's stash has gone below 200, grant them some money so they can keep playing.
			account.stash = (account.stash - amount);
			if (account.stash < 200) { account.stash = 200; }
			await Users.update(
				{ stash: Math.floor(account.stash) },
				{ where: { username: interaction.user.tag } },
			);

			const bet = await Bets.findOne({ where: { bet_id: bet_id } });
			const choice = await Choices.findOne({ where: { choice_id: choice_id } });
			const content = await utils.buildDetailedChoices(bet_id);
			const embed = new MessageEmbed()
				.setColor('#10b981')
				.setTitle(bet.name)
				.setDescription(`Place a bet by typing \`/bet ${bet.name} $choice $amount\`, or by selecting an option below.\n\`\`\`${ utils.formatTable(content) }\`\`\``);
			interaction.message.edit({ embeds: [embed] });

			let response = `Your bet for **$${amount}** on **${choice.name}** is in. Your current balance is **$${account.stash}**.`;
			if (overdraftProtection) response = `*You tried to bet **$${attemptedAmount}**, but you could only afford to bet **$${amount}**.*\n` + response;
			if (allIn) response = `*You tried to bet **$${attemptedAmount}**, which was interpreted as going all in. Good luck!*\n` + response;
			await interaction.reply({ content: response, ephemeral: true });
		}
		catch (err) {
			await interaction.reply('Sorry, we couldn\'t process your wager.');
			logger.error(err);
		}

		// Let the user know that their wager is in.
		// interaction.reply({ content: `${interaction.user.username} --> ${interaction.customId}`});
	},
};