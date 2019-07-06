const chalk = require('chalk');

const log = {
  color: function(str, color) {
    let txt = str;

    if (color) {
      txt = chalk[color](txt);
    }
    console.log(txt);
  },
  bump: function(opts) {
    const files = opts.files.join(', ');

    console.log('');
    console.log(chalk.bold('SET FILES:\t'), chalk.yellow(files));
    console.log(chalk.bold('OLD VERSION:\t'), chalk.yellow(opts.version));
    console.log(chalk.bold('NEW VERSION:\t'), chalk.yellow(opts.newVersion));
  },
  tasks: function(tasks) {
    console.log('\nAbout to execute the following:');
    tasks.forEach((item) => {
      log.color(item.log, 'cyan');
    });
  },
  keyValue: function(key, value) {
    console.log(chalk.dim(key), value);
  },
};

module.exports = log;
