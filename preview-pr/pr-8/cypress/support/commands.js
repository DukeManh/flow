// ***********************************************
// Custom commands for Flow State app
// ***********************************************

// Clear local storage to reset app state
Cypress.Commands.add('clearAppData', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// Wait for app to be fully loaded
Cypress.Commands.add('waitForAppLoad', () => {
  // First, handle the splash screen if present
  cy.window().then((win) => {
    // Hide splash screen if it exists
    const splash = win.document.getElementById('appSplashScreen');
    if (splash) {
      splash.style.display = 'none';
      win.sessionStorage.setItem('flowSplashShown', 'true');
      win.document.documentElement.classList.remove('loading');
      win.document.documentElement.classList.add('loaded');
    }
  });
  
  // Then wait for main elements
  cy.get('#timerCard', { timeout: 5000 }).should('be.visible');
  cy.get('#goalCard', { timeout: 5000 }).should('be.visible');
});

// Create a new project with given name and color (default color if not specified)
Cypress.Commands.add('createProject', (name, color = null) => {
  cy.get('#newProjectBtn').click();
  cy.get('#modalProjectName').should('be.visible').type(name);
  
  if (color) {
    cy.get(`.modal-color-options .color-option[data-color="${color}"]`).click();
  }
  
  cy.get('#modalSaveProjectBtn').click();
  cy.get('#projectModal').should('not.be.visible');
});

// Select a project by name
Cypress.Commands.add('selectProject', (projectName) => {
  cy.get('#projectDropdownBtn').click();
  cy.get('.project-option').contains(projectName).click();
});

// Add a todo item
Cypress.Commands.add('addTodo', (todoText) => {
  cy.get('#todoInput').type(todoText);
  cy.get('#addTodoBtn').click();
  cy.contains('#todoList li', todoText).should('be.visible');
});

// Set a goal
Cypress.Commands.add('setGoal', (goalText) => {
  // Click the goal card to trigger the editor (if it's in display mode)
  cy.get('#goalContainer').click();
  
  // Try clicking the edit button if available
  cy.get('body').then($body => {
    if ($body.find('#editGoalBtn').length > 0) {
      cy.get('#editGoalBtn').click();
    }
  });
  
  // Now we should have the input field
  cy.get('#goalInput', { timeout: 2000 }).should('be.visible').clear().type(goalText);
  cy.get('#saveGoalBtn').click();
  
  // Verify the goal was saved
  cy.get('#flowGoal').should('contain', goalText);
});

// Start the timer
Cypress.Commands.add('startTimer', () => {
  cy.get('#startBtn').click();
  // Wait for timer to be running
  cy.get('#pauseBtn').should('be.visible');
});

// Pause the timer
Cypress.Commands.add('pauseTimer', () => {
  cy.get('#pauseBtn').click();
  cy.wait(1000);
  cy.get('#startBtn').should('be.visible');
});

// Get the current timer value
Cypress.Commands.add('getTimerValue', () => {
  return cy.get('#timer').invoke('text');
});

// Set timer preset
Cypress.Commands.add('setTimerPreset', (preset) => {
  cy.get('#settingsBtn').click();
  cy.get(`input[name="timer-preset"][value="${preset}"]`).check();
  cy.get('#saveSettingsBtn').click();
});

// Enter focus mode from main timer
Cypress.Commands.add('enterFocusMode', () => {
  cy.get('#distractionToggle').click();
  cy.url().should('include', '/focus.html');
  cy.get('#timer').should('be.visible');
});

// Get current circular progress value (for focus mode)
Cypress.Commands.add('getCircularProgress', () => {
  return cy.get('#circularProgress').invoke('css', '--progress-percent');
});

// Toggle YouTube player (for focus mode)
Cypress.Commands.add('toggleYouTubePlayer', () => {
  cy.get('#togglePlayerBtn').click();
});

// Set YouTube volume (for focus mode)
Cypress.Commands.add('setYouTubeVolume', (volume) => {
  cy.get('#volumeSlider').invoke('val', volume).trigger('input');
  cy.get('#volumePercent').should('contain', `${volume}%`);
});