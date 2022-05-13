const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users, Bets, Choices, Wagers } = require('../db_objects.js');
const utils = require('../utils.js');
const { Op } = require('sequelize');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('payout')
		.setDescription('Payout the doubters')
		.addStringOption(option =>
			option.setName('betname')
				.setDescription('Please enter the name of the bet pool you would like to close out.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('choice')
				.setDescription('Please enter the name of the winning choice.')
				.setRequired(true)),


	async execute(interaction) {
		const name = interaction.options.getString('name');
		const bookee = interaction.user.id;
		const betname = interaction.options.getString('betname');
		const bet = await Bets.findOne({ where: { name: betname } });
		let user = '';
		if (!bet?.bet_id) {
			await interaction.reply({ content:'The bet name you have entered does not exist. Please try again.', ephemeral: true });
			return;
		}
		if (bookee != bet.user_id) {
			await interaction.reply({ content:'The bet can only be paid out by the original bookee. Please try again.', ephemeral: true });
			return;
		}
		const choice = await Choices.findOne({ where: { name: name.toLowerCase(), bet_id: bet.bet_id } });
		if (!choice?.choice_id) {
			await interaction.reply({ content:'The choice name you have entered does not exist. Please try again.', ephemeral: true });
			return;
		}

		// Assign a loss to each loser.
		const losers = await Wagers.findAll({ where: { choice_id: {[Op.ne]: choice.choice_id}, bet_id: bet.bet_id } });
		for (let i = 0; i < losers.length; i++) {
			user = await Users.findOne({ where: { user_id: losers[i].user_id } });
			user.losses = user.losses + 1;
			try {
				await Users.update(
					{
						stash: user.stash,
						wins: user.wins,
					},
					{
						where: { user_id: user.user_id },
					},
				);
			}
			catch (err) {
				console.log(`Failed to update losses for ${user.username} : ${err}`);
			}
		}

		// Calculate odds to determine winnings, and grant the calculated amount to winners.
		const wagers = await Wagers.findAll({ where: { choice_id: choice.choice_id, bet_id: bet.bet_id } });
		const detailedChoices = await utils.buildDetailedChoices(bet.bet_id);
		const odds = detailedChoices.find((c) => {
			return c.choice_id == choice.choice_id;
		}).odds;

		for (let i = 0; i < wagers.length; i++) {
			const profit = wagers[i].amount * odds;
			const payout = wagers[i].amount + profit;
			user = await Users.findOne({ where: { user_id: wagers[i].user_id } });
			user.stash = payout + user.stash;
			user.wins = user.wins + 1;
			try {
				await Users.update(
					{
						wins: user.wins,
						stash: Math.ceil(user.stash),
					},
					{
						where: { user_id: user.user_id },
					},
				);
			}
			catch (err) {
				console.log(`Failed to payout ${user.username} : ${err}`);
			}
		}
		try {
			await Wagers.destroy({
				where: { bet_id: bet.bet_id },
			});
			await Bets.destroy({
				where: { bet_id: bet.bet_id },
			});
			await Choices.destroy({
				where: { bet_id: bet.bet_id },
			});
			console.log(`Destroyed all wagers, choices, and the bet associated with bet ${bet.name}`);
			await interaction.reply(`Payouts incoming for **${bet.name}**! The winner was **${name}**.`);
		}
		catch (err) {
			console.log(`Failed to destroy something associated with bet ${bet.name} : ${err}`);
		}
	},
};