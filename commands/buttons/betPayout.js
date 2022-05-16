const { MessageEmbed } = require('discord.js');
const { Users, Bets, Choices, Wagers } = require('../../db_objects.js');
const utils = require('../../utils.js');
const { logger } = require('../../logger.js');

module.exports = {
  data: {
    name: 'betPayout'
  },

  async execute(interaction, client) {
    // Decode inputs based on the button's customId.
    var customIdComponents = interaction.customId.split('_');
    var bet_id = customIdComponents[1];
    var choice_id = customIdComponents[2];

    // Validate the user. Only the original book can pay out a bet.
    var originalUser = interaction.message.interaction.user;
    var user = interaction.user;
    if (originalUser.id != user.id) {
      return interaction.reply({ content: `Only ${originalUser.username} can perform this action. Sorry!`, ephemeral: true });
    }
    
    // Find some information before it all gets destroyed.
    const winningChoice = await Choices.findOne({ where: { choice_id: choice_id } });
    const bet = await Bets.findOne({ where: { bet_id: bet_id } });

    // Find all winning and losing wagers.
    const wagers = await Wagers.findAll({ where: { bet_id: bet_id } });
    const winners = wagers.filter((wager) => {
      return wager.choice_id == choice_id;
    });
    const losers = wagers.filter((wager) => {
      return wager.choice_id != choice_id;
    })
    console.log(wagers, winners, losers);
    // Assign a loss to each loser.
		for (let i = 0; i < losers.length; i++) {
			var loser = await Users.findOne({ where: { user_id: losers[i].user_id } });
			loser.losses = user.losses + 1;
			try {
				await Users.update(
					{	wins: loser.wins	},
					{	where: { user_id: loser.user_id } }
				);
				logger.info(`Updated User ${loser.username} : Add loss`);
			}	catch (err) {
				logger.error(`Failed to update losses for ${loser.username}:`, err);
			}
		}

    // Pay out all winning wagers.
    const detailedChoices = await utils.buildDetailedChoices(bet_id);
		const odds = detailedChoices.find((c) => {
			return c.choice_id == choice_id;
		}).odds;

		for (let i = 0; i < winners.length; i++) {
			const profit = winners[i].amount * odds;
			const payout = winners[i].amount + profit;

			user = await Users.findOne({ where: { user_id: winners[i].user_id } });
			user.stash = payout + user.stash;
			user.wins = user.wins + 1;

			try {
				await Users.update(
					{ wins: user.wins, stash: Math.ceil(user.stash) },
					{ where: { user_id: user.user_id } }
				);
				logger.info(`Paid out user: ${payout} ---> ${user.username} Stash: ${user.stash}`);
			}	catch (err) {
				logger.error(`Failed to payout ${user.username} : ${err}`);
			}
		}

    // Close out the bet. Delete the bet, choices, and wagers.
    try {
			await Wagers.destroy({ where: { bet_id: bet.bet_id } });
			await Bets.destroy({ where: { bet_id: bet.bet_id } });
			await Choices.destroy({ where: { bet_id: bet.bet_id } });
			logger.info(`Destroyed all wagers, choices, and the bet associated with bet ${bet.name}`);
		}
		catch (err) {
			logger.error(`Failed to destroy something associated with bet ${bet.name} : ${err}`);
		}
    
    // Update the original comment to reflect the winner.
    const embed = new MessageEmbed()
      .setColor('#10b981')
      .setTitle(bet.name)
      .setDescription(`🎉 This bet is complete.\n\nAnyone who bet on **${ winningChoice.name }** has been paid out!`);
    interaction.message.edit({ embeds: [embed], components: [] });

    interaction.deferUpdate();
  }
}