#!/usr/bin/env node

import('../lib/notifier.js');
import yarg from 'yargs';
import ump from '../ump.js';
import {config} from '../lib/config.js';

const options = config.cliOptions;
const yargs = yarg(process.argv.slice(2));
const argv = yargs
.usage('Usage: $0 <releaseType> [files]... [options]')
.usage(`
* releaseType (required): The semver-compatible release type.
              One of: major, minor, patch, premajor, preminor, prepatch. *OR* a valid version.`)
.usage(`
* files (optional): Space-separated list of .json files to be bumped,
              relative to version in the first file listed.
              Default: package.json.`)
.example('ump -r patch', 'Bumps to the next patch version according to semver (e.g. 2.2.9 → 2.2.10), runs `git add` and `git commit` for the bumped files, and pushes a tagged release')
.example('ump minor -p', 'Bumps to the next minor version according to semver (e.g. 1.3.14 → 1.4.0) and publishes the project (which also automatically "releases" it)')
.help('h')
.alias('h', 'help')
.options(options)
.parse();

// @ts-ignore
const {_: positional, ...opts} = argv;

const releaseType = positional.shift();
const files = positional.length && positional;

Object.assign(opts, {inquire: true, releaseType, files});

if (!releaseType) {
  yargs.showHelp();
} else {
  ump(opts);
}
