const { Choices, Wagers } = require('./db_objects.js');

module.exports = {
	numberIcons: ['0️', '1️', '2️', '3️', '4️', '5️', '6️', '7️', '8️', '9️'],
	testchoices: [
		{ name: 'ayy', total: 1000 },
		{ name: 'lmao', total: 200 },
		{ name: 'looooooooong', total: 0 },
		{ name: 'test', total: 700 },
	],

	formatTable(choices) {
		const optionLength = Math.max(...(choices.map(opt => opt.name.length)));
		const totalLength = Math.max(...(choices.map(opt => opt.total.toString().length)));

		let output = '';

		for (let i = 0; i < choices.length; i++) {
			const paddedOpt = choices[i].name.padEnd(optionLength);
			if (choices[i].total == 0) {
				choices[i].total = 100;
				choices[i].odds = 1;
			}
			const paddedTotal = choices[i].total.toString().padEnd(totalLength);
			const odds = choices[i].odds;
			if (i == 0) {
				output += '# Bet           Pool       Odds\n';
			}
			let line = `${this.numberIcons[i + 1]} ${paddedOpt}         ${paddedTotal}         ${odds}`;
			if (i < choices.length - 1) line += '\n';
			output += line;
		}

		return output;
	},

	determineOdds(choices) {
		let excludedPool = 0;
		let num = 1;
		console.log('Odds determining', JSON.stringify(choices));
		for (let i = 0; i < choices.length; i++) {
			excludedPool = 0;
			console.log('i', i);
			num = choices[i].num;
			console.log('num', num);
			for (let k = 0; k < choices.length; k++) {
				console.log('k', k);
				console.log('k total', choices[k].total);
				console.log('k num', choices[k].num);
				if (choices[k].num != num) {
					console.log('Entering excluded');
					excludedPool += choices[k].total;
				}
			}
			console.log('Excluded', excludedPool);
			console.log('total', choices[i].total);
			console.log((excludedPool / choices[i].total));
			choices[i].odds = excludedPool / choices[i].total;
		}
		console.log(JSON.stringify(choices));
		return choices;
	},

	containsDuplicates(choices) {
		let count = 0;
		let search = '';
		for (let i = 0; i < choices.length; i++) {
			count = 0;
			search = choices[i].name;
			for (let k = 0; k < choices.length; k++) {
				if (choices[k].name == search) {
					count++;
					if (count > 1) {
						return true;
					}
				}
			}
		}
		return false;
	},


	async buildDetailedChoices(bet_id) {
		// Get a list of choices and determine the total amount wagered on each choice.
		const choices = await Choices.findAll({ where: { bet_id: bet_id } });
		const wagers = await Wagers.findAll({ where: { bet_id: bet_id } });

		let detailedChoices = [];

		// Go through and add the total attribute to each choice.
		for (let i = 0; i < choices.length; i++) {
			detailedChoices[i] = {
				num: choices[i].num,
				name: choices[i].name,
				choice_id: choices[i].choice_id,
			};
			let total = 0;
			for (let j = 0; j < wagers.length; j++) {
				if (wagers[j].choice_id == choices[i].choice_id) {
					total += wagers[j].amount;
				}
			}
			// Bot will make a $100 pity bet on all choices to ensure there is some sort of a pot.
			detailedChoices[i].total = total + 100;
		}

		// Calculate odds now that we have totals to work with.
		detailedChoices = this.determineOdds(detailedChoices);

		return detailedChoices;
	},
};