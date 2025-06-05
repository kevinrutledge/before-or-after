

function login() {
  cy.visit('http://localhost:5173/login');
  cy.get('#emailOrUsername').type('testuser@example.com'); 
  cy.get('input[type="password"]').type('password123');
  cy.contains('button', 'Sign In').click();
  cy.contains('A daily game').should('be.visible');
  cy.contains('Play').click();
  cy.contains('Current Score: 0').should('be.visible');
  cy.wait(700); // wait 1000ms (1 second) to ensure card shuffling does not mess up compare values
  ;
}

describe('Login and guess 1 correct card', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();
    cy.pickCorrectCard();
    cy.contains('Current Score: 1').should('be.visible');
  });
});



describe('Login and play 10 correctly', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();
    cy.answerCorrectlyNTimes(10);
    cy.contains('Current Score: 10').should('be.visible');
    cy.highScoreCheck(10);
    cy.pickIncorrectCard();
    cy.checkLoss();


  });
});

describe('play twice', () => {

  it('Login, play, lose, play again, lose', () => {
    login();
    cy.highScoreCheck(10);

    cy.answerCorrectlyNTimes(2);
    cy.contains('Current Score: 2').should('be.visible');
    cy.pickIncorrectCard();
    cy.checkLoss();
    cy.contains('button', 'Play Again').click();
    cy.wait(700); 
    cy.checkScore(0);
    cy.highScoreCheck(10);
    cy.answerCorrectlyNTimes(2);
    cy.checkScore(2);
    cy.pickIncorrectCard();
    cy.checkLoss();

    })
});


