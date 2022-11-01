// We specify ESLint config as JS rather than JSON to enable comments
module.exports = {
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
  },
  env: {
    node: true, // Include node globals
    es6: true, // Allow ES6 in JavaScript
    browser: true, // Include browser globals
    jquery: true, // Include jQuery and $
  },
  globals: {
    _: true,
    g1: true,
    d3: true,
    tape: true,
  },
  extends: "eslint:recommended",
  plugins: ["html"],
};
