// cypress/support/commands.js

// ... (any existing comments) ...

function highScoreCheck(n) {
  cy.get('.high-score-button')
  .find('.score-value')
  .should('have.text', String(n));
}

function getCardInfo(cardSelector) {
  return cy
    .get(`${cardSelector} .card-title`)
    .invoke('text')
    .then((title) => {
      return cy
        .get(`${cardSelector} .card-date`)
        .invoke('text')
        .then((dateText) => {
          const [month, year] = dateText.split('/').map(Number);
          return { title, year, month };
        });
    });
}

function pickCorrectCard() {
  getCardInfo('.current-card').then((currentCard) => {
    getCardInfo('.reference-card').then((referenceCard) => {
      cy.window().then((win) => {
        if (win.compareCards(referenceCard, currentCard, 'before')) {
          cy.contains('Before').click();
        } else {
          cy.contains('After').click();
        }
      });
    });
  });
}

function pickIncorrectCard() {
cy.wait(700); // wait for shuffling
  getCardInfo('.current-card').then((currentCard) => {
    getCardInfo('.reference-card').then((referenceCard) => {
      cy.window().then((win) => {
        if (!win.compareCards(referenceCard, currentCard, 'before')) {
          cy.contains('Before').click();
        } else {
          cy.contains('After').click();
        }
      });
    });
  });
}

function checkLoss() {
  cy.contains('Game Over').should('be.visible');
  cy.url().should('include', '/loss');
}

function answerCorrectlyNTimes(n) {
  for (let i = 0; i < n; i++) {
    cy.contains(`Current Score: ${i}`).should('be.visible');
    pickCorrectCard();
  }
}

function getHighScore() {
  return cy.get('.score-value').first().invoke('text').then(text => {
    return parseInt(text, 10);
  });
}

function checkScore(n) {
  cy.contains(`Current Score: ${n}`).should('be.visible');
}

Cypress.Commands.add('highScoreCheck', highScoreCheck);
Cypress.Commands.add('pickCorrectCard', pickCorrectCard);
Cypress.Commands.add('pickIncorrectCard', pickIncorrectCard);
Cypress.Commands.add('checkLoss', checkLoss);
Cypress.Commands.add('answerCorrectlyNTimes', answerCorrectlyNTimes);
Cypress.Commands.add('getHighScore', getHighScore);
Cypress.Commands.add('checkScore', checkScore);
