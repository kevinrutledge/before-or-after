/**
 * Transform ESM to CommonJS for tests.
 * This allows Jest to run tests without experimental flags.
 */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        modules: "commonjs" // Convert ES modules to CommonJS for Jest compatibility
      }
    ]
  ]
};
