/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts'],
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
