const { Users, Guilds } = require('../db_objects.js');
const { logger } = require('../logger.js');
const Sequelize = require('sequelize');

module.exports = {

	// Find a user if one exists. If not, create one.
	// Returns an object with two properties: { user, existing }
	// user contains the Sequelize User object.
	// existing is a boolean, true if the user already existed.
  async findOrCreateUser(discordUser, guild_id) {
		// Check if the guild exists.
		var guild = await Guilds.findOne({ where: { guild_id: guild_id } });
		if (!guild) {
			guild = await Guilds.create({
				guild_id: guild_id
			});
			logger.info(`Adding new guild to database: ${JSON.stringify(guild)}`);
		}

    // Check if the user already exists.
    const user = await Users.findOne({ where: { user_id: discordUser.id } });
		if (user) {
			return { user: user, existing: true };
		}
		
		// The user doesn't exist, so create them.
		try {
			const newUser = await Users.create({
				user_id: discordUser.id,
				username: discordUser.tag,
				guild_id: guild.guild_id,
				stash: 2000,
			});
			logger.info(`Adding new user ${discordUser.tag} to database: ${JSON.stringify(newUser)}`);
			return { user: newUser, existing: false };
		}
		catch (err) {
			logger.error('UserController.createUser:', err);
			throw err;
		}
  },

  async updateUser(updatedUser) {
		// If the caller provided a User model, we can just save it.
		if (user instanceof Sequelize.Model) return await updatedUser.save();
		else {
			try {
				return await Users.update(updatedUser, {	where: { user_id: updatedUser.user_id } });
			}
			catch (err) {
				logger.error('UserController.updateUser:', err);
				throw err;
			}
		}
  },

  async getLeaders(column, guild_id, client) {
		var leaders = [];
		switch (column) {
			case 'wins':
				leaders = await Users.findAll({ where: { guild_id: guild_id }, order:[ ['wins', 'DESC'] ], limit: 10 });
			case 'losses':
				leaders = await Users.findAll({ where: { guild_id: guild_id }, order:[ ['losses', 'DESC'] ], limit: 10 });
			case 'betsplaced':
				let betters = await Users.findAll({ where: { guild_id: guild_id } });
				leaders = betters.sort((a, b) => {
					return b.bets_placed - a.bets_placed;
				}).slice(0, 10);
			case 'wlratio':
				let winloss = await Users.findAll({ where: { guild_id: guild_id } });
				leaders = winloss.sort((a, b) => {
					return b.wl_ratio - a.wl_ratio;
				}).slice(0, 10);
			default:
				leaders = await Users.findAll({ where: { guild_id: guild_id }, order:[ ['stash', 'DESC'] ], limit: 10 });
		
			var guild = await client.guilds.fetch(guild_id);
			for (let i = 0; i < leaders.length; i++) {
				let member = await guild.members.fetch(leaders[i].user_id);
				leaders[i].nickname = member.nickname;
			}

			return leaders;
		}
  },

  async getUser(discordUser) {
    return await Users.findOne({ where: { user_id: discordUser.id } });
  },

	async getDisplayName(user, client) {
		let guild = await client.guilds.fetch(user.guild_id);
		let member = await guild.members.fetch(user.user_id);
		return member.nickname;
	},

	async getGuildName(user, client) {
		let guild = await client.guilds.fetch(user.guild_id);
		return guild.name;
	}
}