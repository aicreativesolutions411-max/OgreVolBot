/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  clearMocks: true,
  // Keep the lab suite isolated from the parent JS repo's node test runner.
  roots: ["<rootDir>/src", "<rootDir>/tests"],
};
