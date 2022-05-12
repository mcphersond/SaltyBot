const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users, Bets, Wagers, Choices} = require('../db_objects.js');
// TODO: Fix upsert, not gonna work
// Fix the undefined stash error
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
        let state = "created"
        let name = interaction.options.getString('betname');
        let account = await Users.findOne({ where: { username: user.tag }});
        console.log(JSON.stringify(account));
        let selection = interaction.options.getString('choice');
        let amount = interaction.options.getInteger('amount');
        let bet = await Bets.findOne({ where: { name: name}})
        if(!bet?.bet_id){
            await interaction.reply({ content:'The bet name you have entered does not exist. Please try again.', ephemeral: true});
        }
        else{
            console.log(JSON.stringify(bet));
            let choice = await Choices.findOne({ where: { name: selection, bet_id: bet.bet_id }});
            if (amount > account.stash) {
                await interaction.reply({ content:`You only have ${account.stash} in your stash. Please obtain more salt.`, ephemeral: true});
            }
            else {
                if (!choice?.choice_id){
                    await interaction.reply({ content:'The choice name you have entered does not exist. Please try again.', ephemeral: true});
                }
                else {
                    account.set({
                        stash: (account.stash - amount)
                    })
                    
                    try{
                        let [wager, created] = await Wagers.upsert(
                            {
                                user_id: account.user_id,
                                bet_id: bet.bet_id,
                                choice_id: choice.choice_id,
                                amount: amount
                            }
                        );
                        if(created){
                            state = 'created';
                            console.log(`Created wager: \n${JSON.stringify(wager)}`);
                        }
                        else{
                            state = 'updated';
                            console.log(`Updated wager: \n${JSON.stringify(wager)}`);
                        }
                        account = await account.save();
                        console.log(`Locked bet: \n${JSON.stringify(account)}`);
                        await interaction.reply({ content: `Your bet for ${amount} on ${selection} was ${state}. Your remaining balance is ${account.stash}`, ephemeral: true});
                    }
                    catch(err){
                        await interaction.reply('Something went fucky wucky. Check logs');
                        console.log(err);
                    }
                }
            }
            
        }
    },
};