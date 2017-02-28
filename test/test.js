/* global run:false */
var Promises = require('bluebird');
var fs = Promises.promisifyAll(require('fs-extra'));
const path = require('path');
const ump = require('../ump');
const expect = require('chai').expect;

let settings = {
  inquire: false,
  debug: true,
  releaseType: 'patch',
  files: ['test/testarea/package.json'],
  extras: [
    'test/testarea/f1.js',
    {
      file: 'test/testarea/f2.js',
      prefix: '@version\\s*'
    },
  ]
};

let pkg = {
  name: 'testump',
  title: 'testump',
  version: '1.0.0',
};

const utils = require('../lib/utils');

const tests = {
  utils: function() {

    let opts = utils.buildOptions(settings);

    it('should build options object', function() {
      expect(opts.sourceFile).to.equal(settings.files[0]);
      expect(opts.newVersion).to.equal('1.0.1');
      expect(opts.version).to.equal('1.0.0');
    });

    it('should get only files that exist', function() {
      let options = Object.assign({}, settings, {files: ['test/testarea/package.json', 'doesnt/exist.js']});
      let files = utils.getFiles(options.files);

      expect(files.length).to.equal(1);
      expect(files[0]).to.equal(settings.files[0]);
    });

    it('should get all extras files', function() {
      expect(opts.extraFiles.length).to.equal(2);
    });
  },
  commands: function() {
    const opts = utils.buildOptions(settings);
    const commands = require('../lib/commands');
    const extras = commands.extras(opts);

    it('should have correct log info', function() {
      expect(extras.log).to.equal('* Update version (using RegEx) to 1.0.1 in test/testarea/f1.js, test/testarea/f2.js');
    });

    it('should update extra files to correct version', function() {
      return extras.cmd()
      .then(() => {
        return fs.readFileAsync('test/testarea/f1.js', 'utf8');
      })
      .then((content) => {
        expect(/v1\.0\.1/.test(content)).to.equal(true);
      })
      .then(() => {
        return fs.readFileAsync('test/testarea/f2.js', 'utf8');
      })
      .then((content) => {
        expect(/@version 1\.0\.1/.test(content)).to.equal(true);
      });
    });
  }
};


let files = [
  {
    file: 'package.json',
    content: JSON.stringify(pkg)
  },
  {
    file: 'f1.js',
    content: `
      /* hello there */

      // test f1 - v1.0.0

      let f1 = function() {

      };
    `
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
    `
  }
];

Promises.each(files, function(file) {
  return fs.writeFileAsync(path.join(__dirname, 'testarea/', file.file), file.content);
})
.then(() => {
  describe('ump', function() {
    Object.keys(tests).forEach((test) => {
      describe(test, tests[test]);
    });
  });

  run();
})
.catch(run);
