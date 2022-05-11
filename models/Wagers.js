module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Wagers', {
        wager_id: {
            type: DataTypes.INTEGER,
            unique: true,
            primaryKey: true,
            autoIncrement: true
        },
        user_id: DataTypes.INTEGER,
        bet_id: DataTypes.INTEGER,
        choice_id: DataTypes.INTEGER,
        amount: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false,
        },
    }, {
		timestamps: false,
	});
};
