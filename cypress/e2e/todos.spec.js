/**
 * E2E test for todo list functionality
 */
describe('Todo List Functionality', () => {
  beforeEach(() => {
    cy.clearAppData();
    cy.visit('/', { timeout: 5000 });
    cy.waitForAppLoad();
  });
  
  it('should add and complete todos', () => {
    const todo1 = 'Finish documentation';
    const todo2 = 'Fix login bug';
    
    // Add first todo
    cy.addTodo(todo1);
    
    // Add second todo
    cy.addTodo(todo2);
    
    // Verify both todos exist
    cy.get('#todoList li').should('have.length', 2);
    cy.get('#todoList').should('contain', todo1);
    cy.get('#todoList').should('contain', todo2);
    
    // Mark first todo as complete
    cy.contains('#todoList li', todo1).find('input[type="checkbox"]').check();
    
    // Verify first todo is marked as complete
    cy.contains('#todoList li', todo1).should('have.class', 'completed');
    
    // Verify second todo is not completed
    cy.contains('#todoList li', todo2).should('not.have.class', 'completed');
  });
  
  it('should delete todos', () => {
    // Add two todos
    cy.addTodo('Todo to keep');
    cy.addTodo('Todo to delete');
    
    // Verify both todos exist
    cy.get('#todoList li').should('have.length', 2);
    
    // Delete the second todo - using the correct button class
    cy.contains('#todoList li', 'Todo to delete').find('.remove-btn').click();
    
    // Verify only the first todo remains
    cy.get('#todoList li').should('have.length', 1);
    cy.get('#todoList').should('contain', 'Todo to keep');
    cy.get('#todoList').should('not.contain', 'Todo to delete');
  });
  
  it('should persist todos across page reloads', () => {
    // Add a todo
    cy.addTodo('Persistent todo');
    
    // Verify todo exists
    cy.get('#todoList li').should('have.length', 1);
    
    // Reload the page
    cy.reload();
    cy.waitForAppLoad();
    
    // Allow extra time for todo list to load from storage
    cy.wait(1000);
    
    // Verify todo persists
    cy.get('#todoList li').should('have.length', 1);
    cy.get('#todoList').should('contain', 'Persistent todo');
  });
  
  it('should handle empty todo input', () => {
    // Try to add an empty todo
    cy.get('#todoInput').type(' ');
    cy.get('#addTodoBtn').click();
    
    // Verify no todo was added
    cy.get('#todoList li').should('have.length', 0);
  });
  
  it('should maintain separate todos for each project', () => {
    // Create first project
    cy.createProject('Todo Project 1');
    
    // Add a todo for the first project
    cy.addTodo('Todo for Project 1');
    
    // Create second project
    cy.createProject('Todo Project 2');
    
    // Verify no todos exist for the second project
    cy.get('#todoList li').should('have.length', 0);
    
    // Add a different todo for the second project
    cy.addTodo('Todo for Project 2');
    
    // Switch back to first project
    cy.selectProject('Todo Project 1');
    
    // Verify first project's todo exists
    cy.get('#todoList').should('contain', 'Todo for Project 1');
    cy.get('#todoList').should('not.contain', 'Todo for Project 2');
  });
});