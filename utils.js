module.exports = {
  numberIcons: ['0️', '1️', '2️', '3️', '4️', '5️', '6️', '7️', '8️', '9️'],
  testchoices: [
    { name: 'ayy', total: 1000 },
    { name: 'lmao', total: 200 },
    { name: 'looooooooong', total: 0 },
    { name: 'test', total: 700 },
  ],

  formatTable(choices) {
    let optionLength = Math.max(...(choices.map(opt => opt.name.length)));
    let totalLength = Math.max(...(choices.map(opt => opt.total.toString().length)));
  
    let output = '';
  
    for (let i = 0; i < choices.length; i++) {
      let paddedOpt = choices[i].name.padEnd(optionLength);
      let paddedTotal = choices[i].total.toString().padEnd(totalLength);
      let odds = choices[i].odds ? (choices[i].odds * 100).toFixed(2) : '0.00';
      let line = `${this.numberIcons[i+1]} ${paddedOpt}         ${paddedTotal}         ${odds}%`;
      if (i < choices.length - 1) line += '\n';
      output += line;
    }
  
    return output;
  },

  determineOdds(choices) {
    let bigTotal = 0;
    for (let i = 0; i < choices.length; i++) {
      bigTotal += choices[i].total;
    }
    for (let i = 0; i < choices.length; i++) {
      if (choices[i].total == 0) {
        choices[i].odds = 0;
        continue;
      }
      choices[i].odds = choices[i].total / bigTotal;
    }
  }
};