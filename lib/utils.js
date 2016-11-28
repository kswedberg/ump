'use strict';
var path = require('path');
var Promises = require('bluebird');
var fs = Promises.promisifyAll(require('fs-extra'));
var exec = Promises.promisify(require('child_process').exec);
var glob = require('glob');
var chalk = require('chalk');
var rc = require('rc');
var semver = require('semver');
var config = require('./config');
var log = require('./log');

var utils = {
  escapeQuotes: function(str) {
    if (typeof str === 'string') {
      return str.replace(/(["$`\\])/g, '\\$1');
    } else {
      return str;
    }
  },

  getFiles: function getFiles(opts) {
    var files = opts.files ? [].concat(opts.files) : ['package.json'];
    var list = {};


    files.forEach(function(file) {
      file = glob.sync(file, {
        dot: true
      });


      if (Array.isArray(file)) {
        file.forEach(function(f) {
          list[f] = 1;
        });
      } else {
        list[file] = 1;
      }
    });

    return Object.keys(list);
  },

  readJSON: function readJSON(file) {
    try {
      return require(path.resolve('./', file));
    } catch (err) {
      return {};
    }
  },
  writeJSON: function writeJSON(file, json) {
    if (typeof json === 'object') {
      json = JSON.stringify(json, null, 2);
    }
    json += '\n';
    fs.writeFileSync(file, json);
  },

  getBumpError: function getBumpError(opts) {
    var err = false;

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

  bumpError: function bumpError(opts) {
    var isErr = utils.getBumpError(opts);
    var def = '_default';
    var label = 'version';
    var value = opts.version;

    // Special case for no releaseType (user just types "ump")
    if (isErr === 'noRelease') {
      console.log(chalk.yellow(chalk.bold('\nCURRENT VERSION:'), opts.version));
    } else if (isErr) {
      // All other errors
      console.log(chalk.red('\n' + config.messages[isErr] || config.messages[def]));

      ['releaseType', 'sourceFile', 'version'].forEach((item) => {
        log.keyValue(item, opts[item]);
      });
    }

    return isErr;
  },

  error: function error(err) {
    throw err;
  },

  debug: function debug(obj) {
    var debugOutput = JSON.stringify(obj, null, 2);
    var file = '.ump.debug.json';

    return fs.writeFileAsync(file, debugOutput)
    .then(function() {
      log.color('\n**DEBUG ONLY! Writing the following to ' + file + ':**', 'cyan');
      console.log(debugOutput);
    });
  },

  extend: function extend() {
    var arg, prop;
    var args = [].slice.call(arguments);
    var al = args.length;
    var firstArg = al === 1 ? {} : args.shift();

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

  repoDirty: function repoDirty(stdout, files) {
    var lines = stdout.trim().split('\n')
    .filter(function(line) {
      var file = path.basename(line.replace(/.{1,2}\s+/, ''));

      return line.trim() && !file.match(/^\?\? /) && file.indexOf(files) === -1;
    })
    .map(function(line) {
      return line.trim();
    });

    return lines;
  },

  resetVersion: function resetVersion(opts) {
    log.color('Did not execute commands. Resetting version.', 'red');
    opts.files.forEach(function(file) {
      var json = utils.readJSON(file);

      json.version = opts.version;
      utils.writeJSON(file, json);
    });
  },

  getNewVersion: function getNewVersion(opts) {
    // semver release type
    if (config.releaseTypes.indexOf(opts.releaseType) !== -1) {
      return semver.inc(opts.version, opts.releaseType);
    }

    // but, also allow for hardcoded number release
    return opts.releaseType;
  },

  buildOptions: function buildOptions(options) {
    var appName = options.appName || 'ump';
    var rcOptions = rc(appName);
    var opts = utils.extend(config.defaults, rcOptions, options);

    opts.files = utils.getFiles(opts);
    opts.sourceFile = opts.files[0];

    // opts.publish always implies opts.release as well (git push && git push --tags)
    if (opts.publish) {
      opts.release = true;
    }

    opts.version = utils.readJSON(opts.sourceFile).version;

    if (utils.bumpError(opts)) {
      return Object.assign(opts, {error: true});
    }

    opts.newVersion = utils.getNewVersion(opts);

    return opts;
  },

  // Taken from https://github.com/inikulin/publish-please/blob/master/src/publish.js
  checkNodeNpm: function checkNodeNpm() {
    return exec('npm version --json')
    .then((versions) => {
      const npmVersion = JSON.parse(versions).npm;
      const isNode6 = semver.gte(process.version, '6.0.0');
      const isSafeNpmVersion = semver.satisfies(npmVersion, '>=2.15.8 <3.0.0 || >=3.10.1');

      if (isNode6 && !isSafeNpmVersion) {
        throw new Error(`npm@${npmVersion} has known issues publishing when running Node.js 6. Please upgrade npm or downgrade Node and publish again. See: https://github.com/npm/npm/issues/5082`);
      }
    });
  },
};

module.exports = utils;
