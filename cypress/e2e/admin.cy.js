// function login() {
//   cy.visit('http://localhost:5173/login');
//   cy.get('#emailOrUsername').type(Cypress.env('ADMIN_EMAIL')); 
//   cy.get('input[type="password"]').type(Cypress.env('ADMIN_PASSWORD'));
//   cy.contains('button', 'Sign In').click();
//   cy.contains('A daily game').should('be.visible');
//   cy.contains('Play').click();
//   cy.contains('Current Score: 0').should('be.visible');
//   cy.wait(700); // wait 1000ms (1 second) to ensure card shuffling does not mess up compare values
//   ;
// }

// function navigateDashboard(){
//     cy.get('.account-button').click();
//     cy.contains('Dashboard').click();
//     cy.url().should('include', '/admin');

// }

// describe('Admin Dashboard', () => {

//   beforeEach(() => {
//     login();
//     navigateDashboard();
//     cy.wait(1000); // wait for the dashboard to load
//   });

//   it('should display the admin dashboard', () => {
//     cy.contains('Admin Dashboard').should('be.visible');

//     //test search functionailty for 1 card
//     cy.get('input[placeholder*="Search by title"]').type("One Piece");
//     cy.contains('h3.admin-card-title', 'One Piece').should('be.visible');

//     //ensure add card pop-up actually pops up
//     cy.get('.admin-add-card-button').click();
//     cy.get('.admin-card-form').should('exist').and('be.visible');


//   });

// //   it('should allow admin to view user list', () => {
// //     cy.contains('Users').click();
// //     cy.url().should('include', '/admin/users');
// //     cy.get('.user-list').should('exist');
// //   });

// //   it('should allow admin to view game statistics', () => {
// //     cy.contains('Game Stats').click();
// //     cy.url().should('include', '/admin/stats');
// //     cy.get('.game-stats').should('exist');
// //   });

// //   it('should allow admin to manage cards', () => {
// //     cy.contains('Cards').click();
// //     cy.url().should('include', '/admin/cards');
// //     cy.get('.card-management').should('exist');
// //   });

// });