module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Choices', {
        choice_id: {
            type: DataTypes.INTEGER,
            unique: true,
            primaryKey: true,
            autoIncrement: true
        },
        bet_id: DataTypes.INTEGER,
        num: DataTypes.INTEGER,
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }, 
    }, {
		timestamps: false,
	});
};
