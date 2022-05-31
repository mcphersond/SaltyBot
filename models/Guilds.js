module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Guilds', {
		guild_id: {
			type: DataTypes.INTEGER,
			unique: true,
			primaryKey: true,
			autoIncrement: true,
		}
	}, {
		timestamps: true,
	});
};
