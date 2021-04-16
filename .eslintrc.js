// We specify ESLint config as JS rather than JSON to enable comments
module.exports = {
  'parserOptions': {
    'ecmaVersion': 6,
    'sourceType': 'module',
  },
  'overrides': [{
    'files': ['script.js', 'test/server.js', 'scripts/png.js', 'src/comicserver.js', 'src/comicgen.js'],
    'parserOptions': {
      'ecmaVersion': 8
    }
  }],
  'plugins': [
    'template'          // Handle Tornado templates and JS in HTML files
  ],
  'env': {
    'node': true,       // Include node globals
    'es6': true,        // Allow ES6 in JavaScript
    'browser': true,    // Include browser globals
    'jquery': true      // Include jQuery and $
  },
  'globals': {
    '_': true,
    'g1': true,
    'd3': true,
    'flubber': true,
    'tape': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    /* Override default rules */
    'indent': [2, 2, { 'VariableDeclarator': 2 }],  // Force 2 space indentation
    'linebreak-style': ['error', 'unix'],           // Force UNIX style line
    'semi': ['error', 'never'],                     // Force no-semicolon style
    'no-cond-assign': ['off', 'always'],            // Allow this for loops
    'space-before-blocks': ['error', 'always'],     // Space must precede brace
    'quotes': ['error', 'single']                   // We may go for a double-quotes style
  }
}
