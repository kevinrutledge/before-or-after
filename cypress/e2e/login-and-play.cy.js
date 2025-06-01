describe('Login and navigate to game', () => {
  it('logs in and goes to game page', () => {
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('testuser@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Sign In').click();

    cy.contains('A daily game').should('be.visible');
    cy.contains('Play').click();

    cy.contains('Current Score').should('be.visible');
    cy.contains('Before').should('be.visible');
    cy.contains('After').should('be.visible');

    cy.contains('Before').click();
    cy.contains('Current Score: 1').should('be.visible');


  });
});