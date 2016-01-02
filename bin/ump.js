#!/usr/bin/env node

require('../lib/notifier');
var parser = require('nomnom');
var utils = require('../lib/utils');
var ump = require('../ump');

var options = {
  releaseType: {
    position: 0,
    // choices: config.releaseTypes,
    help: '(Required) semver-compatible release type. One of: ' + utils.releaseTypes.join(', ') + '. *OR* a valid version'
    // required: true
  },
  files: {
    abbr: 'f',
    help: 'Optional space-separated list of JSON files that to be bumped (relative to version in 1st listed). Default: package.json',
    list: true,
    position: 1
  },
  message: {
    abbr: 'm',
    help: 'Message to be used for the commit and tag when `-r` or `-p` is set. Default: Release %s'
  },
  release: {
    abbr: 'r',
    help: 'If set, runs `git add` and `git commit` for the bumped files and pushes a tagged release.',
    flag: true
  },
  publish: {
    abbr: 'p',
    help: 'If set, automatically runs with the `--release` flag and then publishes the release to npm.',
    flag: true
  },
  debug: {
    abbr: 'd',
    help: 'If set, ump will run in debug mode, outputting a json file instead of doing something',
    flag: true
  }
};

var opts = parser.script('ump')
.options(options).parse();
opts.inquire = true;

ump(opts);

if (!opts.releaseType) {
  parser.script('ump')
  .options(options).parse(['-h']);
}
