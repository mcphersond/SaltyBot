const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageButton } = require('discord.js');
const { Bets } = require('../db_objects.js');
const utils = require('../utils.js');
const BetController = require('../controllers/BetController.js');
const logger = require('../logger.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('open_bet')
		.setDescription('Open a bet')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('The title of this bet')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('option1')
				.setDescription('Enter option name')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('option2')
				.setDescription('Enter option name')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('option3')
				.setDescription('Enter option name')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('option4')
				.setDescription('Enter option name')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('option5')
				.setDescription('Enter option name')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('option6')
				.setDescription('Enter option name')
				.setRequired(false))
		.addStringOption(option =>
			option.setName('option7')
				.setDescription('Enter option name')
				.setRequired(false)),


	async execute(interaction) {
		// Validate user inputs.
		const name = interaction.options.getString('name');
		const user_id = interaction.user.id;
		const options = [
			{ name: interaction.options.getString('option1'), total: 0 },
			{ name: interaction.options.getString('option2'), total: 0 },
			{ name: interaction.options.getString('option3'), total: 0 },
			{ name: interaction.options.getString('option4'), total: 0 },
			{ name: interaction.options.getString('option5'), total: 0 },
			{ name: interaction.options.getString('option6'), total: 0 },
			{ name: interaction.options.getString('option7'), total: 0 },
		].filter((opt) => {
			return opt.name != null;
		});
		if (utils.containsDuplicates(options)) {
			return await interaction.reply({ content: 'There are duplicate choice names. Choices should be unique. Please try again.', ephemeral: true });
		}
		if (await Bets.findOne({ where: { name: name, guild_id: interaction.member.guild.id } })) {
			return await interaction.reply({ content: 'A bet already exists with this name. Please try again.', ephemeral: true });
		}

		var message = undefined;
		try {
			// Create a message to advertise this bet.
			const loadingEmbed = new MessageEmbed()
				.setColor('#10b981')
				.setTitle(name)
				.setImage('https://i.imgur.com/AD3MbBi.jpeg')
				.setDescription(`A new bet is being created...`);
			await interaction.reply({ embeds: [loadingEmbed] });
			message = await interaction.fetchReply();
				
			// Actually create the Bet and Choices in the database.
			var {bet, choices } = await BetController.createBet(name, options, user_id, message.id, interaction.member.guild.id);

			// Update the message with new information.
			const embed = new MessageEmbed()
				.setColor('#10b981')
				.setTitle(bet.name)
				.setDescription(`Place a bet by typing \`/bet ${bet.name} $choice $amount\`, or by selecting an option below.\n\`\`\`${ utils.formatBettingTable(choices) }\`\`\``);

			// Add some buttons for quick interactions.
			let buttons = new utils.ButtonList();
			for(let i = 0; i < choices.length; i++) {
				let choice = choices[i];
				buttons.push(
					new MessageButton()
						.setCustomId(`betWager_${bet.bet_id}_${choice.choice_id}`)
						.setLabel(choice.name)
						.setStyle('SECONDARY')
				);
			}
			buttons.push(
				new MessageButton()
					.setCustomId(`betLock_${bet.bet_id}`)
					.setLabel('🔒 Lock Bets')
					.setStyle('PRIMARY')
			);
			buttons.push(
				new MessageButton()
					.setCustomId(`betCancel_${bet.bet_id}`)
					.setLabel('❌ Cancel')
					.setStyle('SECONDARY')
			);
			const rows = buttons.getComponentList();

			// Update the comment with these new embeds and components.
			message.edit({ embeds: [embed], components:rows });
		} catch(err) {
			logger.error('/open_bet: ', err);
			if (typeof message !== 'undefined') {
				message.edit({ embeds: [], content: 'This bet could not be processed.' });
			} else {
				// If the failure occurred early enough, we can hide the error message from the rest of the server.
				return await interaction.reply({ content: 'Sorry, we could not process your bet.', ephemeral: true });
			}
		}
	}
};