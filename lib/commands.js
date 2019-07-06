'use strict';

const path = require('path');
const Promises = require('bluebird');
const fs = Promises.promisifyAll(require('fs-extra'));
const cp = Promises.promisifyAll(require('child_process'));
const utils = require('./utils');
const config = require('./config');
const log = require('./log');

const commands = {
  gitPull: function gitPull(opts) {
    // Need to pull before mucking with files, so we can stop it if git branch isn't clean.
    // Otherwise files will be bumped and committed but not pushed and things will get messed up
    const pullRebase = 'git pull --rebase';

    return {
      log: pullRebase,
      cmd: function() {

        return cp.execAsync(pullRebase)
        .then((stdout, stderr) => {

          if (stderr) {
            utils.error(config.messages.gitPull);
          }
          console.log(stdout);
        })
        .catch((err) => {
          log.color(err, 'red');
          utils.error(opts);
        });
      }
    };
  },

  updateVersion: function updateVersion(opts) {
    const files = opts.files;
    const newVersion = opts.newVersion;

    return {
      log: `* Update version to ${newVersion} in ${files.join(', ')}`,
      cmd: function() {
        return files.forEach((file) => {
          const data = utils.readJSON(file);

          data.version = newVersion;
          utils.writeJSON(file, data);
        });
      }
    };
  },

  extras: function extras(opts) {
    const newVersion = opts.newVersion;

    return {
      log: `* Update version (using RegEx) to ${newVersion} in ${opts.extraFiles.join(', ')}`,
      cmd: function() {
        return Promises.each(opts.extras, (item) => {
          const file = item.file || item;
          const prefix = item.prefix || config.defaults.regexPrefix;
          const replace = item.replaced || config.defaults.regexReplace;
          const flags = item.flags || config.defaults.regexFlags;
          const pattern = new RegExp(`(${prefix})(${replace})`, flags);

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
    const files = utils.getFiles(opts.files.concat(opts.extras || []));
    const newVersion = opts.newVersion;
    let msg = opts.message.replace('%s', newVersion);

    msg = utils.escapeQuotes(msg);

    const releaseSteps = [
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
        .then((gitConfig) => {
          return cp.execAsync('git status --porcelain', {env: process.env})
          .catch(utils.error);
        })
        .then((stdout, stderr) => {
          if (stderr) {
            console.error(stderr);
          }

          return utils.repoDirty(stdout, files);
        })
        .then((lines) => {
          if (lines.length) {
            utils.error(`Git working directory not clean:\n\t${lines.join('\n\t')}`);
          }

          return releaseSteps;
        })
        .each((command) => {

          return cp.execAsync(command)
          .then(() => {
            log.color(`Executed ${command}`, 'cyan');
          })
          .catch(utils.error);
        })
        .catch((error) => {
          const err = error || config.messages.noRepo;

          log.color(err, 'red');
          utils.error(opts);
        });
      }
    };
  },
};

module.exports = commands;
