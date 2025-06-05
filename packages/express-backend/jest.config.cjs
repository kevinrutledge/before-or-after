/**
 * Jest configuration using CommonJS format with coverage thresholds.
 * Provides stable test environment without experimental flags.
 */
module.exports = {
  forceExit: true,
  testEnvironment: "node",
  testTimeout: 10000,
  detectOpenHandles: false,
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
  collectCoverageFrom: ["src/**/*.js", "models/**/*.js"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
};
