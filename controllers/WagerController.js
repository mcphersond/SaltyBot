const { Wagers, Users } = require('../db_objects.js');
const { logger } = require('../logger.js');

module.exports = {
  async createWager(bet, choice, user, amount) {
    // Validate the user's wager amount.
    // If the user didn't provide one, use their built-in default.
		// The user can't bet more than what's in their stash.
		// If the user bets a negative amount, they are all-in.
		let overdraftProtection = false;
		let allIn = false;
    if (typeof amount === 'undefined') amount = user.default_wager;
		let attemptedAmount = amount;
		if (amount <= 0) {
			allIn = true;
			amount = user.stash;
		}
		if (amount > user.stash) {
			overdraftProtection = true;
			amount = user.stash;
		}

    // Attempt to create a wager.
    try {
			const wager = await Wagers.create( {
					user_id: user.user_id,
					bet_id: bet.bet_id,
					choice_id: choice.choice_id,
					amount: amount
      });
      logger.info(`Created wager: ${ user.username } put $${ wager.amount } on ${ choice.name } (${bet.bet_id})`);

			// Subtract the amount from the user's stash.
			user.stash = (user.stash - amount);
			await Users.update(
				{ stash: user.stash },
				{ where: { user_id: user.user_id} }
			);
    } catch (err) {
      logger.error('WagerController.createWager:', err);
      throw err;
    }

    return {
      overdraftProtection: overdraftProtection,
      allIn: allIn,
      attemptedAmount: attemptedAmount,
      actualAmount: amount
    };
  },

  async updateWager(existingWager, user, bet, choice, amount) {
		// If amount is provided, figure out the delta between the new and old amount.
		// We need to take/refund that difference from their stash.
		let attemptedAmount = amount;
		let overdraftProtection = false;
		let allIn = false;
		if (typeof amount !== 'undefined') {
			if (amount <= 0) {
				// User is all in. Take all their money.
				amount = existingWager.amount + user.stash;
				allIn = true;
			} else if (amount < existingWager.amount) {
				// Refund the difference to the user.
				logger.error('TODO UserController.updateWager: If the user went under 200 originally, don\'t refund the full amount. possible money-making glitch.')
				user.stash += existingWager.amount - amount;
				user.save();
			} else if (amount > existingWager.amount + user.stash) {
				// Overdraft protection.
				amount = existingWager.amount + user.stash;
				overdraftProtection = true;
			}
		}

		// Update the wager with the new amount/choice.
		const updatedWager = await Wagers.update( 
			{choice_id: choice, amount: amount },
			{ where: { wager_id: existingWager.wager_id } }
		);
		logger.info(`Updated wager: ${ user.username } put $${ updatedWager.amount } on ${ updatedWager.choice_id } (${bet.bet_id})`);
		

		// If the user's stash has gone below 200, grant them some money so they can keep playing.
		user.stash = (user.stash - amount);
		if (user.stash < 200) { user.stash = 200; }
		await Users.update(
			{ stash: user.stash },
			{ where: { user_id: user.user_id} }
		);
	}
}