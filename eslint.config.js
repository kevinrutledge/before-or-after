import js from '@eslint/js';
import globals from 'globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';

// Compute __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base configuration for all JS files
const baseConfig = {
  files: ['**/*.{js,jsx}'],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { jsx: true },
  },
  plugins: {
    import: importPlugin,
    prettier: prettierPlugin,
  },
  rules: {
    // enforce one continuous alphabetized import block
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'no-unused-vars': 'warn',
    'no-undef': 'error',
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 120,
      },
    ],
  },
};

// React plugin configuration
const reactConfig = {
  files: ['packages/react-frontend/**/*.{js,jsx}'],
  languageOptions: {
    globals: { ...globals.browser },
    parserOptions: { jsx: true, ecmaFeatures: { jsx: true } },
  },
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    prettier: prettierPlugin,
    import: importPlugin,
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    ...reactPlugin.configs.recommended.rules,
    ...reactHooksPlugin.configs.recommended.rules,
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 120,
      },
    ],
  },
  linterOptions: {
    reportUnusedDisableDirectives: false,
    noInlineConfig: false,
  },
};

// Node-specific configuration
const nodeConfig = {
  files: ['packages/express-backend/**/*.js'],
  languageOptions: {
    globals: { ...globals.node },
  },
  plugins: {
    import: importPlugin,
    prettier: prettierPlugin,
  },
  rules: {
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 120,
      },
    ],
  },
};

export default [js.configs.recommended, baseConfig, reactConfig, nodeConfig];
