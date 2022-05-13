const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { applicationId, prodGuildId, stageGuildId, token } = require('./config.json');
const { logger } = require('./logger.js');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

const stage = process.argv.includes('--staging') || process.argv.includes('-s');
const prod = process.argv.includes('--production') || process.argv.includes('-p');
const global = process.argv.includes('--global') || process.argv.includes('-g');
if (!process.argv[3]) {
	logger.warn('Usage: command_deploy.js [-s] [-p] [-g]\nOptions:\n   -s     Deploy to the staging guild set in stageGuildId in your config.json\n   -p     Deploy to the production guild set in prodGuildId in your config.json\n   -g     Deploy globally');
}

if (stage) {
	rest.put(Routes.applicationGuildCommands(applicationId, stageGuildId), { body: commands })
		.then(() => logger.info('Successfully registered application commands to staging.'))
		.catch(logger.error);
}
if (prod) {
	rest.put(Routes.applicationGuildCommands(applicationId, prodGuildId), { body: commands })
		.then(() => logger.info('Successfully registered application commands to production.'))
		.catch(logger.error);
}

// Untested
if (global) {
	rest.put(Routes.applicationCommands(applicationId), { body: commands })
		.then(() => logger.info('Successfully registered application commands globally.'))
		.catch(logger.error);
}