// ***********************************************
// This file supports Cypress commands for Flow State app
// ***********************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Hide fetch/XHR requests in the Cypress command log
const app = window.top;
if (!app.document.head.querySelector('[data-hide-xhr-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-xhr-command-log-request', '');
  app.document.head.appendChild(style);
}

// Prevent Cypress from failing tests when app throws uncaught exceptions
Cypress.on('uncaught:exception', (err) => {
  // Returning false here prevents Cypress from failing the test
  return false;
});