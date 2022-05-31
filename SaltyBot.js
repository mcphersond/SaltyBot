const { token, footer } = require('./config.json');
const fs = require('node:fs');
const { Client, Intents, Collection } = require('discord.js');
const { logger } = require('./logger.js');


const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.buttons = new Collection();
const buttonFiles = fs.readdirSync('./commands/buttons').filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
	const button = require(`./commands/buttons/${file}`);
	client.buttons.set(button.data.name, button);
}

client.once('ready', () => {
	logger.info(`${footer} has started.`);
});

client.on('guildCreate', guild => {
	const guildId = guild.id;
	logger.info(`${guildId} posting so linter will stop being mad.`);
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction, client);
		}
		catch (error) {
			logger.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}

	if (interaction.isButton()) {
		const action = interaction.customId.split('_')[0];
		const button = client.buttons.get(action);
		if (!button) return;

		try {
			await button.execute(interaction, client);
		}
		catch (error) {
			logger.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


client.login(token);
