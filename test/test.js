import path from 'path';
import Promises from 'bluebird';
import fs from 'fs-extra';
import ump from '../ump.js';
import {utils} from '../lib/utils.js';
import {commands} from '../lib/commands.js';

import {expect} from 'chai';

// @ts-ignore
const dirname = utils.getDirName(import.meta.url);

const settings = {
  inquire: false,
  debug: true,
  releaseType: 'patch',
  files: ['test/testarea/package.json'],
  extras: [
    'test/testarea/f1.js',
    {
      file: 'test/testarea/f2.js',
      prefix: '@version\\s*',
    },
  ],
};

const pkg = {
  name: 'testump',
  title: 'testump',
  version: '1.0.0',
};

let opts = {};

const tests = {
  utils() {
    it('should build options object', () => {
      expect(opts.sourceFile).to.equal(settings.files[0]);
      expect(opts.newVersion).to.equal('1.0.1');
      expect(opts.version).to.equal('1.0.0');
    });

    it('should get only files that exist', () => {
      const options = Object.assign({}, settings, {files: ['test/testarea/package.json', 'doesnt/exist.js']});
      const files = utils.getFiles(options.files);

      expect(files.length).to.equal(1);
      expect(files[0]).to.equal(settings.files[0]);
    });

    it('should get all extras files', () => {
      expect(opts.extraFiles.length).to.equal(2);
    });
  },

  commands() {
    const extras = commands.extras(opts);

    it('should have correct log info', () => {
      expect(extras.log).to.equal('* Update version (using RegEx) to 1.0.1 in test/testarea/f1.js, test/testarea/f2.js');
    });

    it('should update extra files to correct version', () => {
      return extras.cmd()
      .then(() => {
        return fs.readFile('test/testarea/f1.js', 'utf8');
      })
      .then((content) => {
        expect(/v1\.0\.1/.test(content)).to.equal(true);
      })
      .then(() => {
        return fs.readFile('test/testarea/f2.js', 'utf8');
      })
      .then((content) => {
        expect(/@version 1\.0\.1/.test(content)).to.equal(true);
      });
    });
  },
};

const files = [
  {
    file: 'package.json',
    content: JSON.stringify(pkg),
  },
  {
    file: 'f1.js',
    content: `
      /* hello there */

      // test f1 - v1.0.0

      let f1 = function() {

      };
    `,
  },
  {
    file: 'f2.js',
    content: `
      /* hello there */

      /**
       * @name f2
       * @version 1.0.0
       */

      let f2 = function() {

      };
    `,
  },
];

const runTests = async() => {
  try {
    await Promises.each(files, (file) => {
      return fs.writeFile(path.join(dirname, 'testarea/', file.file), file.content);
    });

    opts = await utils.buildOptions(settings);
    describe('ump', () => {
      Object.entries(tests).forEach(([name, test]) => {
        describe(name, test);
      });
    });
  } catch (err) {
    console.error(err);
  }
  run();
};

runTests();
