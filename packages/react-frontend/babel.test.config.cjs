/**
 * Transform React JSX and ESM to CommonJS for tests.
 * This configuration maintains React support while enabling Jest compatibility.
 */
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: { node: "current" },
        modules: "commonjs" // Convert ES modules to CommonJS for Jest compatibility
      }
    ],
    [
      "@babel/preset-react",
      {
        runtime: "automatic" // Use the new JSX transform
      }
    ]
  ]
};
