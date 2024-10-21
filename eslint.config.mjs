import jsConfig from 'eslint-config-kswedberg/flat/js.mjs';
import {nodeGlobals} from 'eslint-config-kswedberg/flat/globals.mjs';

export default [
  nodeGlobals,
  ...jsConfig,
  {files: ['**/*.js']},
  {ignores: ['test/testarea/*.js']},
];
