/**
 * E2E test for project management functionality
 */
describe('Project Management', () => {
  beforeEach(() => {
    cy.clearAppData();
    cy.visit('/', { timeout: 5000 });
    cy.waitForAppLoad();
  });
  
  it('should create a new project', () => {
    const projectName = 'Test Project';
    
    // Create a new project
    cy.createProject(projectName);
    
    // Verify the project name is displayed in the UI
    cy.get('.current-project-name').should('contain', projectName);
  });
  
  it('should switch between projects', () => {
    // Create two projects
    cy.createProject('Project One');
    cy.createProject('Project Two');
    
    // Set a goal and add a todo for Project Two
    cy.setGoal('Goal for Project Two');
    cy.addTodo('Todo for Project Two');
    
    // Switch to Project One
    cy.selectProject('Project One');
    
    // Verify Project One is selected
    cy.get('.current-project-name').should('contain', 'Project One');
    
    // Set a different goal and add a different todo
    cy.setGoal('Goal for Project One');
    cy.addTodo('Todo for Project One');
    
    // Switch back to Project Two
    cy.selectProject('Project Two');
    
    // Verify Project Two's data is displayed
    cy.get('#goalCard').should('contain', 'Goal for Project Two');
    cy.get('#todoList').should('contain', 'Todo for Project Two');
    cy.get('#todoList').should('not.contain', 'Todo for Project One');
    
    // Switch back to Project One
    cy.selectProject('Project One');
    
    // Verify Project One's data is displayed
    cy.get('#goalCard').should('contain', 'Goal for Project One');
    cy.get('#todoList').should('contain', 'Todo for Project One');
    cy.get('#todoList').should('not.contain', 'Todo for Project Two');
  });
  
  it('should delete a project', () => {
    // Create two projects
    cy.createProject('Project to Delete');
    cy.createProject('Project to Keep');
    
    // Open the dropdown
    cy.get('#projectDropdownBtn').click();
    
    // Find the delete button for the first project and click it
    cy.contains('.project-option', 'Project to Delete')
      .find('.project-delete-btn')
      .click();
    
    // Confirm the deletion
    cy.on('window:confirm', (text) => {
      expect(text).to.include('Are you sure to permanently delete');
      return true;
    });
    
    // Verify the project was deleted
    cy.get('.project-dropdown-content').should('not.contain', 'Project to Delete');
    cy.get('.current-project-name').should('contain', 'Project to Keep');
  });
  
  it('should not allow deleting a project during active timer', () => {
    // Create a project
    cy.createProject('Cannot Delete While Active');
    
    // Start the timer
    cy.startTimer();
    
    // Try to delete the project
    cy.get('#projectDropdownBtn').click();
    cy.contains('.project-option', 'Cannot Delete While Active')
      .find('.project-delete-btn')
      .click();
    
    // Check for alert
    cy.on('window:alert', (text) => {
      expect(text).to.equal('Cannot delete a project during an active focus session.');
      return true;
    });
    
    // Verify the project still exists
    cy.get('.current-project-name').should('contain', 'Cannot Delete While Active');
  });
  
  it('should set a daily focus target', () => {
    // Create a project
    cy.createProject('Target Project');
    
    // Click Edit button for target
    cy.get('#saveTargetBtn').click();
    
    // Enter a target of 30 minutes
    cy.get('#targetFocusInput').should('not.be.disabled').clear().type('30');
    
    // Save the target
    cy.get('#saveTargetBtn').click();
    
    // Verify target was set
    cy.get('#targetFocusInput').should('have.value', '30');
    
    // Verify target appears in daily progress
    cy.get('.streak-stats').should('contain', '30 minutes');
  });
});