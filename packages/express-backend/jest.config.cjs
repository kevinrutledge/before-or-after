/**
 * Jest configuration using CommonJS format with coverage thresholds.
 * Provides stable test environment without experimental flags.
 */
module.exports = {
  testEnvironment: "node",
  testTimeout: 30000, // allow up to 30 s for beforeAll hooks
  transform: {
    "^.+\\.js$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "commonjs"
            }
          ]
        ]
      }
    ]
  },
  testMatch: ["**/tests/**/?(*.)+(test).js"],
  moduleFileExtensions: ["js", "json"],
  collectCoverageFrom: ["src/**/*.js", "models/**/*.js", "scripts/**/*.js"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 10,
      functions: 10,
      lines: 10
    }
  }
};
