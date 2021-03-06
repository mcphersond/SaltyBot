const Sequelize = require('sequelize');
const { dbUser, dbPass } = require('./config.json');
const { logger } = require('./logger.js');

const db = new Sequelize('database', dbUser, dbPass, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

require('./models/Users.js')(db, Sequelize.DataTypes);
require('./models/Bets.js')(db, Sequelize.DataTypes);
require('./models/Choices.js')(db, Sequelize.DataTypes);
require('./models/Wagers.js')(db, Sequelize.DataTypes);
require('./models/Guilds.js')(db, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

db.sync({ force });
logger.info('Database synced');
