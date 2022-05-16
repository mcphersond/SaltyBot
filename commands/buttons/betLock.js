const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Bets, Choices } = require('../../db_objects.js');
const utils = require('../../utils.js');
const { logger } = require('../../logger.js');

module.exports = {
	data: {
		name: 'betLock',
	},

	async execute(interaction, client) {

		// Decode inputs based on the button's customId.
		const customIdComponents = interaction.customId.split('_');
		const bet_id = customIdComponents[1];

		// Validate the user. Only the original book can lock a bet.
		const originalUser = interaction.message.interaction.user;
		const user = interaction.user;
		if (originalUser.id != user.id) {
			return interaction.reply({ content: `Only ${originalUser.username} can perform this action. Sorry!`, ephemeral: true });
		}

		// Update the original comment to reflect its locked status.
		// Replace bet buttons with payout buttons, remove the lock button.
		const bet = await Bets.findOne({ where: { bet_id: bet_id } });
		const choices = await Choices.findAll({ where: { bet_id: bet_id } });

		const choiceButtons = [];
		for (let i = 0; i < choices.length; i++) {
			const choice = choices[i];
			choiceButtons.push(
				new MessageButton()
					.setCustomId(`betPayout_${bet.bet_id}_${choice.choice_id}`)
					.setLabel(choice.name)
					.setStyle('SECONDARY'),
			);
		}
		const row = new MessageActionRow()
			.addComponents(
				...choiceButtons,
				new MessageButton()
					.setCustomId(`betCancel_${bet.bet_id}`)
					.setLabel('❌ Cancel')
					.setStyle('SECONDARY'),
			);

		const content = await utils.buildDetailedChoices(bet_id);
		const embed = new MessageEmbed()
			.setColor('#10b981')
			.setTitle(bet.name)
			.setDescription(`🔒 Bets are locked! Good luck everyone!\n${originalUser.username} can pay winners with \`/payout ${bet.name} $choice\`, or with the buttons below.\n\`\`\`${ utils.formatTable(content) }\`\`\``);
		interaction.message.edit({ embeds: [embed], components: [row] });

		// Update the the associated bet.
		try {
			await Bets.update(
				{ is_open: false },
				{ where: { bet_id: bet_id } },
			);
			logger.info(`Locked Bet: ${bet_id}`);
		}
		catch (err) {
			logger.error('Could not Lock Bet: ', err);
		}

		interaction.deferUpdate();
	},
};