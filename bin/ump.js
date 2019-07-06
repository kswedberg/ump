#!/usr/bin/env node

require('../lib/notifier');
const parser = require('nomnom');
const ump = require('../ump');

const options = require('../lib/config').cliOptions;

const opts = parser.script('ump')
.options(options).parse();

opts.inquire = true;

ump(opts);

if (!opts.releaseType) {
  parser
  .script('ump')
  .options(options)
  .parse(['-h']);
}
