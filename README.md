The `ump` command updates the version number in package.json and any other json file you specify.

## Installation

For command-line use, install globally:

`npm install -g ump`

For programmatic use (in a node.js script), install locally:

`npm install ump`

## Usage

`ump releaseType [files]... [options]`

* **`releaseType`**: The semver-compatible release type. One of: `major`, `minor`, `patch`, `premajor`, `preminor`, `prepatch`. *OR* a valid version.
* **`files`**: Default: package.json — Optional space-separated list of .json files that will be bumped. The first one is assumed to contain the "canonical" version by which all will be bumped.

* **Options**
    * `-m`, `--message`:      Message to be used for the commit and tag when `-r` or `-p` is set. Default: Release %s
    * `-r`, `--release`:      If set, runs `git add` and `git commit` for the bumped files and pushes a tagged release.
    * `-p`, `--publish`:      If set, automatically runs with the `--release` flag and then publishes the release to npm.
    * `-d`, `--debug`:        If set, ump will run in debug mode, outputting a json file instead of doing something
    * `-h`, `--help`:         Shows help information on the command line

### .umprc

In addition to command-line options, you may use a `.umprc` file in your project's root. The format of this file may be valid JSON or INI.

Example .umprc using JSON format:

```
{
  "message": "Release v%s.",
  "publish": true
}
```

Example .umprc using INI format:

```
message="Release v%s."
publish=true
```

## Contributing

Thank you! Please consider the following when working on this repo before you submit a pull request:

* Style conventions are noted in the default rulesets of [eslint-config-kswedberg](https://github.com/kswedberg/eslint-config-kswedberg).
* To be sure your additions are lint-free and don't introduce any errors, **run `npm test` from the command line**.
* If possible, please use Tim Pope's [git commit message style](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html). Multiple commits in a pull request will be squashed into a single commit. I may adjust the message for clarity, style, or grammar. I manually commit all merged PRs using the `--author` flag to ensure that proper authorship (yours) is maintained.
