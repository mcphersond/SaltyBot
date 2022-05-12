const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users, Bets, Wagers, Choices } = require('../db_objects.js');
/*  TODO: Fix upsert, not gonna work
    TODO: Add support for choice numbers
    TODO: User modify their own bet
    TODO: Replace if/else checks with returns
 */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('bet')
		.setDescription('Bet on an active gamble!')
		.addStringOption(option =>
			option.setName('betname')
				.setDescription('Please enter the name of the bet you are wagering on.')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('choice')
				.setDescription('Please enter which option you are betting on.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('amount')
				.setDescription('Please enter how much salt you want to bet?')
				.setRequired(true)),


	async execute(interaction) {
		const { user } = interaction;
		let state = 'created';
		const name = interaction.options.getString('betname');
		const selection = interaction.options.getString('choice');
		const amount = interaction.options.getInteger('amount');
		if (amount <= 0) {
			await interaction.reply({ content:'You bet less than 1 salt. Please try again.', ephemeral: true });
			return;
		}
		const bet = await Bets.findOne({ where: { name: name } });
		const account = await Users.findOne({ where: { username: user.tag } });
		if (!bet?.bet_id) {
			await interaction.reply({ content:'The bet name you have entered does not exist. Please try again.', ephemeral: true });
		}
		else {
			const choice = await Choices.findOne({ where: { name: selection, bet_id: bet.bet_id } });
			if (amount > account.stash) {
				await interaction.reply({ content:`You only have ${account.stash} in your stash. Please obtain more salt.`, ephemeral: true });
			}
			else if (!choice?.choice_id) {
				await interaction.reply({ content:'The choice name you have entered does not exist. Please try again.', ephemeral: true });
			}
			else {
				try {
					const [wager, created] = await Wagers.upsert(
						{
							user_id: account.user_id,
							bet_id: bet.bet_id,
							choice_id: choice.choice_id,
							amount: amount,
						},
					);
					if (created) {
						state = 'created';
						console.log(`Created wager: \n${JSON.stringify(wager)}`);
					}
					else {
						state = 'updated';
						console.log(`Updated wager: \n${JSON.stringify(wager)}`);
					}
					account.stash = (account.stash - amount);
					await Users.update(
						{
							stash: account.stash,
						},
						{
							where: { username: user.tag },
						},
					);
					console.log(`Updated User: \n${JSON.stringify(account)}`);
					await interaction.reply({ content: `Your bet for ${amount} on ${selection} was ${state}. Your remaining balance is ${account.stash}`, ephemeral: true });
					/* message.channel.messages.fetch({around: bet.message_id, limit: 1})
                            .then(msg => {
                                const fetchedMsg = msg.first();
                                fetchedMsg.edit(embed);
                            })*/
				}
				catch (err) {
					await interaction.reply('Something went fucky wucky. Check logs');
					console.log(err);
				}
			}

		}
	},
};