
const { token} = require("./config.json")
const fs = require('node:fs');
const { Client, Intents, Collection } = require("discord.js");
const { InteractionResponseType } = require("discord-api-types/v10");
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.once("ready", () => {
    console.log("I am ready!");
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});


client.login(token);
