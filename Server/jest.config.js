module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middlewares/**/*.js",
    "utils/**/*.js",
    "!utils/email_templates/**",
  ],
};
