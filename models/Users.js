module.exports = (sequelize, DataTypes) => {
	return sequelize.define('Users', {
		user_id: {
			type: DataTypes.STRING,
			unique: true,
			primaryKey: true,
		},
		guild_id: {
			type: DataTypes.STRING,
			allowNull: false
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false
		},
		stash: {
			type: DataTypes.INTEGER,
			defaultValue: 2000,
			allowNull: false,
			set(value) {
				// Minimum value of 200.
				if (value < 200) this.setDataValue('stash', 200);
				else this.setDataValue('stash', value);
			}
		},
		wins: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false
		},
		losses: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allowNull: false
		},
		default_wager: {
			type: DataTypes.INTEGER,
			defaultValue: 100,
			allowNull: false,
			set(value) {
				// Minimum value of 1.
				if (value < 1) this.setDataValue('default_wager', 1);
				else this.setDataValue('defailt_wager', value);
			}
		},
		bets_placed: {
			type: DataTypes.VIRTUAL,
			get() {
				return this.wins + this.losses;
			},
			set() {
				throw new Error('Users.bets_placed is virtual and cannot be stored.');
			}
		},
		wl_ratio: {
			type: DataTypes.VIRTUAL,
			get() {
				this.wins;
				if (this.losses > 0) return this.wins / this.losses;
				return this.wins;
			},
			set() {
				throw new Error('Users.wl_ratio is virtual and cannot be stored.');
			}
		}
	}, {
		timestamps: false,
	});
};

