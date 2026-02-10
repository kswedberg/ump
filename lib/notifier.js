import fs from 'node:fs';
import path from 'path';
import {utils} from './utils.js';
import updateNotifier from 'update-notifier';

// @ts-ignore
const dirname = utils.getDirName(import.meta.url);
const pkgFile = fs.readFileSync(path.resolve(dirname, '..', 'package.json'), {encoding: 'utf8'});
const pkg = JSON.parse(pkgFile);

updateNotifier({
  packageName: pkg.name,
  packageVersion: pkg.version,
  updateCheckInterval: 1000 * 60 * 60 * 24,
}).notify();
