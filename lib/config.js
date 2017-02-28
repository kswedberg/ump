var config = {
  defaults: {
    sourceFile: 'package.json',
    message: 'Release %s'
  },

  messages: {
    _default: 'Sorry, but an unspecified error occurred. Check the source, dude.',
    noVersion: 'One or more files do not contain a version property.',
    invalidVersion: 'One or more files do not have a valid version.',
    noRelease: 'You need to provide a release type',
    gitPull: 'Need to pull first, but cannot pull with rebase: You have unstaged changes.',
    invalidRelease: 'You provided an invalid release type. See semver.org for more information.',
    noRepo: 'You cannot "release" this version. You are not in a git repository.',
    noSource: 'The specified source file does not exist.'
  },
  releaseTypes: [
    'major',
    'minor',
    'patch',
    'premajor',
    'preminor',
    'prepatch'
  ],
  confirm: [
    {
      message: 'Are you sure you want to continue?',
      name: 'run',
      type: 'confirm'
    }
  ],
};

config = Object.assign(config, {
  cliOptions: {
    releaseType: {
      position: 0,
      // choices: config.releaseTypes,
      help: `(Required) semver-compatible release type. One of: ${config.releaseTypes.join(', ')}. *OR* a valid version`
      // required: true
    },
    files: {
      abbr: 'f',
      help: 'Optional space-separated list of JSON files to be bumped (relative to version in 1st listed). Default: package.json',
      list: true,
      position: 1
    },
    extras: {
      help: 'Array of objects. ONLY AVAILABLE VIA .umprc OR when using ump() AS MODULE. Props: file, prefix (optional regex string), replaced (optional regex string), flags (optional). See https://github.com/kswedberg/ump/blob/master/README.md for more info.'
    },
    message: {
      abbr: 'm',
      help: 'Message to be used for the commit and tag when `-r` or `-p` is set. Default: Release %s'
    },
    release: {
      abbr: 'r',
      help: 'If set, runs `git add` and `git commit` for the bumped files and pushes a tagged release.',
      flag: true
    },
    publish: {
      abbr: 'p',
      help: 'If set, automatically runs with the `--release` flag and then publishes the release to npm.',
      flag: true
    },
    debug: {
      abbr: 'd',
      help: 'If set, ump will run in debug mode, outputting a json file instead of doing something',
      flag: true
    }
  },
});

module.exports = config;
