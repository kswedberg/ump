'use strict';

var path = require('path');
var Promises = require('bluebird');
var fs = Promises.promisifyAll(require('fs-extra'));
var cp = Promises.promisifyAll(require('child_process'));
var utils = require('./utils');
var config = require('./config');
var log = require('./log');

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
            utils.error(config.messages.gitPull);
          }
          console.log(stdout);

          return;
        })
        .catch(function(err) {
          log.color(err, 'red');
          utils.error(opts);
        });
      }
    };
  },

  updateVersion: function updateVersion(opts) {
    var files = opts.files;
    var newVersion = opts.newVersion;

    return {
      log: `* Update version to ${newVersion} in ${files.join(', ')}`,
      cmd: function() {
        return files.forEach(function(file) {
          var data = utils.readJSON(file);

          data.version = newVersion;
          utils.writeJSON(file, data);
        });
      }
    };
  },
  extras: function extras(opts) {
    var newVersion = opts.newVersion;

    return {
      log: `* Update version (using RegEx) to ${newVersion} in ${opts.extraFiles.join(', ')}`,
      cmd: function() {
        return Promises.each(opts.extras, function(item) {
          var file = item.file || item;
          var prefix = item.prefix || config.defaults.regexPrefix;
          var replace = item.replaced || config.defaults.regexReplace;
          var flags = item.flags || config.defaults.regexFlags;
          var pattern = new RegExp(`(${prefix})(${replace})`, flags);

          return fs.readFileAsync(file, 'utf8')
          .then((content) => {
            return content.replace(pattern, `$1${newVersion}`);
          })
          .then((content) => {
            return fs.writeFileAsync(file, content);
          });
        });
      }
    };
  },

  gitRelease: function gitRelease(opts) {
    var files = utils.getFiles(opts.files.concat(opts.extras || []));
    var newVersion = opts.newVersion;

    var msg = opts.message.replace('%s', newVersion);

    msg = utils.escapeQuotes(msg);

    var releaseSteps = [
      `git add ${files.join(' ')}`,
      `git commit -m "${msg}"`,
      `git tag ${newVersion} -f -a -m "${msg}"`,
      'git push',
      'git push --tags'
    ];

    if (opts.publish) {
      releaseSteps.push('npm publish');
    }

    return {
      log: releaseSteps.join('\n'),
      cmd: function() {

        return fs.readFileAsync(path.resolve('./', '.git/config'))
        .then(function(gitConfig) {
          return cp.execAsync('git status --porcelain', {env: process.env})
          .catch(utils.error);
        })
        .then(function(stdout, stderr) {
          if (stderr) {
            console.error(stderr);
          }

          return utils.repoDirty(stdout, files);
        })
        .then(function(lines) {
          if (lines.length) {
            utils.error(`Git working directory not clean:\n\t${lines.join('\n\t')}`);
          }

          return releaseSteps;
        })
        .each(function(command) {

          return cp.execAsync(command)
          .then(function() {
            log.color(`Executed ${command}`, 'cyan');
          })
          .catch(utils.error);
        })
        .catch(function(err) {
          err = err || config.messages.noRepo;
          log.color(err, 'red');
          utils.error(opts);
        });
      }
    };
  },
};

module.exports = commands;
