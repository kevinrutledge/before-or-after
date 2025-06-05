// function userSignUp() {
//   cy.visit('http://localhost:5173/signup');
//   cy.get('#email').type('testuser2@example.com'); 
//   cy.get('#username').type('testuser2'); 
//   cy.get('#password').type('password123');
//   cy.get('#confirmPassword').type('password123');
//   cy.contains('button', 'Sign Up').click();
//   //cy.contains('A daily game').should('be.visible');
//   //cy.contains('Play').click();
//   //cy.contains('Current Score: 0').should('be.visible');
//   cy.wait(1000); // wait 1000ms (1 second)

// function login() {
//   cy.visit('http://localhost:5173/login');
//   cy.get('#emailOrUsername').type('testuser@example.com'); 
//   cy.get('input[type="password"]').type('password123');
//   cy.contains('button', 'Sign In').click();
//   cy.contains('A daily game').should('be.visible');
//   cy.contains('Play').click();
//   cy.contains('Current Score: 0').should('be.visible');
//   highScoreCheck();
// }
// }

// function guestLogin(){
//     cy.visit('http://localhost:5173/');
//     cy.contains('A daily game').should('be.visible');
//     cy.contains('Play').click();
//     cy.contains('Current Score: 0').should('be.visible');
//     highScoreCheck();
// }
// // Helper function to get card info from the DOM
// function getCardInfo(cardSelector) {
//   // Returns a promise-like Cypress chainable with the card info object
//   return cy.get(`${cardSelector} .card-title`).invoke('text').then((title) => {
//     return cy.get(`${cardSelector} .card-date`).invoke('text').then((dateText) => {
//       const [month, year] = dateText.split('/').map(Number);
//       return { title, year, month };
//     });
//   });
// }
// function pickCorrectCard(){
//   getCardInfo('.current-card').then((currentCard) => {
//       getCardInfo('.reference-card').then((referenceCard) => {
//         cy.window().then((win) => {
//           if (win.compareCards(referenceCard, currentCard, "before")) {
//             cy.contains('Before').click();
//           } else {
//             cy.contains('After').click();
//           }
//         });
//       });
//     });
// }

// function pickInCorrectCard(){
//   getCardInfo('.current-card').then((currentCard) => {
//       getCardInfo('.reference-card').then((referenceCard) => {
//         cy.window().then((win) => {
//           if (!win.compareCards(referenceCard, currentCard, "before")) {
//             cy.contains('Before').click();
//           } else {
//             cy.contains('After').click();
//           }
//         });
//       });
//     });
// }

// function checkLoss(){
//   cy.contains('Game Over').should('be.visible');
//   cy.url().should('include', '/loss');
// }

// function highScoreCheck() {
//   cy.contains('High Score').should('be.visible');
//   cy.get('.score-value').first().invoke('text').then((text) => {
//     const score = parseInt(text.replace('High Score: ', ''), 10);
//     expect(score).to.be.at.least(0);
//   });
// }

// function getHighScore() {
//   return cy.get('.score-value').first().invoke('text').then(text => {
//     return parseInt(text.replace('High Score: ', ''), 10);
//   });
// }

// describe('Authentication and Game Play', () => {
//     it('user can not navigate to admin page', () => {
//         userSignUp();
//     });
// });