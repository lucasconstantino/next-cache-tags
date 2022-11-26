/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  transform: {
    '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
  },
  testEnvironment: 'node',
}
