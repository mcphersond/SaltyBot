module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Users', {
        user_id: {
            type: DataTypes.STRING,
            unique: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        stash: {
            type: DataTypes.INTEGER,
            defaultValue: 2000,
            allowNull: false,
        }, 
    }, {
		timestamps: false,
	});
};


