import {styleText} from 'node:util';

const log = {
  color: function(str, color) {
    const txt = color ? styleText(color, str) : str;

    console.log(txt);
  },
  bump: function(opts) {
    const files = opts.files.join(', ');

    console.log('');
    console.log(styleText('bold', 'SET FILES:\t'), styleText('yellow', files));
    console.log(styleText('bold', 'OLD VERSION:\t'), styleText('yellow', opts.version));
    console.log(styleText('bold', 'NEW VERSION:\t'), styleText('yellow', opts.newVersion));
  },
  tasks: function(tasks) {
    console.log('\nAbout to execute the following:');
    tasks.forEach((item) => {
      log.color(item.log, 'cyan');
    });
  },
  keyValue: function(key, value) {
    console.log(styleText('dim', key), value);
  },
};

export {log};
