'use strict';

import path from 'path';
import {writeFile, readFile, stat} from 'node:fs/promises';
import fs from 'node:fs';
import {globSync} from 'glob';
import {styleText} from 'node:util';
import rc from 'rc';
import semver from 'semver';
import {config} from './config.js';
import {log} from './log.js';


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
  async checkGitConfig(gitPath) {
    const gitDirOrFile = await stat(gitPath);

    if (gitDirOrFile.isDirectory()) {
      await readFile(`${gitPath}/config`);

      return;
    }

    // If we're in a submodule, the .git path will be a file that contains a 'gitdir: …' entry
    const contents = await readFile(gitPath, 'utf8');
    const content = contents.split(/\n/)[0];
    const gitdir = content.replace(/^\s*gitdir:\s*(.+)$/, '$1');

    const gitConfig = path.resolve(`${gitdir}/config`);

    await readFile(gitConfig);
  },

  getFiles(items) {
    const files = items ? [].concat(items) : ['package.json'];
    const list = [];


    files.forEach((item) => {
      const fileGlob = globSync(item.file || item, {
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
    const filePath = path.resolve(process.cwd(), file);

    try {
      const str = await readFile(filePath, 'utf8');
      const json = JSON.parse(str);

      return json;
    } catch (err) {
      console.log(err);

      return {error: true};
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
      console.log(styleText(['yellow', 'bold'], '\nCURRENT VERSION:'));
    } else if (isErr) {
      // All other errors
      console.log(styleText('red', `\n${config.messages[isErr]}` || config.messages[def]));

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

    return writeFile(file, debugOutput)
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
    opts.skipPull = opts.skipPull || opts['skip-pull'];
    opts.tagPrefix = opts.tagPrefix || opts['tag-prefix'];
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

/**
* @callback ArrayCallback
* @param {any} item
* @param {number} [index]
* @param {array} [array]
* @returns {Promise}
*/

/**
 * "Promised `each()`" for iterating over an array of items, calling a function that returns a promise for each one. So, each one waits for the previous one to resolve before being called
 * @function peach
 * @param {array} arr Array to iterate over
 * @param {ArrayCallback} fn Function that is called for each element in the array, each returning a promise
 * @returns {Array.<Promise>} Array of promises
 */
const peach = (arr, fn) => {
  const originalArray = [...arr];
  const funcs = arr.map((item, i) => {
    return () => fn(item, i, originalArray);
  });

  // @ts-ignore
  return funcs.reduce((promise, func) => {
    return promise
    .then((result) => {
      const called = func();
      // If the function doesn't return a "then-able", create one with Promise.resolve():

      return (called && typeof called.then === 'function' ? called : Promise.resolve(called))
      .then([].concat.bind(result));
    });

  }, Promise.resolve([]));
};

export {utils, peach};
