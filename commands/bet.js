const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users, Bets, Wagers, Choices} = require('../db_objects.js');
const { icon, footer } = require('../config.json');
const { MessageEmbed, MessageManager } = require('discord.js');
const utils = require('../utils.js');
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
        let state = "created"
        let name = interaction.options.getString('betname')
        let selection = interaction.options.getString('choice');
        let amount = interaction.options.getInteger('amount');
        if (amount <= 0) {
            await interaction.reply({ content:'You bet less than 1 salt. Please try again.', ephemeral: true});
            return;
        }
        let bet = await Bets.findOne({ where: { name: name}})
        let account = await Users.findOne({ where: { username: user.tag }});
        if(!bet?.bet_id){
            await interaction.reply({ content:'The bet name you have entered does not exist. Please try again.', ephemeral: true});
        }
        else{
            let choice = await Choices.findOne({ where: { name: selection, bet_id: bet.bet_id }});
            if (amount > account.stash) {
                await interaction.reply({ content:`You only have ${account.stash} in your stash. Please obtain more salt.`, ephemeral: true});
            }
            else {
                if (!choice?.choice_id){
                    await interaction.reply({ content:'The choice name you have entered does not exist. Please try again.', ephemeral: true});
                }
                else {                  
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
                        account.stash = (account.stash - amount);
                        let updatedUser = await Users.update(
                            {
                                    stash: account.stash,
                            },
                            {
                                    where: {username: user.tag},
                            }
                        );
                        console.log(`Updated User: \n${JSON.stringify(account)}`);
                        let content = await utils.buildDetailedChoices(bet.bet_id);
                        let table = '```' + utils.formatTable(content) + '```';
                        
                        const embed = new MessageEmbed()
                            .setColor('#10b981')
                            .setTitle(bet.name)
                            .setDescription('Reactions are only for the bookee.')
                            .addFields(
                                { name: 'Choices', value: table },
                            )
                            .setTimestamp()
                            .setFooter({ text: footer, iconURL: icon });

                        
                        interaction.channel.messages.fetch({around: bet.message_id, limit: 1})
                        .then(msg => {
                            const fetchedMsg = msg.first();
                            fetchedMsg.edit({ embeds: [embed] });
                        });

                        await interaction.reply({ content: `Your bet for ${amount} on ${selection} is in. Your remaining balance is ${account.stash}`, ephemeral: true});
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