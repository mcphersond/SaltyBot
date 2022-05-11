const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { applicationId, guildId, token } = require('./config.json');


const commands = [
	new SlashCommandBuilder()
        .setName('bet')
        .setDescription('Bet on an active gamble!')
        .addStringOption(option =>
            option.setName('choice')
            .setDescription('Please enter which option you are betting on.')
            .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
            .setDescription('Please how much salt you want to bet?')
            .setRequired(true)),
	new SlashCommandBuilder().setName('register').setDescription('Register with SaltyBot'),
    new SlashCommandBuilder().setName('user').setDescription('Debug to view your user entry')
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);