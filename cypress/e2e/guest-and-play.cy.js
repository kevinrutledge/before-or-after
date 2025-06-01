// describe('Login and navigate to game', () => {
//   it('logs in and goes to game page', () => {
//     cy.visit('http://localhost:5173/login');
//     cy.get('input[type="email"]').type('testuser@example.com');
//     cy.get('input[type="password"]').type('password123');
//     cy.contains('button', 'Sign In').click();

//     cy.contains('A daily game').should('be.visible');
//     cy.contains('Play').click();

//     cy.contains('Current Score').should('be.visible');
//     cy.contains('Before').should('be.visible');
//     cy.contains('After').should('be.visible');

//     cy.contains('Before').click();
//     cy.contains('Current Score: 1').should('be.visible');


//   });
// });

function login() {
  cy.visit('http://localhost:5173/');
  cy.contains('A daily game').should('be.visible');
  cy.contains('Play').click();
  cy.contains('Current Score').should('be.visible');
  
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
function pickCorrectCard(){
  getCardInfo('.current-card').then((currentCard) => {
      getCardInfo('.reference-card').then((referenceCard) => {
        cy.window().then((win) => {
          if (win.compareCards(referenceCard, currentCard, "before")) {
            cy.contains('Before').click();
          } else {
            cy.contains('After').click();
          }
        });
      });
    });
}

function pickInCorrectCard(){
  getCardInfo('.current-card').then((currentCard) => {
      getCardInfo('.reference-card').then((referenceCard) => {
        cy.window().then((win) => {
          if (!win.compareCards(referenceCard, currentCard, "before")) {
            cy.contains('Before').click();
          } else {
            cy.contains('After').click();
          }
        });
      });
    });
}

function checkLoss(){
  cy.contains('Game Over').should('be.visible');
  cy.url().should('include', '/loss');
}

function highScoreCheck() {
  cy.contains('High Score').should('be.visible');
  cy.get('.high-score-display').invoke('text').then((text) => {
    const score = parseInt(text.replace('High Score: ', ''), 10);
    expect(score).to.be.at.least(0);
  });
}

function getHighScore() {
  return cy.get('.high-score-display').invoke('text').then(text => {
    return parseInt(text.replace('High Score: ', ''), 10);
  });
}

it('only updates highscore if score is higher', () => {
  login();

  // Get the current highscore
  getHighScore().then((initialHighScore) => {
    // Play and get a new score (simulate correct guesses)
    pickCorrectCard();
    cy.contains('Current Score: 1').should('be.visible');

    // Check if highscore updated only if score > initialHighScore
    getHighScore().then((newHighScore) => {
      if (1 > initialHighScore) {
        expect(newHighScore).to.eq(1);
      } else {
        expect(newHighScore).to.eq(initialHighScore);
      }
    });
  });
});

describe('Login and guess correct card', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();

    // Get card titles and years from the DOM (adjust selectors as needed)
    cy.get('.current-card .card-title').invoke('text').then((currentTitle) => {
      cy.get('.reference-card .card-title').invoke('text').then((referenceTitle) => {
        // For demo, you may need to also get years/months from the DOM or mock data
        // get current date
        cy.get('.current-card .card-date').invoke('text').then((currentYear) => {
          //get reference date 
            cy.get('.reference-card .card-date').invoke('text').then((referenceYear) => {
                // split the year and month from the text
                const [monthC, yearC] = currentYear.split("/").map(Number);
                const [monthR, yearR] = referenceYear.split("/").map(Number);
                cy.window().then((win) => {
                  const currentCard = {
                    title: currentTitle,
                    year: yearC,
                    month: monthC
                  };
                  const referenceCard = {
                    title: referenceTitle,
                    year: yearR,
                    month: monthR
                  };
                  // Try both guesses and click the correct one
                  if (win.compareCards(referenceCard, currentCard, "before")) {
                    cy.contains('Before').click();
                  } else {
                    cy.contains('After').click();
                  }
                  // Assert score increased or overlay appeared
                  cy.contains('Current Score: 1').should('be.visible');
                });
            });
        });
      });
    });
  });
});



describe('Login and play 2 correctly', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();

    // Get card titles and years from the DOM (adjust selectors as needed)
    cy.get('.current-card .card-title').invoke('text').then((currentTitle) => {
      cy.get('.reference-card .card-title').invoke('text').then((referenceTitle) => {
        // For demo, you may need to also get years/months from the DOM or mock data
        // get current date
        cy.get('.current-card .card-date').invoke('text').then((currentYear) => {
          //get reference date 
            cy.get('.reference-card .card-date').invoke('text').then((referenceYear) => {
                // split the year and month from the text
                const [monthC, yearC] = currentYear.split("/").map(Number);
                const [monthR, yearR] = referenceYear.split("/").map(Number);
                cy.window().then((win) => {
                  const currentCard = {
                    title: currentTitle,
                    year: yearC,
                    month: monthC
                  };
                  const referenceCard = {
                    title: referenceTitle,
                    year: yearR,
                    month: monthR
                  };
                  // Try both guesses and click the correct one
                  if (!win.compareCards(referenceCard, currentCard, "before")) {
                    cy.contains('Before').click();
                  } else {
                    cy.contains('After').click();
                  }
                  // Assert score increased or overlay appeared
                  cy.contains('Current Score: 0').should('be.visible');
                  cy.contains('Game Over').should('be.visible');
                  cy.url().should('include', '/loss');
                });
            });
        });
      });
    });
  });
});

describe('Login and guess incorrectly', () => {
  it('logs in and makes a correct guess using compareCards', () => {
    login();
    highScoreCheck();
    cy.contains('Current Score: 0').should('be.visible');
    pickCorrectCard();
    cy.contains('Current Score: 1').should('be.visible');
    pickCorrectCard();
    cy.contains('Current Score: 2').should('be.visible');
    pickInCorrectCard();
    cy.contains('Current Score: 2').should('be.visible');
    cy.contains('Game Over').should('be.visible');
    cy.url().should('include', '/loss');
    })
});


describe('Login, play, lose, play again, lose', () => {
  it('tests play again ensures score resets', () => {
    login();
    highScoreCheck();

    cy.contains('Current Score: 0').should('be.visible');
    pickCorrectCard();
    cy.contains('Current Score: 1').should('be.visible');
    pickCorrectCard();
    cy.contains('Current Score: 2').should('be.visible');
    pickInCorrectCard();
    cy.contains('Current Score: 2').should('be.visible');
    checkLoss();

    cy.contains('Play Again').click();
    cy.contains('Current Score: 0').should('be.visible');
    pickCorrectCard();
    cy.contains('Current Score: 1').should('be.visible');
    pickInCorrectCard();
    cy.contains('Current Score: 1').should('be.visible');
  
    checkLoss();

    //ensure highscore is the highest number
    cy.contains('High Score: 2').should('be.visible');

    })
});