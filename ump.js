'use strict';

const path = require('path');
const Promises = require('bluebird');
const fs = Promises.promisifyAll(require('fs-extra'));
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
    })
    .catch(utils.resetVersion);
  })
  .catch((err) => {
    console.error(err);
  });
};

const ump = async function(options) {
  const opts = utils.buildOptions(options);

  if (opts.error) {
    return;
  // } else if (opts.debug) {
  //   return utils.debug(opts);
  }

  log.bump(opts);

  sequence.push(commands.updateVersion(opts));

  if (opts.extras) {
    sequence.push(commands.extras(opts));
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
    return inquirer.prompt(config.confirm)
    .then((answer) => {
      if (!answer.run) {
        log.color('\nHalted execution. Not bumping files.', 'red');
      } else {
        runCommands(sequence);
      }
    });
  }

  runCommands(sequence, opts);
};

module.exports = ump;
