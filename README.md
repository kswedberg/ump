The `ump` command updates the version number in package.json and any other json file you specify.

## Installation

For command-line use, install globally:

`npm install -g ump`

For programmatic use (i.e. requiring it as a module in a node.js script), install locally:

`npm install ump`

## Command-line Usage

`ump releaseType [files]... [options]`

* **`releaseType`**: The semver-compatible release type. One of: `major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`. *OR* a valid version.
* **`files`**: Default: package.json — Optional space-separated list of .json files that will be bumped. The first one is assumed to contain the "canonical" version by which all will be bumped.

* **Options**
  * `-m`, `--message`:      Message to be used for the commit and tag when `-r` or `-p` is set. Default: Release %s
  * `-r`, `--release`:      If set, runs `git add` and `git commit` for the bumped files and pushes a tagged release.
  * `-p`, `--publish`:      If set, automatically runs with the `--release` flag and then publishes the release to npm.
  * `-a`, `--autostash`:    Default: `true`. Whether to use the `--autostash` flag when running `git pull`
  * `-x`, `--skip-pull`:    If set, skips executing the initial git pull command during a release/publish task. USE WITH CAUTION.
  * `-d`, `--debug`:        If set, ump will run in debug mode, outputting a json file instead of doing something
  * `-h`, `--help`:         Shows help information on the command line

## Module Usage

The only required option is `files`, which takes an array of files. All other options are the same as the command-line *long-hand* options — `message, release, publish, debug` (not `help`). Note: the `skip-pull` option can be written as either kebab case (`skip-pull`) or camel case (`skipPull`).

```js
import ump from 'ump';

ump({
  files: [
    'package.json',
    'bowersomething.json'
  ],
  release: true
});

```

## .umprc

In addition to command-line options, you may use a `.umprc` file in your project's root. The format of this file may be valid JSON or INI.

Example .umprc using JSON format:

```json
{
  "message": "Release v%s.",
  "publish": true
}
```

Example .umprc using INI format:

```ini
message="Release v%s."
publish=true
```

## Extra files

If you want to update a version in a file that is not in JSON format, you can do so by adding the `extras` property to the `.umprc` file (or to the options object if using ump as a module).

The value of the `extras` property is an array of strings (representing file paths) or objects with the following properties:

* `prefix`: string value representing a regular expression to match text preceding the actual version within the file. Default: `'(?:\\-\\sv|version[\'"]?\\:\\s*[\'"])'`
* `replaced`: string value representing a regular expression to match the version number (immediately following the `prefix` text) that you want to be replaced. Ideally, should match a valid semver version. Default: '(?:[0-9]+\\.){2}[0-9]+[0-9a-zA-Z\\-_\\+\\.]*'
* `flags`: string value representing one or more regular expression flags. Default: `'g'`


### Example .umprc:

```json
{
  "extras": [
    "foo/bar/baz.js",
    {
      "file": "/biz/shizz.js"
    },
    {
      "file": "docs/mydocblock.js",
      "prefix": "@version\\s+",
      "flags": ""
    }
  ]
}
```

In the example, the first two files use the default options. If we were performing a minor bump (and assuming the version in `package.json` matches that in the files):

* `// myfile - v1.3.2` would become `// myfile - v1.4.0`
* `{'version': '3.2.1-pre'}` would become `{'version': '3.3.0'}`

The last file ("docs/mydocblock.js") would change the first match only because the `"g"` flag is removed. Therefore, `// * @version 1.2.1` at the top of the file would become `// * @version 1.3.0` but any subsequent `// @version x.x.x` in the file would be ignored.

### Notes:

* Because `ump` uses `new Regexp()` to build the regular expression, rather than regular expression literal syntax, you must "double escape" the `prefix` and `replaced` options.
* You will rarely, if ever, need to change the `replaced` value.

## Contributing

Thank you! Please consider the following when working on this repo before you submit a pull request:

* Style conventions are noted in the default rulesets of [eslint-config-kswedberg](https://github.com/kswedberg/eslint-config-kswedberg).
* To be sure your additions are lint-free and don't introduce any errors, **run `npm test` from the command line**.
* If possible, please use Tim Pope's [git commit message style](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html). Multiple commits in a pull request will be squashed into a single commit. I may adjust the message for clarity, style, or grammar. I manually commit all merged PRs using the `--author` flag to ensure that proper authorship (yours) is maintained.
