const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users, Bets, Wagers, Choices } = require('../db_objects.js');
const { icon, footer } = require('../config.json');
const { MessageEmbed } = require('discord.js');
const utils = require('../utils.js');
/*  TODO: Fix upsert, not gonna work
    TODO: Add support for choice numbers
    TODO: User modify their own bet
    TODO: Replace if/else checks with returns
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('configure')
		.setDescription('Set a default amount to wager. You can still specify an amount when using /bet.')
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('How much salt do you want to bet by default?')
				.setRequired(true)),


	async execute(interaction) {

		// Get inputs and validate them.
		const { user } = interaction;
		const amount = interaction.options.getInteger('amount');

		if (amount <= 0) {
			await interaction.reply({ content:"You can't bet less than 1 salt. Please try again.", ephemeral: true });
			return;
		}

		// Try to find the user's account. If they don't have one, make one.
		let account = await Users.findOne({ where: { username: user.tag } });
		if (!account) {
			try {
				account = await Users.create({
					user_id: user.id,
					username: user.tag,
					stash: 2000,
				});
				console.log(`Adding new user to database: \n${JSON.stringify(account)}`);
			}
			catch (err) {
				console.log(err);
				await interaction.reply('Something went wrong.');
			}
		}

		// Set the user's defaultWager.
		try {
			var updated = await Users.update(
				{
					defaultWager: amount,
				},
				{
					where: { username: user.tag },
				},
			);
			console.log(`Updated User's default wager: \n${JSON.stringify(updated)}`);
			await interaction.reply({ content: 'Your default bet is now **$'+ amount +'**\nYou can still specify another amount using `/bet $name $choice $amount`\nIf you can\'t afford this amount in the future, your bet will be the maximum amount that you can afford.', ephemeral: true });
		}
		catch (err) {
			await interaction.reply("We couldn't update your default wager amount.");
			console.log(err);
		}
	},
};