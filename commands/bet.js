const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users } = require('../db_objects.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bet')
        .setDescription('Bet on an active gamble!')
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
        let account = await Users.findOne({ where: { username: user.tag }});
        let choice = interaction.options.getString('choice');
        let bet = interaction.options.getInteger('amount');
        if (bet > stash) {
            await interaction.reply(`You only have ${account.stash} in your stash. Please obtain more salt.`);
        }
        else {
            account.stash = account.stash - bet;
            try{
                let updatedAccount = await Users.update(
                    {
                        stash: account.stash,
                    },
                    {
                        where: {user_id: account.id},
                    }
                );
                console.log('Updated User');
                console.log(updatedAccount);
                await interaction.reply(`You bet ${bet} on ${choice}. Your remaining balance is ${updatedAccount.stash}`);
            }
            catch(err){
                await interaction.reply('Something went fucky wucky. Check logs');
                console.log(err)
            }
        }
    },
};