'use strict';

import path from 'path';
import Promises from 'bluebird';
import fs from 'fs-extra';
import {promisify} from 'util';
import childProcess from 'child_process';
import {utils} from './utils.js';
import {config} from './config.js';
import {log} from './log.js';

const exec = promisify(childProcess.exec);

const getFlags = (obj) => {
  return Object.entries(obj || {})
  .map(([key, val]) => {
    if (typeof val === 'boolean') {
      return val ? ` --${key}` : null;
    }

    return ` --${key} ${val}`;
  })
  .filter((_) => !!_)
  .join('');
};

const commands = {
  gitPull: function gitPull(opts) {
    // Need to pull before mucking with files, so we can stop it if git branch isn't clean.
    // Otherwise files will be bumped and committed but not pushed and things will get messed up.
    // **We can autostash on pull because we handle existence of uncommitted files later
    const pullRebase = 'git pull --rebase --autostash';

    return {
      log: pullRebase,
      cmd: function() {

        return exec(pullRebase)
        .then(({stdout, stderr}) => {
          console.log(stdout);

          if (stderr) {
            if (stderr.includes('Applied autostash')) {
              console.log(stderr);
            } else {
              utils.error(config.messages.gitPull);
            }
          }
        })
        .catch((err) => {
          log.color(err, 'red');
          utils.error(opts);
        });
      },
    };
  },

  updateVersion: function updateVersion(opts) {
    const files = opts.files;
    const newVersion = opts.newVersion;

    return {
      log: `* Update version to ${newVersion} in ${files.join(', ')}`,
      cmd: function() {
        if (opts.debug) {
          return console.log(`Skipping version updates to  ${files.join(', ')}`);
        }

        return Promise.all(files.map(async(file) => {
          const data = await utils.readJSON(file);

          data.version = newVersion;
          utils.writeJSON(file, data);
        }));

      },
    };
  },

  extras: function extras(opts) {
    const newVersion = opts.newVersion;

    return {
      log: `* Update version (using RegEx) to ${newVersion} in ${opts.extraFiles.join(', ')}`,
      cmd: function() {
        return Promises.each(opts.extras, (item) => {
          const file = item.file || item;
          const prefix = typeof item.prefix !== 'undefined' ? item.prefix : config.defaults.regexPrefix;
          const replace = typeof item.replaced !== 'undefined' ? item.replaced : config.defaults.regexReplace;
          const flags = typeof item.flags !== 'undefined' ? item.flags : config.defaults.regexFlags;
          const pattern = new RegExp(`(${prefix})(${replace})`, flags);

          return fs.readFile(file, 'utf8')
          .then((content) => {
            return content.replace(pattern, `$1${newVersion}`);
          })
          .then((content) => {
            return fs.writeFile(file, content);
          });
        });
      },
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
      'git push --follow-tags',
    ];

    if (opts.publish) {
      const flags = getFlags(opts.publishFlags);

      releaseSteps.push(`npm publish${flags}`);
    }

    return {
      log: releaseSteps.join('\n'),
      cmd: async function() {
        let lines = [];

        try {
          await utils.checkGitConfig(path.resolve('./', '.git'));
        } catch (err) {
          utils.error(err);
        }

        try {
          const {stdout, stderr} = await exec('git status --porcelain', {env: process.env});

          if (stderr) {
            console.error(stderr);
          }
          lines = utils.repoDirty(stdout, files);
        } catch (err) {
          utils.error(err);
        }

        if (opts.debug) {
          console.log('Debug mode. Not executing the commands:');
          console.log(releaseSteps);
          utils.debug(opts);

          throw new Error('Skipping execution');
        }

        if (lines.length) {
          console.log(lines);
          utils.error(`Git working directory not clean:\n\t${lines.join('\n\t')}`);
        }

        return Promises.each(releaseSteps, (command) => {

          return exec(command)
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
      },
    };
  },
};

export {commands};
