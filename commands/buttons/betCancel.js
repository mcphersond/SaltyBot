const { Bets } = require('../../db_objects.js');
const { MessageEmbed } = require('discord.js');
const BetController = require('../../controllers/BetController');

module.exports = {
	data: {
		name: 'betCancel',
	},

	async execute(interaction, client) {
		// Decode inputs based on the button's customId.
		const customIdComponents = interaction.customId.split('_');
		const bet_id = customIdComponents[1];

		// Validate the user. Only the original book can cancel a bet.
		const originalUser = interaction.message.interaction.user;
		const user = interaction.user;
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

    // Cancel the bet.
    try {
      await BetController.cancelBet(bet_id);
    } catch(err) {
      return interaction.reply({ content: `An error occurred, sorry!`, ephemeral: true });
    }

    return interaction.deferUpdate();
  }
}
