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
};

let pkg = {
  name: 'testump',
  title: 'testump',
  version: '1.0.0',
};

const tests = {
  utils: function() {
    const utils = require('../lib/utils');
    let opts = utils.buildOptions(settings);

    it('should build options object', function() {
      expect(opts.sourceFile).to.equal(settings.files[0]);
      expect(opts.newVersion).to.equal('1.0.1');
      expect(opts.version).to.equal('1.0.0');
    });

    it('should get only files that exist', function() {
      let options = Object.assign({}, settings, {files: ['test/testarea/package.json', 'doesnt/exist.js']});
      let files = utils.getFiles(options);

      expect(files.length).to.equal(1);
      expect(files[0]).to.equal(settings.files[0]);
    });
  }
};

fs.writeFileAsync(path.join(__dirname, 'testarea/package.json'), JSON.stringify(pkg))
.then(() => {
  describe('ump', function() {
    Object.keys(tests).forEach((test) => {
      describe(test, tests[test]);
    });
  });

  run();
})
.catch(run);
