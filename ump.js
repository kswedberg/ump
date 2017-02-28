'use strict';

var path = require('path');
var Promises = require('bluebird');
var fs = Promises.promisifyAll(require('fs-extra'));
var inquirer = require('inquirer');
var semver = require('semver');

var utils = require('./lib/utils');
var commands = require('./lib/commands');
var log = require('./lib/log');
var config = require('./lib/config');
var sequence = [];

var runCommands = function runCommands(sequence) {
  return utils.checkNodeNpm()
  .then(function() {
    return Promises.each(sequence, function(command) {
      return command.cmd();
    })
    .then(function() {
      log.color('*** DONE! ***', 'green');
    })
    .catch(utils.resetVersion);
  })
  .catch((err) => {
    console.error(err);
  });
};

var ump = function(options) {
  var opts = utils.buildOptions(options);

  if (opts.error) {
    return;
  } else if (opts.debug) {
    return utils.debug(opts);
  }

  log.bump(opts);

  sequence.push(commands.updateVersion(opts));

  if (opts.extras) {
    sequence.push(commands.extras(opts));
  }

  if (opts.release) {
    // gitPull needs to happen first, so we don't update files when we can't complete things
    sequence.unshift(commands.gitPull(opts));
    sequence.push(commands.gitRelease(opts));
  }

  log.tasks(sequence);

  // opts.inquire is set to true automatically for CLI usage
  if (opts.inquire) {
    return inquirer.prompt(config.confirm)
    .then(function(answer) {
      if (!answer.run) {
        log.color('\nHalted execution. Not bumping files.', 'red');
      } else {
        runCommands(sequence);
      }
    });
  } else {
    runCommands(sequence);
  }
};

module.exports = ump;
