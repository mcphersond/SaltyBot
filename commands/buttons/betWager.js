const { Wagers, Bets, Choices } = require('../../db_objects.js');
const { MessageEmbed } = require('discord.js');
const utils = require('../../utils.js');

const UserController = require('../../controllers/UserController');
const WagerController = require('../../controllers/WagerController');
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
		
		try {
			// Look up everything you'll need for this Wager.
			var { existing, user } = await UserController.findOrCreateUser(interaction.user);
			var bet = await Bets.findOne({ where: { bet_id: bet_id } });
			var choice = await Choices.findOne({ where: { choice_id: choice_id } });
			var existingWager = await Wagers.findOne({ where: { user_id: user.user_id, bet_id: bet_id }});
			
			var results;
			if (!existingWager) {
				results = await WagerController.createWager(bet, choice, user);

				// Send an ephemeral message to the user to summarize their bet.
				let response = `Your bet for **$${results.actualAmount}** on **${choice.name}** is in. Your current balance is **$${user.stash}**.`;
				if (results.overdraftProtection) response = `*You tried to bet **$${results.attemptedAmount}**, but you could only afford to bet **$${results.actualAmount}**.*\n` + response;
				if (results.allIn) response = `*You tried to bet **$${results.attemptedAmount}**, which was interpreted as going all in. Good luck!*\n` + response;
				if (!existing) response = `Since this is your first bet, we set you up with **$2000**. Enjoy!\n` + response;
				interaction.reply({ content: response, ephemeral: true });
			} else {
				logger.error('TODO: Ability to update bets.');
				interaction.reply({ content: `You have already bet on this!`, ephemeral: true });
				// results = await WagerController.updateWager(existingWager, user, bet, choice);
			}

			// Update the Bet message.
			// Since we aren't changing buttons, simply don't provide them.
			const content = await utils.buildDetailedChoices(bet_id);
      const embed = new MessageEmbed()
        .setColor('#10b981')
        .setTitle(bet.name)
        .setDescription(`Place a bet by typing \`/bet ${bet.name} $choice $amount\`, or by selecting an option below.\n\`\`\`${ utils.formatBettingTable(content) }\`\`\``);
      interaction.message.edit({ embeds: [embed] });

		} catch(err) {
			console.log(err);
			return await interaction.reply({ content: 'Sorry, we could not process your wager.', ephemeral: true });
		}
  }
}