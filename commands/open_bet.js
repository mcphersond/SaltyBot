const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
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
		const { options } = interaction;
		const name = options.getString('name');
		const book = interaction.user.id;
		let amount = 0;
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
			await interaction.reply({ content: 'There are duplicate choice names, please try again.', ephemeral: true });
			return;
		}

		if (await Bets.findOne({ where: { name: name } })) {
			await interaction.reply({ content: 'That bet name already exists, please try again.', ephemeral: true });
		}
		else {
			try {
				const newBet = await Bets.create({
					user_id: book,
					name: name,
				});
				logger.info(`Adding new bet to database: ${JSON.stringify(newBet)}`);
				for (let i = 0; i < choices.length; i++) {
					const newChoice = await Choices.create({
						bet_id: newBet.bet_id,
						name: choices[i].name.toLowerCase(),
						num: (i + 1),
					});
					logger.info(`Adding new choice to database: \n${JSON.stringify(newChoice)}`);
				}
				const table = '```' + formatTable(choices) + '```';

				const embed = new MessageEmbed()
					.setColor('#10b981')
					.setTitle(newBet.name)
					.setDescription('Place a bet by typing `/bet ' + newBet.name + ' $choice $amount`')
					.addFields(
						{ name: 'Choices', value: table },
					);
				await interaction.reply({ embeds: [embed] });
				const message = await interaction.fetchReply();
				await Bets.update(
					{
						message_id: message.id,
					},
					{
						where: { bet_id: newBet.bet_id },
					},
				);
				newBet.message_id = message.id;
				logger.info(`Updated Bet: ${JSON.stringify(newBet)}`);
				await message.react('🔒');
				await message.react('🗑');

				const filter = (reaction, user) => {
					return ['🔒', '🗑'].includes(reaction.emoji.name) && user.id === interaction.user.id;

				};
				message.awaitReactions({ filter, max: 1, time: 90000, errors: ['time'] })
					.then(async collected => {
						const reaction = collected.first();
						if (reaction.emoji.name === '🔒') {
							message.reply('Bets are locked!');
							try {
								await Bets.update(
									{
										is_open: false,
									},
									{
										where: { bet_id: newBet.bet_id },
									},
								);
								logger.info(`Locked bet: ${newBet.name}`);
								return;
							}
							catch (err) {
								logger.error(err);
								return;
							}
						}
						else {
							message.reply('Cancelling bet! Any wagers already made were refunded. 🧂');
							try {
								await Bets.destroy({
									where: { bet_id: newBet.bet_id },
								});
								await Choices.destroy({
									where: { bet_id: newBet.bet_id },
								});
								logger.info(`Destroyed bet ${newBet.bed_id} and all assocaited choices.`);
								const results = await Wagers.findAll({ where: { bet_id: newBet.bet_id } });
								for (let i = 0; i < results.length; i++) {
									const user = await Users.findOne({ where: { user_id: results[i].user_id } });
									amount = results[i].amount;
									user.stash = user.stash + amount;
									await Users.update(
										{
											stash: user.stash,
										},
										{
											where: { user_id: user.user_id },
										},
									);
									logger.info(`Refunded Wager: ${ amount } --> ${ user.username } Stash: ${user.stash}`);
								}
								return;
							}
							catch (err) {
								logger.error(err);
								return;
							}
						}
					})
					.catch(async () => {
						try {
							await Bets.update(
								{
									is_open: false,
								},
								{
									where: { bet_id: newBet.bet_id },
								},
							);
							logger.info(`Locked bet: ${newBet.name}`);
							message.reply('1 Minute and 30 seconds has passed. Locking bets.');
							return;
						}
						catch (err) {
							logger.error(err);
							return;
						}
					});

			}
			catch (err) {
				logger.error(err);
				await interaction.reply('Something got fucky wucky, please try again');
				return;
			}
		}

	},
};