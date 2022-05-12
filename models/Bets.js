module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Bets', {
		bet_id: {
			type: DataTypes.INTEGER,
			unique: true,
			primaryKey: true,
			autoIncrement: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		is_open: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
		message_id: {
			type: DataTypes.STRING,
			allowNull: true,
			unique: true,
		},
		user_id: DataTypes.STRING,
	}, {
		timestamps: false,
	});
};
