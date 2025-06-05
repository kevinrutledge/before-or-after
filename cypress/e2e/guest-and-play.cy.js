
function login() {
  cy.visit('http://localhost:5173/');
  cy.contains('A daily game').should('be.visible');
  cy.contains('Play').click();
  cy.contains('Current Score: 0').should('be.visible');
  cy.wait(700);
  //highScoreCheck();
}
  

let savedLocalStorage = {};
// Before each test, restore anything we’ve previously saved
  beforeEach(() => {
    if (Object.keys(savedLocalStorage).length) {
      cy.visit('http://localhost:5173/').then(() => {
        cy.window().then((win) => {
          Object.entries(savedLocalStorage).forEach(([key, value]) => {
            win.localStorage.setItem(key, value);
          });
        });
      });
    } else {
      // If there’s nothing in savedLocalStorage yet, just do a fresh visit
      cy.visit('http://localhost:5173/');
    }
  });

  // After each test, grab whatever is now in localStorage and stash it
  afterEach(() => {
    cy.window().then((win) => {
      Object.keys(win.localStorage).forEach((key) => {
        savedLocalStorage[key] = win.localStorage.getItem(key);
      });
    });
  });


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

    cy.answerCorrectlyNTimes(2);
    cy.contains('Current Score: 2').should('be.visible');
    cy.pickIncorrectCard();
    cy.checkLoss();
    cy.contains('button', 'Play Again').click();
    cy.checkScore(0);
    cy.highScoreCheck(10);
    cy.wait(700);
    cy.answerCorrectlyNTimes(2);
    cy.checkScore(2);
    cy.pickIncorrectCard();
    cy.checkLoss();

    })
});


