const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Choices, Bets } = require('../db_objects.js');
const { icon, footer } = require('../config.json');

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
            options.getString("option1"),
            options.getString("option2"),
            options.getString("option3"),
            options.getString("option4"),
            options.getString("option5"),
            options.getString("option6"),
            options.getString("option7")
        ].filter((opt) => {
            return opt != null;
        });
 
        try {
            const newBet = await Bets.create({
                user_id: book,
                name: name,
            })
            console.log(`Adding new bet to database: \n${JSON.stringify(newBet)}`)
            for (let i = 0; i < choices.length; i++) {
                let newChoice = await Choices.create({
                    bet_id: newBet.bet_id,
                    name: choices[i]
                })
                console.log(`Adding new choice to database: \n${JSON.stringify(newChoice)}`)
            }
            
            
            const exampleEmbed = new MessageEmbed()
                .setColor('#10b981')
                .setTitle(newBet.name)
                .setDescription('Reactions are only for the bookee.')
                .addFields(
                    { name: 'Choices', value: '```asdf\nasdf\nasdf\nadsf\nasdf\nasdf\nasdf```' },
                )
                .setTimestamp()
                .setFooter({ text: footer, iconURL: icon });
            await interaction.reply({ embeds: [exampleEmbed] });
            const message = await interaction.fetchReply();
            await message.react('🔒')
            await message.react('🗑')

            const filter = (reaction, user) => {
                console.log(reaction.emoji.name, user.id, interaction.user.id);
                return ['🔒', '🗑'].includes(reaction.emoji.name) && user.id === interaction.user.id;;
                
            };
            message.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] })
                .then(collected => {
                    const variable = collected.first();
                    if (variable.emoji.name === '🔒') {
                        message.reply('Bets are locked!');
                    } else {
                        message.reply('Removing bet!');
                    }
                })
                .catch(error => {
                    console.log(error)
                    message.reply('30 seconds has passed. Locking bets.')
                });
            
        }
		catch(err) {
            console.log(err)
            await interaction.reply('Something got fucky wucky, please try again')
            return;
        }
        
    },
};