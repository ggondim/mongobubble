module.exports = {
  root: true,
  ignorePatterns: [
    '/.vscode/**/*',
    '/build/**/*',
    '/dist/**/*',
    '/**/*.test.js',
    '/node_modules/**/*',
    '.eslintrc.js'
  ],
  env: {
    es6: true,
    es2017: true,
    es2020: true,
    es2021: true,
    node: true,
  },
  plugins: [
    'import',
    '@typescript-eslint',
    'eslint-comments',
  ],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    project: './tsconfig.json'
  },
  globals: {
    "console": process.env.NODE_ENV === 'development' ? 'readonly' : 'off',
  },
  rules: {
    strict: 'off',
    'prefer-destructuring': 'off',
    'class-methods-use-this': 'off',
    camelcase: 'error',
    'no-new': 'error',
    'no-unused-vars': 'error',
    'max-len': ['error', { code: 100 }],
    'import/no-dynamic-require': 0,
    'padded-blocks': ['error', 'never'],
    'no-unused-expressions': 'error',
    // allow optionalDependencies
    'import/no-extraneous-dependencies': ['error', {
      optionalDependencies: ['test/unit/index.js'],
    }],
    // disallow reassignment of function parameters
    // disallow parameter object manipulation except for specific exclusions
    'no-param-reassign': ['error', {
      ignorePropertyModificationsFor: [
        'acc', // for reduce accumulators
        'e', // for e.returnvalue
        'config',
      ],
    }],
    'no-plusplus': 'off',
    'comma-dangle': ['error', 'always-multiline'],
    semi: ['error', 'always'],
    'no-eval': 1,
    'no-confusing-arrow': 'off',
    'arrow-parens': 'off',
    'consistent-return': 'off',
    'no-alert': 'off',
    'no-underscore-dangle': 'off',
    'import/prefer-default-export': 'off',
    'import/extensions': ['warn', 'always', { ts: 'never' }],
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    radix: 'off',
  },
};
