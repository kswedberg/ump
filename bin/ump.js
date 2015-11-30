#!/usr/bin/env node

require('../lib/notifier');
var parser = require('nomnom');
var utils = require('../lib/utils');
var ump = require('../ump');

var options = {
  releaseType: {
    position: 0,
    // choices: config.releaseTypes,
    help: 'The semver-compatible release type. One of: ' + utils.releaseTypes.join(', ') + '. *OR* a valid version'
    // required: true
  },
  sourceFile: {
    abbr: 's',
    help: 'File containing the "canonical" version. All files will be bumped relative to it. Default: package.json'
  },
  files: {
    abbr: 'f',
    help: 'List of JSON files that, along with the source file, will be bumped.',
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
    help: 'If set, bump will run in debug mode, outputting a json file instead of doing something',
    flag: true
  }
};

var opts = parser.script('ump')
.options(options).parse();

if (!opts.releaseType) {
  parser.script('ump')
  .options(options).parse(['-h']);
} else {
  opts.inquire = true;
  ump(opts);
}
