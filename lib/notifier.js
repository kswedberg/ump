import fs from 'fs-extra';
import path from 'path';
import {utils} from './utils.js';
import updateNotifier from 'update-notifier';

// @ts-ignore
const dirname = utils.getDirName(import.meta.url);
const pkg = fs.readJsonSync(path.resolve(dirname, '..', 'package.json'));

updateNotifier({
  packageName: pkg.name,
  packageVersion: pkg.version,
  updateCheckInterval: 1000 * 60 * 60 * 24,
}).notify();
