const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Bets, Choices } = require('../../db_objects.js');
const utils = require('../../utils.js');
const BetController = require('../../controllers/BetController');

module.exports = {
  data: {
    name: 'betLock'
  },

  async execute(interaction, client) {

    // Decode inputs based on the button's customId.
    var customIdComponents = interaction.customId.split('_');
    var bet_id = customIdComponents[1];

    // Validate the user. Only the original book can lock a bet.
    var originalUser = interaction.message.interaction.user;
    var user = interaction.user;
    if (originalUser.id != user.id) {
      return interaction.reply({ content: `Only ${originalUser.username} can perform this action. Sorry!`, ephemeral: true });
    }

    // Update the original comment to reflect its locked status.
    // Replace bet buttons with payout buttons, remove the lock button.
    const bet = await Bets.findOne({ where: { bet_id: bet_id } });
    const choices = await Choices.findAll({ where: { bet_id: bet_id } });
    

    let buttons = new utils.ButtonList();
    for(let i = 0; i < choices.length; i++) {
      let choice = choices[i];
      buttons.push(
        new MessageButton()
          .setCustomId(`betPayout_${bet.bet_id}_${choice.choice_id}`)
          .setLabel(choice.name)
          .setStyle('PRIMARY')
      );
    }
    buttons.push(
      new MessageButton()
        .setCustomId(`betCancel_${bet.bet_id}`)
        .setLabel('❌ Cancel')
        .setStyle('SECONDARY')
    );
    const rows = buttons.getComponentList();

    const content = await utils.buildDetailedChoices(bet_id);
    const embed = new MessageEmbed()
      .setColor('#10b981')
      .setTitle(bet.name)
      .setDescription(`🔒 Bets are locked! Good luck everyone!\n\n${originalUser.username} can pay winners with \`/payout ${bet.name} $choice\`, or with the buttons below.\n\`\`\`${ utils.formatBettingTable(content) }\`\`\``);
    interaction.message.edit({ embeds: [embed], components: rows });

    // Update the the associated bet.
    try {
      await BetController.lockBet(bet_id);
    } catch(err) {
      return interaction.reply({ content: `An error occurred, sorry!`, ephemeral: true });
    }

    interaction.deferUpdate();
  }
}