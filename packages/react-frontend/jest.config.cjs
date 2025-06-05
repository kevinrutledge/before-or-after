/**
 * Configure Jest for React tests with coverage thresholds.
 */
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      {
        presets: [
          [
            "@babel/preset-env",
            {
              targets: { node: "current" },
              modules: "commonjs"
            }
          ],
          ["@babel/preset-react", { runtime: "automatic" }]
        ]
      }
    ]
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  testMatch: ["**/tests/**/?(*.)+(test).{js,jsx}"],
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/main.jsx"],
  coverageDirectory: "coverage",
  moduleDirectories: ["node_modules", "src"],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
};
