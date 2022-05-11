
const { dbUser, dbPass, token, ownerId} = require("./config.json")
const { Client, Intents } = require("discord.js");
const { InteractionResponseType } = require("discord-api-types/v10");
const Sequelize = require('sequelize');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

const db = new Sequelize('database', dbUser, dbPass, {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const Users = db.define('Users', {
	id: {
		type: Sequelize.INTEGER,
		unique: true,
        primaryKey: true
	},
	username: {
        type: Sequelize.STRING,
        allowNull: false,
    },
	stash: {
		type: Sequelize.INTEGER,
		defaultValue: 2000,
		allowNull: false,
	}
});

const Active_bets = db.define('Active_bets', {
	id: {
		type: Sequelize.INTEGER,
		unique: true,
        primaryKey: true,
        autoIncrement: true
	},
	choice: {
		type: Sequelize.STRING,
    },
    pool: {
        type: Sequelize.NUMBER,
		allowNull: false
    },
    odds: {
		type: Sequelize.NUMBER,
		allowNull: false
	},
    bets_open: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
});

const Bets = db.define('Bets', {
	id: {
		type: Sequelize.INTEGER,
		unique: true,
        primaryKey: true,
        autoIncrement: true
	},
	choice_id: {
		type: Sequelize.INTEGER,
        references: {
        model: 'Active_bet',
        key: 'id'
        }
    },
	user_id: {
		type: Sequelize.INTEGER,
        references: {
            model: 'User',
            key: 'id'
        }
	},
    amount: {
		type: Sequelize.INTEGER,
		defaultValue: 100,
		allowNull: false,
	}
});


client.once("ready", () => {
    Users.sync();
    Active_bets.sync();
    Bets.sync();
    console.log("I am ready!");
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const { commandName, user } = interaction;

     if (commandName === 'bet') {
        let account = await Users.findOne({ where: { username: user.tag }});
        let choice = interaction.options.getString('choice');
        let bet = interaction.options.getInteger('amount');
        if (bet > stash) {
            await interaction.reply(`You only have ${account.stash} in your stash. Please obtain more salt.`);
        }
        else {
            account.stash = account.stash - bet;
            try{
                let updatedAccount = await Users.update(
                    {
                        stash: account.stash,
                    },
                    {
                        where: {id: account.id},
                    }
                );
                console.log('Updated User');
                console.log(updatedAccount);
                await interaction.reply(`You bet ${bet} on ${choice}. Your remaining balance is ${updatedAccount.stash}`);
            }
            catch(err){
                await interaction.reply('Something went fucky wucky. Check logs');
                console.log(err)
            }
        }
        

	} else if (commandName === 'register') {
        try {
            const newUser = await Users.create({
                id: user.id,
                username: user.tag,
                stash: 2000
            })
            console.log(`Adding new user to database: \n${newUser.id} ${newUser.username} ${newUser.stash}`)
            await interaction.reply('You have been registered with 2000 Salt!');
        }
		catch(err) {
            console.log(err)
            await interaction.reply('Something got fucky wucky, please try again')
        }
	} else if (commandName === 'user') {
        let results = await Users.findOne({ where: { username: user.tag }});
        await interaction.reply(`Your tag is ${results.username}, your id is ${results.id}, your current stash is at $ ${results.stash}`);
	}
});

client.login(token);
