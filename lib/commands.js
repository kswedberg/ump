'use strict';

var path = require('path');
var Promises = require('bluebird');
var fs = Promises.promisifyAll(require('fs-extra'));
var cp = Promises.promisifyAll(require('child_process'));
var utils = require('./utils');

var commands = {
  gitPull: function gitPull(opts) {
    // Need to pull before mucking with files, so we can stop it if git branch isn't clean.
    // Otherwise files will be bumped and committed but not pushed and things will get messed up
    var pullRebase = 'git pull --rebase';

    return {
      log: pullRebase,
      cmd: function() {

        return cp.execAsync(pullRebase)
        .then(function(stdout, stderr) {

          if (stderr) {
            utils.error(utils.messages.gitPull);
          }
          console.log(stdout);

          return;
        })
        .catch(function(err) {
          utils.log(err, 'red');
          utils.error(opts);
        });
      }
    };
  },

  updateVersion: function updateVersion(files, newVersion) {
    return {
      log: '* Update version to ' + newVersion + ' in ' + files.join(', '),
      cmd: function() {
        return files.forEach(function(file) {
          var data = utils.readJSON(file);
          data.version = newVersion;
          utils.writeJSON(file, data);
        });
      }
    };
  },

  gitRelease: function gitRelease(files, newVersion, opts) {
    var msg = opts.message.replace('%s', newVersion);
    msg = utils.escapeQuotes(msg);

    var gitCommands = [
      'git add ' + files.join(' '),
      'git commit -m "' + msg + '"',
      'git tag ' + newVersion + ' -f -a -m "' + msg + '"',
      'git push',
      'git push --tags'
    ];

    if (opts.publish) {
      gitCommands.push('npm publish');
    }

    return {
      log: gitCommands.join('\n'),
      cmd: function() {

        return fs.readFileAsync(path.resolve('./', '.git/config'))
        .then(function(gitConfig) {
          return cp.execAsync('git status --porcelain', {env: process.env})
          .catch(utils.error);
        })
        .then(function(stdout, stderr) {
          if (stderr) {
            console.log(stderr);
          }

          return utils.repoDirty(stdout, files);
        })
        .then(function(lines) {
          if (lines.length) {
            utils.error('Git working directory not clean:\n\t' + lines.join('\n\t'));
          }

          return gitCommands;
        })
        .each(function(command) {

          return cp.execAsync(command)
          .then(function() {
            utils.log('Executed ' + command, 'cyan');
          })
          .catch(utils.error);
        })
        .catch(function(err) {
          err = err || utils.messages.noRepo;
          utils.log(err, 'red');
          utils.error(opts);
        });
      }
    };
  },
};

module.exports = commands;
