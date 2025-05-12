const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5500',
    viewportWidth: 1280,
    viewportHeight: 800,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  chromeWebSecurity: false, // Disable Chrome web security to avoid CORS issues
  video: true,
  screenshotOnRunFailure: true,
});