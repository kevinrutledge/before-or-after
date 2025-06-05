// function userLogin() {
//   cy.visit('http://localhost:5173/login');
//   cy.get('#emailOrUsername').type('testuser@example.com'); 
//   cy.get('input[type="password"]').type('password123');
//   cy.contains('button', 'Sign In').click();
//   cy.contains('A daily game').should('be.visible');
//   cy.contains('Play').click();
//   cy.contains('Current Score: 0').should('be.visible');
// }

// function guestLogin(){
//     cy.visit('http://localhost:5173/');
//     cy.contains('A daily game').should('be.visible');
//     cy.contains('Play').click();
//     cy.contains('Current Score: 0').should('be.visible');
// }

// describe('Authentication and Game Play', () => {
//     it('user can not navigate to admin page', () => {
//         userLogin();
//         cy.visit('http://localhost:5173/admin');
//         cy.url().should('not.include', '/admin');
//     });
//     it('guest cant navigate to admin page', () => {
//         guestLogin();
//         cy.visit('http://localhost:5173/admin');
//         cy.url().should('not.include', '/admin');
//     });
// });