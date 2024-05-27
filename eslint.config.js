// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
   {
      // config with just ignores is the replacement for `.eslintignore`
      ignores: ['dist/**'],
   },
   { languageOptions: { globals: globals.browser } },
   {
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      rules: {
         '@typescript-eslint/no-explicit-any': 'off',
         '@typescript-eslint/no-unused-vars': 'warn',
         '@typescript-eslint/no-var-requires': 'off',
         '@typescript-eslint/ban-ts-comment': 'off',
         'no-case-declarations': 'off',
         'prefer-rest-params': 'warn',
         'no-empty': 'off',
      },
   }
);
