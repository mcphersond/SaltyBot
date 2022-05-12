const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Users, Choices, Bets, Wagers } = require('../db_objects.js');
const { icon, footer } = require('../config.json');
const utils = require('../utils.js');
const bet = require('./bet.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('open_bet')
        .setDescription('Open a bet')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('Enter name of wager')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('option1')
            .setDescription('Enter name of wager')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('option2')
            .setDescription('Enter name of wager')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('option3')
            .setDescription('Enter name of wager')
            .setRequired(true))
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
        const { options, channel } = interaction;
        let name = options.getString("name");
        let book = interaction.user.id;
        let channelId = channel.id;
        let choices = [
            {name: options.getString("option1"), total: 0},
            {name: options.getString("option2"), total: 0},
            {name: options.getString("option3"), total: 0},
            {name: options.getString("option4"), total: 0},
            {name: options.getString("option5"), total: 0},
            {name: options.getString("option6"), total: 0},
            {name: options.getString("option7"), total: 0}
        ].filter((opt) => {
            return opt.name != null;
        });
        
        if (await Bets.findOne({ where: { name: name }})){
            await interaction.reply('That bet name already exists, please try again.')
        }
        else {
            try {
                const newBet = await Bets.create({
                    user_id: book,
                    name: name,
                })
                console.log(`Adding new bet to database: \n${JSON.stringify(newBet)}`)
                for (let i = 0; i < choices.length; i++) {
                    let newChoice = await Choices.create({
                        bet_id: newBet.bet_id,
                        name: choices[i].name,
                        num: (i + 1)
                    })
                    console.log(`Adding new choice to database: \n${JSON.stringify(newChoice)}`)
                }
                let table = "```" + utils.formatTable(choices)+ "```";
                
                const exampleEmbed = new MessageEmbed()
                    .setColor('#10b981')
                    .setTitle(newBet.name)
                    .setDescription('Reactions are only for the bookee.')
                    .addFields(
                        { name: 'Choices', value: table },
                    )
                    .setTimestamp()
                    .setFooter({ text: footer, iconURL: icon });
                await interaction.reply({ embeds: [exampleEmbed] });
                const message = await interaction.fetchReply();
                let updatedBet = await Bets.update(
                    {
                            message_id: message.id,
                    },
                    {
                            where: {bet_id: newBet.bet_id},
                    }
                );
                newBet.message_id = message.id;
                console.log(`Updated Bet: \n${JSON.stringify(newBet)}`);
                await message.react('🔒');
                await message.react('🗑');
    
                const filter = (reaction, user) => {
                    return ['🔒', '🗑'].includes(reaction.emoji.name) && user.id === interaction.user.id;;
                    
                };
                message.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] })
                    .then(async collected => {
                        const reaction = collected.first();
                        if (reaction.emoji.name === '🔒') {
                            message.reply('Bets are locked!');
                            try{
                                let updatedBet = await Bets.update(
                                    {
                                        is_open: false,
                                    },
                                    {
                                        where: {bet_id: newBet.bet_id},
                                    }
                                );
                                console.log(`Locked bet: \n${JSON.stringify(updatedBet)}`);
                            }
                            catch (err) {
                                console.log(err);
                                return;
                            }
                        } else {
                            message.reply('Cancelling bet! Any wagers already made were refunded. 🧂');
                            try{
                                await Bets.destroy({
                                    where: { bet_id: newBet.bet_id}
                                });
                                await Choices.destroy({
                                    where: { bet_id: newBet.bet_id}
                                });
                                let results = await Wagers.findAll({ where: { bet_id: newBet.bet_id }});
                                for(let i = 0; i < results.length; i++) {
                                    let user = await Users.findOne({ where: { user_id: results[i].user_id }});
                                    user.stash = user.stash + bet;
                                    let bet = results[i].amount;
                                    let updatedUser = await Users.update(
                                        {
                                            stash: user.stash,
                                        },
                                        {
                                            where: {user_id: user.user_id},
                                        }
                                    );
                                    console.log(`Returned Bet: \n${JSON.stringify(user)}`);
                                }
                                console.log('Bet destroyed, any wagers made have been refunded.');
                            }
                            catch (err) {
                                console.log(err);
                                return;
                            }
                        }
                    })
                    .catch(error => {
                        message.reply('30 seconds has passed. Locking bets.')
                    });
                
            }
            catch(err) {
                console.log(err);
                await interaction.reply('Something got fucky wucky, please try again');
                return;
            }
        }
        
    },
};