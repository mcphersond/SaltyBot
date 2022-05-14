const Sequelize = require('sequelize');
const { dbUser, dbPass } = require('./config.json');
const { logger } = require('./logger.js');

const db = new Sequelize('database', dbUser, dbPass, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});


const Users = require('./models/Users.js')(db, Sequelize.DataTypes);
const Bets = require('./models/Bets.js')(db, Sequelize.DataTypes);
const Choices = require('./models/Choices.js')(db, Sequelize.DataTypes);
const Wagers = require('./models/Wagers.js')(db, Sequelize.DataTypes);

Bets.belongsTo(Users, { foreignKey: 'user_id', as: 'book' });
Choices.belongsTo(Bets, { foreignKey: 'bet_id', as: 'bet' });
Wagers.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });
Wagers.belongsTo(Choices, { foreignKey: 'choice_id', as: 'choice' });
Wagers.belongsTo(Bets, { foreignKey: 'bet_id', as: 'bet' });

module.exports = { Users, Wagers, Choices, Bets };
