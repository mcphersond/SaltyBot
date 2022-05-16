const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { Users, Choices, Bets, Wagers } = require('../db_objects.js');
const { containsDuplicates, formatTable } = require('../utils.js');
const { logger } = require('../logger.js');

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
		const { options } = interaction;
		const name = options.getString('name');
		const book = interaction.user.id;
		const choices = [
			{ name: options.getString('option1'), total: 0 },
			{ name: options.getString('option2'), total: 0 },
			{ name: options.getString('option3'), total: 0 },
			{ name: options.getString('option4'), total: 0 },
			{ name: options.getString('option5'), total: 0 },
			{ name: options.getString('option6'), total: 0 },
			{ name: options.getString('option7'), total: 0 },
		].filter((opt) => {
			return opt.name != null;
		});
		if (containsDuplicates(choices)) {
			return await interaction.reply({ content: 'There are duplicate choice names. Choices should be unique. Please try again.', ephemeral: true });
		}
		if (await Bets.findOne({ where: { name: name } })) {
			return await interaction.reply({ content: 'A bet already exists with this name. Please try again.', ephemeral: true });
		}


		try {
			// Store the bet and associated choices in the database.
			const newBet = await Bets.create({
				user_id: book,
				name: name,
			});
			logger.info(`Created Bet: ${JSON.stringify(newBet)}`);

			const newChoices = [];
			for (let i = 0; i < choices.length; i++) {
				const newChoice = await Choices.create({
					bet_id: newBet.bet_id,
					name: choices[i].name.toLowerCase(),
					num: (i + 1),
				});
				newChoices.push(newChoice);
				logger.info(`Created Choice: \n${JSON.stringify(newChoice)}`);
			}

			// Create a message to advertise this bet.
			const embed = new MessageEmbed()
				.setColor('#10b981')
				.setTitle(newBet.name)
				.setDescription(`Place a bet by typing \`/bet ${newBet.name} $choice $amount\`, or by selecting an option below.\n\`\`\`${ formatTable(choices) }\`\`\``);

			// Add some buttons for quick interactions.
			const choiceButtons = [];
			for (let i = 0; i < newChoices.length; i++) {
				const choice = newChoices[i];
				choiceButtons.push(
					new MessageButton()
						.setCustomId(`betWager_${newBet.bet_id}_${choice.choice_id}`)
						.setLabel(choice.name)
						.setStyle('SECONDARY'),
				);
			}
			const row = new MessageActionRow()
				.addComponents(
					...choiceButtons,
					new MessageButton()
						.setCustomId(`betLock_${newBet.bet_id}`)
						.setLabel('🔒 Lock Bets')
						.setStyle('PRIMARY'),
					new MessageButton()
						.setCustomId(`betCancel_${newBet.bet_id}`)
						.setLabel('❌ Cancel')
						.setStyle('SECONDARY'),
				);

			// Send the response.
			await interaction.reply({ embeds: [embed], components: [row] });

			// Store a reference to the message.
			const message = await interaction.fetchReply();
			await Bets.update(
				{
					message_id: message.id,
				},
				{
					where: { bet_id: newBet.bet_id },
				},
			);
			logger.verbose(`Updated Bet: ${JSON.stringify(newBet)}`);
		}
		catch (err) {
			logger.error(err);
			await interaction.reply('Something got fucky wucky, please try again');
			return;
		}
	},
};