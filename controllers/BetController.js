const { Bets, Choices, Users, Wagers, Guilds } = require('../db_objects.js');
const { logger } = require('../logger.js');
const utils = require('../utils.js');

module.exports = {
  async createBet(name, choices, user_id, message_id, guild_id) {
    try {
      // Check if the guild exists.
      var guild = await Guilds.findOne({ where: { guild_id: guild_id } });
      if (!guild) {
        guild = await Guilds.create({
          guild_id: guild_id
        });
        logger.info(`Adding new guild to database: ${JSON.stringify(guild)}`);
      }
      // Create a database entry for the bet.
      const newBet = await Bets.create({
        user_id: user_id,
        name: name,
        message_id: message_id,
        guild_id: guild_id
      });
      logger.info(`Created Bet: ${newBet.bet_id}`);

      // Create choices for each 
      var newChoices = [];
      for (let i = 0; i < choices.length; i++) {
        const newChoice = await Choices.create({
          bet_id: newBet.bet_id,
          name: choices[i].name.toLowerCase(),
          num: (i + 1),
        });
        newChoices.push(newChoice);
        logger.verbose(`Created Choice: ${newBet.bet_id}:${newChoice.choice_id}`);
      }

      return {
        bet: newBet,
        choices: newChoices
      };
    } catch(err) {
      logger.error('BetController.createBet:', err);
      throw err;
    }
  },

  async lockBet(bet_id) {
    try {
      await Bets.update(
        { is_open: false },
        { where: { bet_id: bet_id } }
      );
      logger.info(`Locked Bet: ${bet_id}`);
    } catch(err) {
      logger.error('BetController.lockBet:', err);
      throw err;
    }
  },

  async cancelBet(bet_id) {
    try {
      // Destroy the associated bet, choices, and wagers.
      await Bets.destroy({ where: { bet_id: bet_id } });
      await Choices.destroy({ where: { bet_id: bet_id } });
      logger.info(`Destroyed Bet ${bet_id} and all associated choices.`);

      // Pay back any wagers on this bet.
      const wagers = await Wagers.findAll({ where: { bet_id: bet_id } });
      for (let i = 0; i < wagers.length; i++) {
        const user = await Users.findOne({ where: { user_id: wagers[i].user_id } });
        var amount = wagers[i].amount;
        user.stash = user.stash + amount;
        await Users.update(
          { stash: user.stash },
          { where: { user_id: user.user_id } }
        );
        logger.verbose(`Refunded Wager: ${ amount } --> ${ user.username }`);
      }
      // Now these wagers can be destroyed as well.
      await Wagers.destroy({ where: { bet_id: bet_id } });
      logger.info(`Refunded and Destroyed Wagers associated Bet ${bet_id}.`);
    }
    catch (err) {
      logger.error('BetController.cancelBet:', err);
      throw err;
    }
  },

  async payOutBet(bet_id, choice_id) {
    // Find all winning and losing wagers.
    const wagers = await Wagers.findAll({ where: { bet_id: bet_id } });
    const winners = wagers.filter((wager) => {
      return wager.choice_id == choice_id;
    });
    const losers = wagers.filter((wager) => {
      return wager.choice_id != choice_id;
    })
    // Assign a loss to each loser.
		for (let i = 0; i < losers.length; i++) {
			try {
        var loser = await Users.findOne({ where: { user_id: losers[i].user_id } });
			  loser.losses = loser.losses + 1;
        await loser.save();
				logger.info(`Added a loss to user: ${loser.username}`);
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

			try {
        user = await Users.findOne({ where: { user_id: winners[i].user_id } });
        user.stash = payout + user.stash;
        user.wins = user.wins + 1;
        user.save();
				logger.info(`Paid out user: ${payout} to ${user.username} | Total stash: ${user.stash}`);
			}	catch (err) {
				logger.error(`BetController.payOutBet: Failed to payout ${user.username} : ${err}`);
			}
		}

    // Close out the bet. Delete the bet, choices, and wagers.
    try {
			await Wagers.destroy({ where: { bet_id: bet_id } });
			await Bets.destroy({ where: { bet_id: bet_id } });
			await Choices.destroy({ where: { bet_id: bet_id } });
			logger.info(`Destroyed all wagers, choices, and the bet associated with bet ${bet_id}`);
		} catch (err) {
			logger.error(`BetController.payOutBet: Cleanup failed for Bet ${bet_id}: ${err}`);
		}
  }
}