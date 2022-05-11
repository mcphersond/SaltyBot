module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Bets', {
        bet_id: {
            type: DataTypes.INTEGER,
            unique: true,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }, 
        is_open: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false
        },
        message_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        user_id: DataTypes.INTEGER,
    }, {
		timestamps: false,
	});
};
