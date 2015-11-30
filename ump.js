'use strict';

var path = require('path');
var Promises = require('bluebird');
var fs = Promises.promisifyAll(require('fs-extra'));
var inquirer = require('bluebird-inquirer');
var semver = require('semver');

var utils = require('./lib/utils');
var commands = require('./lib/commands');
var sequence = [];

var runCommands = function runCommands(sequence) {
  return new Promises(function(resolve) {
    resolve(sequence);
  })
  .each(function(command) {
    return command.cmd();
  })
  .then(function() {
    utils.log('*** DONE! ***', 'green');
  });
};

var ump = function(options) {
  var version, newVersion, bumpError;
  var rcOptions = utils.getRc('ump');
  var opts = utils.extend(utils.defaults, rcOptions, options);
  var files = utils.getFiles(opts);
  var sourceFile = files[0];
  var releaseType = opts.releaseType;

  // opts.publish always implies opts.release as well (git push && git push --tags)
  if (opts.publish) {
    opts.release = true;
  }

  try {
    version = require(path.resolve('./', sourceFile)).version;
    bumpError = utils.bumpError(sourceFile, releaseType, version);
  } catch (err) {
    // If we fail to get a version from the designated sourceFile
    bumpError = utils.bumpError(false, releaseType, sourceFile);
  }

  if (bumpError) {
    return;
  }

  // semver release type
  if (utils.releaseTypes.indexOf(releaseType) !== -1) {
    newVersion = semver.inc(version, releaseType);
  } else {
    // but, also allow for hardcoded number release
    newVersion = releaseType;
  }

  utils.bumpLog(files, version, newVersion);

  if (opts.debug) {
    var debugOutput = JSON.stringify({files: files, version: version, newVersion: newVersion, opts: opts}, null, 2);

    return fs.writeFileAsync('bumpdebug.json', debugOutput)
    .then(function() {
      utils.log('\n**DEBUG ONLY! Writing the following to bumpdebug.json:**', 'cyan');
      console.log(debugOutput);
    });
  }

  sequence.push(commands.updateVersion(files, newVersion));

  if (opts.release) {
    // gitPull needs to happen first, so we don't update files when we can't complete things
    sequence.unshift(commands.gitPull());
    sequence.push(commands.gitRelease(files, newVersion, opts));
  }

  console.log('\nAbout to execute the following:');
  sequence.forEach(function(item) {
    utils.log(item.log, 'cyan');
  });

  if (opts.inquire) {
    return inquirer.prompt(utils.confirm)
    .then(function(answer) {
      if (!answer.run) {
        utils.log('\nHalted execution. Not bumping files.', 'red');
      } else {
        runCommands(sequence);
      }
    });
  }

  runCommands(sequence);
};

module.exports = ump;
