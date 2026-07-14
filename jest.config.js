/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        configFile: require.resolve('./babel.config.js'),
        caller: {
          name: 'metro',
          bundler: 'metro',
          preserveEnvVars: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.(mp4|mov|jpg|jpeg|png)$': '<rootDir>/src/__mocks__/fileAsset.js',
  },
  modulePathIgnorePatterns: ['<rootDir>/functions/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};
