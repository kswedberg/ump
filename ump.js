'use strict';

const path = require('path');
const Promises = require('bluebird');
const inquirer = require('inquirer');
const semver = require('semver');

const utils = require('./lib/utils');
const commands = require('./lib/commands');
const log = require('./lib/log');
const config = require('./lib/config');
const sequence = [];

const runCommands =  function(sequence, options) {
  return utils.checkNodeNpm()
  .then(() => {
    return Promises.each(sequence, (command) => {
      return command.cmd(options);
    })
    .then(() => {
      log.color('*** DONE! ***', 'green');
    });
  })
  .catch((err) => {
    console.error(err);
    utils.resetVersion(options);
  });
};

const ump = async function(options) {
  const opts = utils.buildOptions(options);

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

module.exports = ump;
