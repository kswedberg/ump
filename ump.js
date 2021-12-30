'use strict';

import Promises from 'bluebird';
import inquirer from 'inquirer';

import {utils} from './lib/utils.js';
import {commands} from './lib/commands.js';
import {log} from './lib/log.js';
import {config} from './lib/config.js';

const sequence = [];

const runCommands =  function(sequence, options) {
  return Promises.each(sequence, (command) => {
    return command.cmd(options);
  })
  .then(() => {
    log.color('*** DONE! ***', 'green');
  })
  .catch((err) => {
    console.error(err);
    utils.resetVersion(options);
  });
};

const ump = async function(options) {
  const opts = await utils.buildOptions(options);

  if (opts.error) {
    return;
  }

  log.bump(opts);

  sequence.push(commands.updateVersion(opts));

  if (opts.extras) {
    sequence.push(commands.extras(opts));
  }

  // opts.inquire is set to true automatically for CLI usage
  if (opts.publish && opts.inquire) {
    opts.publishFlags = await inquirer.prompt(config.publishPrompts);
  }

  if (opts.release) {
    // opts.dirty = commands.commitDirty(opts);
    // gitPull needs to happen first, so we don't update files when we can't complete things
    sequence.unshift(commands.gitPull(opts));
    sequence.push(commands.gitRelease(opts));
  }

  log.tasks(sequence);

  // opts.inquire is set to true automatically for CLI usage
  if (opts.inquire) {
    const answer = await inquirer.prompt(config.confirm);

    if (!answer.run) {
      console.log(sequence);

      return log.color('\nHalted execution. Not bumping files.', 'red');
    }
  }

  runCommands(sequence, opts);
};

export default ump;
