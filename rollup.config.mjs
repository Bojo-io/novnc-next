import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import pkg from './package.json' assert { type: 'json' };

// Determine if we are in production mode (e.g., for minification)
// const production = !process.env.ROLLUP_WATCH;

// Define Babel plugin configuration
const babelConfig = {
  // Prevent Babel from modifying files in node_modules
  exclude: ['node_modules/**'],
  // Use Babel config from babel.config.js or .babelrc
  // Or configure directly:
  // presets: [['@babel/preset-env', { modules: false }]],
  // Use @babel/runtime helpers
  babelHelpers: 'runtime', // Changed from 'bundled' to 'runtime' to avoid duplication
  plugins: ['@babel/plugin-transform-runtime'] // Add the runtime transform plugin
};

export default [
  // CommonJS (CJS) build for Node / older bundlers
  {
    input: 'core/rfb.js',
    output: {
      file: pkg.main, // Output path from package.json main field
      format: 'cjs',
      sourcemap: true, // Include source maps
      exports: 'auto', // Adjust based on your module structure if needed
    },
    plugins: [
      resolve(), // Locates modules using the Node resolution algorithm
      commonjs(), // Converts CommonJS modules to ES6
      babel(babelConfig) // Transpiles JS code
    ],
    // Define external dependencies if necessary (e.g., if runtime helpers aren't bundled)
    // external: [/@babel\\/runtime/],
  },

  // ES Module (ESM) build for modern browsers/bundlers
  {
    input: 'core/rfb.js',
    output: {
      file: pkg.module, // Output path from package.json module field
      format: 'esm',
      sourcemap: true, // Include source maps
    },
    plugins: [
      resolve(),
      commonjs(),
      babel(babelConfig)
    ],
    // Define external dependencies if necessary
    // external: [/@babel\\/runtime/],
  }
]; 