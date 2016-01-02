'use strict';
var path = require('path');
var Promises = require('bluebird');
var fs = Promises.promisifyAll(require('fs-extra'));
var glob = require('glob');
var chalk = require('chalk');
var rc = require('rc');
var semver = require('semver');

var utils = {
  defaults: {
    sourceFile: 'package.json',
    message: 'Release %s'
  },

  messages: {
    '_default': 'Sorry, but an unspecified error occurred. Check the source, dude.',
    'noVersion': 'One or more files do not contain a version property.',
    'invalidVersion': 'One or more files do not have a valid version.',
    'noRelease': 'You need to provide a release type',
    'gitPull': 'Need to pull first, but cannot pull with rebase: You have unstaged changes.',
    'invalidRelease': 'You provided an invalid release type. See semver.org for more information.',
    'noRepo': 'You cannot "release" this version. You are not in a git repository.',
    'noSource': 'The specified source file does not exist.'
  },
  releaseTypes: [
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch'
  ],
  confirm: [
    {
      message: 'Are you sure you want to continue?',
      name: 'run',
      type: 'confirm'
    }
  ],
  escapeQuotes: function(str) {
    if (typeof str === 'string') {
      return str.replace(/(["$`\\])/g, '\\$1');
    } else {
      return str;
    }
  },

  getRc: function getRc(file) {
    return rc(file);
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

    files = Object.keys(list);

    return files;
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

  log: function log(txt, color) {
    if (color) {
      txt = chalk[color](txt);
    }
    console.log(txt);
  },
  bumpLog: function bumpLog(files, version, newVersion) {
    files = files.join(', ');

    console.log(chalk.bold('\nSET FILES:\t'), chalk.yellow(files));
    console.log(chalk.bold('OLD VERSION:\t'), chalk.yellow(version));
    console.log(chalk.bold('NEW VERSION:\t'), chalk.yellow(newVersion));
  },

  getBumpError: function getBumpError(src, releaseType, version) {
    var err = false;

    if (typeof releaseType === 'undefined') {
      err = 'noRelease';
    } else if (!src) {
      err = 'noSource';
    } else if (!version) {
      err = 'noVersion';
    } else if (utils.releaseTypes.indexOf(releaseType) === -1) {
      if (!semver.valid(releaseType)) {
        err = 'invalidRelease';
      }
    } else if (!semver.valid(version)) {
      err = 'invalidVersion';
    }

    return err;
  },
  bumpError: function bumpError(src, releaseType, version) {
    var isErr = utils.getBumpError(src, releaseType, version);
    var versionLabel = 'version';
    var def = '_default';
    // Special case for no releaseType (user just types "ump")
    if (isErr === 'noRelease') {
      console.log(chalk.yellow(chalk.bold('\nCURRENT VERSION:'), version));
    } else if (isErr) {
      // All other errors
      console.log(chalk.red('\n' + utils.messages[isErr] || utils.messages[def]));
      console.log(chalk.dim('releaseType'), releaseType);

      if (isErr === 'noSource') {
        versionLabel = 'sourceFile';
      }

      console.log(chalk.dim(versionLabel), version);

    }

    return isErr;
  },

  error: function error(err) {
    throw err;
  },

  debug: function debug(obj) {
    var debugOutput = JSON.stringify(obj, null, 2);

    return fs.writeFileAsync('ump.debug.json', debugOutput)
    .then(function() {
      utils.log('\n**DEBUG ONLY! Writing the following to bumpdebug.json:**', 'cyan');
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
    var log;

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
    utils.log('Did not execute commands. Resetting version.', 'red');
    opts.files.forEach(function(file) {
      var json = utils.readJSON(file);
      json.version = opts.version;
      utils.writeJSON(file, json);
    });
  },
};

module.exports = utils;
