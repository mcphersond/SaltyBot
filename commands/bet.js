const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users, Bets, Wagers, Choices } = require('../db_objects.js');
const { MessageEmbed } = require('discord.js');
const utils = require('../utils.js');
const UserController = require('../controllers/UserController');
const WagerController = require('../controllers/WagerController');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bet')
		.setDescription('Bet on an active gamble!')
		.addStringOption(option =>
			option.setName('betname')
				.setDescription('Please enter the name of the bet you are wagering on.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('choice')
				.setDescription('Please enter which option you are betting on.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Please enter how much salt you want to bet?')
				.setRequired(false)),


	async execute(interaction) {
		const { user } = interaction;
		const name = interaction.options.getString('betname');
		const selection = interaction.options.getString('choice');
		let amount = interaction.options.getInteger('amount');

		// Look up the user, or create a user if there isn't one.
		let account = await UserController.findOrCreateUser(interaction.user);

		// Validate the wager amount. If the user didn't provide one, use their built-in default.
		// The user can't bet more than what's in their stash.
		// If the user bets a negative amount, they are all-in.
		let overdraftProtection = false;
		let allIn = false;
		let attemptedAmount = 0;
		if (!amount) amount = account.default_wager;
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

		const bet = await Bets.findOne({ where: { name: name } });

		if (!bet?.bet_id) {
			await interaction.reply({ content:'The bet name you have entered does not exist. Please try again.', ephemeral: true });
			return;
		}
		if (!bet.is_open) {
			await interaction.reply({ content:'The betting window has already closed. Sorry!', ephemeral: true });
			return;
		}
		const choice = await Choices.findOne({ where: { name: selection.toLowerCase(), bet_id: bet.bet_id } });
		if (!choice?.choice_id) {
			await interaction.reply({ content:'The choice name you have entered does not exist. Please try again.', ephemeral: true });
			return;
		}
		try {

			// Check for duplicate wagers. Normally this would be done with unique indexes in sequelize, but our db doesn't support it.
			const existingBet = await Wagers.findOne({ where: { user_id: account.user_id, bet_id: bet.bet_id } });
			if (existingBet) {
				await interaction.reply({ content:'You already have a wager in place.', ephemeral: true });
				return;
			}

			const wager = await Wagers.create(
				{
					user_id: account.user_id,
					bet_id: bet.bet_id,
					choice_id: choice.choice_id,
					amount: amount,
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
				{
					stash: Math.floor(account.stash),
				},
				{
					where: { user_id: user.id },
				},
			);
			const content = await utils.buildDetailedChoices(bet.bet_id);
			const table = '```' + utils.formatBettingTable(content) + '```';

			const embed = new MessageEmbed()
				.setColor('#10b981')
				.setTitle(name)
				.setDescription('Place a bet by typing `/bet ' + name + ' $choice $amount`')
				.addFields(
					{ name: 'Choices', value: table },
				);

			interaction.channel.messages.fetch({ around: bet.message_id, limit: 1 })
				.then(msg => {
					const fetchedMsg = msg.first();
					fetchedMsg.edit({ embeds: [embed] });
				});

			let response = `Your bet for **$${amount}** on **${selection}** is in. Your current balance is **$${account.stash}**.`;
			if (overdraftProtection) response = `*You tried to bet **$${attemptedAmount}**, but you could only afford to bet **$${amount}**.*\n` + response;
			if (allIn) response = `*You tried to bet **$${attemptedAmount}**, which was interpreted as going all in. Good luck!*\n` + response;
			await interaction.reply({ content: response, ephemeral: true });
		}
		catch (err) {
			await interaction.reply('Sorry, we couldn\'t process your wager.');
			logger.error(err);
		}
	},
};