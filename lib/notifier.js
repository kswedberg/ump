
var updateNotifier = require('update-notifier');
var pkg = require('../package.json');

updateNotifier({
  packageName: pkg.name,
  packageVersion: pkg.version,
  updateCheckInterval: 1000 * 60 * 60 * 24
}).notify();
