import path from 'path';
import fs from 'fs-extra';

let pkg = {};

try {
  pkg = fs.readJsonSync(path.join(process.cwd(), 'package.json'));
} catch (err) {
  pkg = {name: ''};
}

const config = {
  defaults: {
    sourceFile: 'package.json',
    message: 'Release %s',
    regexPrefix: '(?:\\-\\sv|version[\'"]?\\:\\s*[\'"])',
    regexReplace: '(?:[0-9]+\\.){2}[0-9]+[0-9a-zA-Z\\-_\\+\\.]*',
    regexFlags: 'g',
    autostash: true,
    skipPull: false,
  },

  messages: {
    _default: 'Sorry, but an unspecified error occurred. Check the source, dude.',
    noVersion: 'One or more files do not contain a version property.',
    invalidVersion: 'One or more files do not have a valid version.',
    noRelease: 'You need to provide a release type',
    gitPull: 'Need to pull first, but cannot pull with rebase: You have unstaged changes.',
    invalidRelease: 'You provided an invalid release type. See semver.org for more information.',
    noRepo: 'You cannot "release" this version. You are not in a git repository.',
    noSource: 'The specified source file does not exist.',
  },

  releaseTypes: [
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch',
  ],

  confirm: [
    {
      message: 'Are you sure you want to continue?',
      name: 'run',
      type: 'confirm',
    },
  ],

  publishPrompts: [
    {
      name: 'access',
      message: 'Is access public or restricted?',
      type: 'list',
      when: () => {
        return (pkg.name || '').charAt(0) === '@';
      },
      choices: [
        {name: 'public', default: true},
        {name: 'restricted'},
      ],
    },
  ],
};

Object.assign(config, {
  cliOptions: {
    // releaseType: {
    //   position: 0,
    //   description: `(Required) semver-compatible release type. One of: ${config.releaseTypes.join(', ')}. *OR* a valid version`,
    // },
    // files: {
    //   description: 'Optional space-separated list of JSON files to be bumped (relative to version in 1st listed). Default: package.json',
    //   list: true,
    //   position: 1,
    // },
    m: {
      alias: 'message',
      description: 'Message to be used for the commit and tag when `-r` or `-p` is set. Default: Release %s',
      type: 'string',
    },
    r: {
      alias: 'release',
      description: 'If set, runs `git add` and `git commit` for the bumped files and pushes a tagged release.',
      type: 'boolean',
    },
    p: {
      alias: 'publish',
      description: 'If set, automatically runs with the `--release` flag and then publishes the release to npm.',
      type: 'boolean',
    },
    a: {
      alias: 'autostash',
      description: 'Whether to use the --autostash flag when running `git pull`',
      type: 'boolean',
      default: true,
    },
    x: {
      alias: 'skip-pull',
      description: 'If set, skips executing the initial git pull command during a release/publish task. USE WITH CAUTION.',
      type: 'boolean',
      default: false,
    },
    d: {
      alias: 'debug',
      description: 'If set, ump will run in debug mode, outputting a json file instead of doing something',
      type: 'boolean',
    },
    extras: {
      description: 'Array of objects. ONLY AVAILABLE VIA .umprc OR when using ump() AS MODULE. Props: file, prefix (optional regex string), replaced (optional regex string), flags (optional). See https://github.com/kswedberg/ump/blob/master/README.md for more info.',
    },
  },
});

export {config};
