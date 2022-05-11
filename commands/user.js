const { SlashCommandBuilder } = require('@discordjs/builders');
const { Users } = require('../db_objects.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Debug to view your user entry'),
    async execute(interaction) {
        let results = await Users.findOne({ where: { username: user.tag }});
        await interaction.reply(`Your tag is ${results.username}, your id is ${results.user_id}, your current stash is at $ ${results.stash}`);
    },
};