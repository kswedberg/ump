'use strict';

import path from 'path';
import childProcess from 'child_process';
import Promises from 'bluebird';
import fs from 'fs-extra';
import glob from 'glob';
import chalk from 'chalk';
import rc from 'rc';
import semver from 'semver';
import {config} from './config.js';
import {log} from './log.js';

const exec = Promises.promisify(childProcess.exec);

const utils = {
  getDirName(url) {
    const moduleURL = new URL(url);

    return moduleURL.pathname.replace(/\/[^/]+$/, '');
  },
  escapeQuotes(str) {
    if (typeof str === 'string') {
      return str.replace(/(["$`\\])/g, '\\$1');
    }

    return str;

  },

  getFiles(items) {
    const files = items ? [].concat(items) : ['package.json'];
    const list = [];


    files.forEach((item) => {
      const fileGlob = glob.sync(item.file || item, {
        dot: true,
      });

      list.push(...fileGlob);
    });

    const unique = list.filter((item, i) => {
      return item && list.indexOf(item) === i;
    });

    return unique;
  },

  async readJSON(file) {
    try {
      const json = await fs.readJson(path.resolve(process.cwd(), file));

      return json;
    } catch (err) {
      return {};
    }
  },

  writeJSON(file, input) {
    let json = input;

    if (typeof json === 'object') {
      json = JSON.stringify(json, null, 2);
    }
    json += '\n';
    fs.writeFileSync(file, json);
  },

  getBumpError(opts) {
    let err = null;

    if (typeof opts.releaseType === 'undefined') {
      err = 'noRelease';
    } else if (!opts.sourceFile) {
      err = 'noSource';
    } else if (!opts.version) {
      err = 'noVersion';
    } else if (config.releaseTypes.indexOf(opts.releaseType) === -1) {
      if (!semver.valid(opts.releaseType)) {
        err = 'invalidRelease';
      }
    } else if (!semver.valid(opts.version)) {
      err = 'invalidVersion';
    }

    return err;
  },

  bumpError(opts) {
    const isErr = utils.getBumpError(opts);
    const def = '_default';

    // Special case for no releaseType (user just types "ump")
    if (isErr === 'noRelease') {
      console.log(chalk.yellow(chalk.bold('\nCURRENT VERSION:'), opts.version));
    } else if (isErr) {
      // All other errors
      console.log(chalk.red(`\n${config.messages[isErr]}` || config.messages[def]));

      ['releaseType', 'sourceFile', 'version'].forEach((item) => {
        log.keyValue(item, opts[item]);
      });
    }

    return isErr;
  },

  error(err) {
    throw err;
  },

  debug(obj) {
    const debugOutput = JSON.stringify(obj, null, 2);
    const file = '.ump.debug.json';

    return fs.writeFile(file, debugOutput)
    .then(() => {
      log.color(`\n**DEBUG ONLY! Writing the following to ${file}:**`, 'cyan');
      console.log(debugOutput);
    });
  },

  extend: function extend(...args) {
    let arg, prop;
    let al = args.length;
    const firstArg = al === 1 ? {} : args.shift();

    while (--al > -1) {
      arg = args[al];

      if ((typeof arg === 'object' && arg !== null) || typeof arg === 'function') {
        for (prop in arg) {
          if (arg.hasOwnProperty(prop)) {
            firstArg[prop] = arg[prop];
          }
        }
      }
    }

    return firstArg;
  },

  repoDirty: function(stdout, files) {
    const lines = stdout
    .trim().split('\n')
    .filter((line) => {
      const file = line.replace(/.{1,2}\s+/, '');

      return line.trim() && !file.match(/^\?\? /) && files.indexOf(file) === -1;
    })
    .map((line) => {
      return line.trim();
    });

    return lines;
  },

  resetVersion: function(opts) {
    log.color('Did not execute commands. Resetting version.', 'red');
    Promise.all(opts.files.map(async(file) => {
      const json = await utils.readJSON(file);

      json.version = opts.version;
      utils.writeJSON(file, json);
    }));
  },

  getNewVersion: function(opts) {
    // semver release type
    if (config.releaseTypes.indexOf(opts.releaseType) !== -1) {
      return semver.inc(opts.version, opts.releaseType);
    }

    // but, also allow for hardcoded number release
    return opts.releaseType;
  },

  buildOptions: async function(options) {
    const appName = options.appName || 'ump';
    const rcOptions = rc(appName);
    const opts = utils.extend(config.defaults, rcOptions, options);

    opts.files = utils.getFiles(opts.files);
    opts.extraFiles = utils.getFiles(opts.extras || []);
    opts.sourceFile = opts.files[0];

    // opts.publish always implies opts.release as well (git push && git push --tags)
    if (opts.publish) {
      opts.release = true;
    }

    const src = await utils.readJSON(opts.sourceFile);

    opts.version = src.version;

    if (utils.bumpError(opts)) {
      return Object.assign(opts, {error: true});
    }

    opts.newVersion = utils.getNewVersion(opts);

    return opts;
  },
};

export {utils};
