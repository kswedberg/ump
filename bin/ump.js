#!/usr/bin/env node

require('../lib/notifier');
var parser = require('nomnom');
var ump = require('../ump');

var options = require('../lib/config').cliOptions;

var opts = parser.script('ump')
.options(options).parse();

opts.inquire = true;

ump(opts);

if (!opts.releaseType) {
  parser
  .script('ump')
  .options(options)
  .parse(['-h']);
}
