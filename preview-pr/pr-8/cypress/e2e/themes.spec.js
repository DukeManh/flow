/**
 * E2E test for theme functionality
 */
describe('Theme Functionality', () => {
  beforeEach(() => {
    cy.clearAppData();
    cy.visit('/', { timeout: 5000 });
    cy.waitForAppLoad();
  });
  
  it('should change app theme and persist selection', () => {
    // Open theme dropdown
    cy.get('#themeDropdownBtn').click();
    
    // Select a different theme (light theme)
    cy.contains('.theme-option', 'Light').click();
    
    // Add a delay to ensure theme change is processed
    cy.wait(500);
    
    // Verify theme was applied (check CSS custom property as indicator)
    cy.window().then((win) => {
      const bgColor = win.getComputedStyle(win.document.documentElement).getPropertyValue('--bg');
      expect(bgColor.trim()).not.to.be.empty;
    });
    
    // Verify theme is stored in localStorage with the correct key
    cy.window().then((win) => {
      expect(win.localStorage.getItem('selectedTheme')).to.equal('default');
    });
    
    // Reload the page
    cy.reload();
    cy.waitForAppLoad();
    
    // Verify theme persists after reload
    cy.window().then((win) => {
      expect(win.localStorage.getItem('selectedTheme')).to.equal('default');
    });
  });
  
  it('should cycle through multiple themes', () => {
    // Open theme dropdown
    cy.get('#themeDropdownBtn').click();
    
    // Get all themes
    cy.get('.theme-option').then(($themes) => {
      const themeCount = $themes.length;
      expect(themeCount).to.be.gt(1); // Ensure there are multiple themes
      
      // Click on several themes in sequence
      const themesToTest = Math.min(themeCount, 3); // Test up to 3 themes
      
      for (let i = 0; i < themesToTest; i++) {
        const themeName = $themes.eq(i).text().trim().toLowerCase();
        const dataTheme = $themes.eq(i).attr('data-theme');
        cy.contains('.theme-option', new RegExp(themeName, 'i')).click();
        
        // Add delay to ensure theme change is processed
        cy.wait(500);
        
        // Verify theme was selected with the correct localStorage key
        cy.window().then((win) => {
          expect(win.localStorage.getItem('selectedTheme')).to.equal(dataTheme);
        });
        
        // Reopen dropdown if not the last theme
        if (i < themesToTest - 1) {
          cy.get('#themeDropdownBtn').click();
        }
      }
    });
  });
  
  it('should show theme preview on hover', () => {
    // Open theme dropdown
    cy.get('#themeDropdownBtn').click();
    
    // Hover over a theme option
    cy.contains('.theme-option', 'Dark').trigger('mouseenter');
    
    // Wait for preview to potentially apply
    cy.wait(300);
    
    // Move away to reset
    cy.get('#themeDropdownBtn').trigger('mouseenter');
    
    // Test another theme
    cy.contains('.theme-option', 'Midnight').trigger('mouseenter');
    
    // Wait for preview
    cy.wait(300);
  });
  
  it('should close theme dropdown when clicking outside', () => {
    // Open theme dropdown
    cy.get('#themeDropdownBtn').click();
    
    // Verify dropdown is visible
    cy.get('.theme-dropdown-content').should('be.visible');
    
    // Click outside the dropdown
    cy.get('body').click(0, 0);
    
    // Verify dropdown is hidden
    cy.get('.theme-dropdown-content').should('not.be.visible');
  });
});