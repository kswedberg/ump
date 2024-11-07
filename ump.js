'use strict';

import select from '@inquirer/select';
import confirm from '@inquirer/confirm';

import {utils, peach} from './lib/utils.js';
import {commands} from './lib/commands.js';
import {log} from './lib/log.js';
import {config} from './lib/config.js';

const sequence = [];

const runCommands =  async function(sequence, options) {
  try {
    await peach(sequence, (command) => {
      return command.cmd(options);
    });

    log.color('*** DONE! ***', 'green');
  } catch (err) {
    console.error(err);
    utils.resetVersion(options);
  }
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
  if (opts.publish && opts.inquire && config.pkgName.startsWith('@')) {
    opts.publishFlags = {};
    if (opts.access) {
      config.publishPrompt.default = opts.access;
    }
    opts.publishFlags[config.publishPrompt.name] = await select(config.publishPrompt);
  }

  if (opts.release) {
    // opts.dirty = commands.commitDirty(opts);

    // gitPull needs to happen first, so we don't update files when we can't complete things
    // The skipPull option is available if we are SURE we don't need to pull
    sequence.unshift(commands.gitPull(opts));
    sequence.push(commands.gitRelease(opts));
  }

  log.tasks(sequence);

  // opts.inquire is set to true automatically for CLI usage
  if (opts.inquire) {
    const run = await confirm(config.confirmPrompt);

    if (!run) {
      console.log(sequence);

      return log.color('\nHalted execution. Not bumping files.', 'red');
    }
  }

  runCommands(sequence, opts);
};

export default ump;
