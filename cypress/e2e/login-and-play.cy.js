

function login() {
  cy.visit('http://localhost:5173/login');
  cy.get('#emailOrUsername').type('testuser@example.com'); 
  cy.get('input[type="password"]').type('password123');
  cy.contains('button', 'Sign In').click();
  cy.contains('A daily game').should('be.visible');
  cy.contains('Play').click();
  cy.contains('Current Score: 0').should('be.visible');
  cy.highScoreCheck(0);
}
// Helper function to get card info from the DOM
function getCardInfo(cardSelector) {
  // Returns a promise-like Cypress chainable with the card info object
  return cy.get(`${cardSelector} .card-title`).invoke('text').then((title) => {
    return cy.get(`${cardSelector} .card-date`).invoke('text').then((dateText) => {
      const [month, year] = dateText.split('/').map(Number);
      return { title, year, month };
    });
  });
}


it('only updates highscore if score is higher', () => {
  login();
  cy.highScoreCheck(0);
  cy.pickCorrectCard();
  cy.highScoreCheck(1);
});

describe('Login and guess correct card', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();
    cy.pickCorrectCard();
    cy.contains('Current Score: 1').should('be.visible');
  });
});



describe('Login and play 2 correctly', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();
    cy.answerCorrectlyNTimes(10);
    cy.contains('Current Score: 10').should('be.visible');
    cy.pickIncorrectCard();
    cy.checkLoss();

  });
});

describe('Login and guess incorrectly', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();
    cy.answerCorrectlyNTimes(2);
    cy.contains('Current Score: 2').should('be.visible');
    cy.pickIncorrectCard();
    cy.checkLoss();
    })
});


describe('Login, play, lose, play again, lose', () => {
  it('tests play again ensures score resets', () => {
    login();

    cy.pickIncorrectCard(2);
    //cy.checkScore(2);
  

    //ensure highscore is the highest numbe

    })
});