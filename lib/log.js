var chalk = require('chalk');

var log = {
  color: function colorLog(txt, color) {
    if (color) {
      txt = chalk[color](txt);
    }
    console.log(txt);
  },
  bump: function bumpLog(opts) {
    var files = opts.files.join(', ');

    console.log('');
    console.log(chalk.bold('SET FILES:\t'), chalk.yellow(files));
    console.log(chalk.bold('OLD VERSION:\t'), chalk.yellow(opts.version));
    console.log(chalk.bold('NEW VERSION:\t'), chalk.yellow(opts.newVersion));
  },
  tasks: function tasksLog(tasks) {
    console.log('\nAbout to execute the following:');
    tasks.forEach(function(item) {
      log.color(item.log, 'cyan');
    });
  },
  keyValue: function keyValue(key, value) {
    console.log(chalk.dim(key), value);
  },
};

module.exports = log;
