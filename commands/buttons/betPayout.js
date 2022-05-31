const { MessageEmbed } = require('discord.js');
const { Bets, Choices } = require('../../db_objects.js');
const BetController = require('../../controllers/BetController');

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
    var originalMember = interaction.message.interaction.member;
    var user = interaction.user;
    if (originalUser.id != user.id) {
      return interaction.reply({ content: `Only ${originalMember.nickname} can perform this action. Sorry!`, ephemeral: true });
    }
    
    // Find some information before it all gets destroyed.
    const winningChoice = await Choices.findOne({ where: { choice_id: choice_id } });
    const bet = await Bets.findOne({ where: { bet_id: bet_id } });

    // Pay out the bet.
    try {
      await BetController.payOutBet(bet_id, choice_id);
    } catch(err) {
      console.log(err);
      return interaction.reply({ content: `An error occurred, sorry!`, ephemeral: true });
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