const { Users, Choices, Bets, Wagers } = require('../../db_objects.js');
const { MessageEmbed } = require('discord.js');
const { logger } = require('../../logger.js');
module.exports = {
  data: {
    name: 'betCancel'
  },

  async execute(interaction, client) {
    // Decode inputs based on the button's customId.
    var customIdComponents = interaction.customId.split('_');
    var bet_id = customIdComponents[1];

    // Validate the user. Only the original book can cancel a bet.
    var originalUser = interaction.message.interaction.user;
    var user = interaction.user;
    if (originalUser.id != user.id) {
      return interaction.reply({ content: `Only ${originalUser.username} can perform this action. Sorry!`, ephemeral: true });
    }

    // Update the original comment to reflect its cancelled status.
    const bet = await Bets.findOne({ where: { bet_id: bet_id } });
    const embed = new MessageEmbed()
      .setColor('#10b981')
      .setTitle(bet.name)
      .setDescription(`❌ This bet has been cancelled. Everyone has been refunded.`);
    interaction.message.edit({ embeds: [embed], components: [] });
    
    try {
      // Destroy the associated bet, choices, and wagers.
      await Bets.destroy({ where: { bet_id: bet_id } });
      await Choices.destroy({ where: { bet_id: bet_id } });
      logger.info(`Destroyed Bet ${bet_id} and all associated choices.`);

      // Pay back any wagers on this bet, then destroy their records.
      const wagers = await Wagers.findAll({ where: { bet_id: bet_id } });
      for (let i = 0; i < wagers.length; i++) {
        const user = await Users.findOne({ where: { user_id: wagers[i].user_id } });
        var amount = wagers[i].amount;
        user.stash = user.stash + amount;
        await Users.update(
          { stash: user.stash },
          { where: { user_id: user.user_id } }
        );
        logger.info(`Refunded Wager: ${ amount } --> ${ user.username }`);
      }
      await Wagers.destroy({ where: { bet_id: bet_id } });
      logger.info(`Refunded and Destroyed Wagers associated Bet ${bet_id}.`);
    }
    catch (err) {
      logger.error('Could not cancel Bet:', err);
    }

    interaction.deferUpdate();
  }
}