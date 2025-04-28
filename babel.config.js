module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        // Configure preset-env options if needed
        // e.g., targets: { browsers: '> 0.5%, not dead' }
        // By default, it targets a broad range of browsers.
        // Setting modules: false is often recommended for bundlers like Rollup,
        // but let's rely on Rollup's handling for now.
        // modules: false,
      }
    ]
  ]
  // plugins: [] // Add other Babel plugins if necessary
}; 