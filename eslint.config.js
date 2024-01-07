import tstParser from '@typescript-eslint/parser';
import tsLintPlugin from '@typescript-eslint/eslint-plugin';

export default [
   {
      ignores: ['dist/*'],
   },
   {
      //An array of glob patterns indicating the files that the configuration object should apply to. If not specified, the configuration object applies to all files matched by any other configuration object.
      files: ['**/*.ts', '**/*.tsx'],
      // An object containing settings related to how JavaScript is configured for linting.
      languageOptions: {
         // The version of ECMAScript to support. May be any year (i.e., 2022) or version (i.e., 5). Set to "latest" for the most recent supported version. (default: "latest")
         ecmaVersion: 'latest',
         // The type of JavaScript source code. Possible values are "script" for traditional script files, "module" for ECMAScript modules (ESM), and "commonjs" for CommonJS files. (default: "module" for .js and .mjs files; "commonjs" for .cjs files)
         sourceType: 'module',
         //  An object containing a parse() method or a parseForESLint() method. (default: espree)
         parser: tstParser,
         //  An object specifying additional options that are passed directly to the parse() or parseForESLint() method on the parser. The available options are parser-dependent.
         parserOptions: {
            project: ['./tsconfig.json'],
            ecmaFeatures: {
               jsx: true,
            },
         },
      },
      plugins: {
         tsLintPlugin,
      },
      rules: {
         'max-len': 'off',
         // 'linebreak-style': ['error', 'unix'],
         'eol-last': 'error',
         // 'valid-jsdoc': 'off',
         // 'require-jsdoc': 'off',
         // 'camelcase': 'off',
         // 'guard-for-in': 'off',
         // 'prefer-promise-reject-errors': ['error', {allowEmptyReject: true}],
         'prefer-promise-reject-errors': 'off',
         curly: 'off',
         // 'comma-dangle': ['error', 'never'],
         'comma-spacing': 'error',
         'comma-style': 'error',
         // 'quote-props': ['error', 'consistent'],
         quotes: ['error', 'single', { allowTemplateLiterals: true }],
         'space-before-blocks': ['error', 'always'],
         'spaced-comment': ['error', 'always'],
         'prefer-spread': 'error',
         'prefer-const': ['error', { destructuring: 'all' }],
         //	'object-curly-spacing': ['error', 'never'],
         'array-bracket-spacing': ['error', 'never'],
         'switch-colon-spacing': 'error',
         'padded-blocks': ['error', 'never'],
         // 'new-cap': 'error',
         // 'no-unused-vars': 'off',
         'no-useless-call': 'error',
         'no-trailing-spaces': 'error',
         'no-mixed-spaces-and-tabs': 'error',
         'no-multiple-empty-lines': ['error', { max: 2 }],
         // 'no-multi-spaces': 'error',
         'no-multi-str': 'error',
         'no-new-wrappers': 'error',
         'no-irregular-whitespace': [
            'error',
            {
               skipStrings: true,
               skipComments: true,
               skipRegExps: true,
               skipTemplates: true,
            },
         ],
         'no-unexpected-multiline': 'error',
         // '@typescript-eslint/no-misused-promises': ['error', {checksConditionals: true, checksVoidReturn: true, checksSpreads: true}]
      },
   },
];
