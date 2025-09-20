import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js'
import { fixupConfigRules } from '@eslint/compat'
import pluginReactRefresh from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    settings: {
      react: { version: '19.0' },
    },
  },
  pluginJs.configs.recommended,
  ...fixupConfigRules(pluginReactConfig),
  prettierConfig,
  {
    plugins: { 'react-refresh': pluginReactRefresh },
    rules: {
      'react-refresh/only-export-components': 'warn',
      'react/prop-types': 'off',
    },
  },
  { ignores: ['dist', 'node_modules'] },
]
