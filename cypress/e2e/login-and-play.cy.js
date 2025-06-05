
function login() {
  cy.visit('http://localhost:5173/login');
  cy.get('#emailOrUsername').type('testuser@example.com');
  cy.get('input[type="password"]').type('password123');
  cy.contains('button', 'Sign In').click();
  cy.contains('A daily game').should('be.visible');
  cy.contains('Play').click();
  cy.contains('Current Score: 0').should('be.visible');
  cy.wait(700); // wait for shuffling
}


// 1) Immediate loss on first guess → high‐score stays 0
describe('Immediate loss - high score remains unchanged', () => {
  it('logs in, reloads to clear any state, grabs the high score, then loses immediately and re-checks', () => {
    login();
    cy.reload(); // force a fresh start

    // 1) Grab the initial high score (whatever it is right after reload)
    cy.getHighScore().then(initialHighScore => {
      // Now `initialHighScore` is a JS number.

      // 2) Make the incorrect guess and check for loss
      cy.pickIncorrectCard();
      cy.checkLoss();

      // 3) Assert that the new high score is still the same as before
      cy.highScoreCheck(initialHighScore);
    });
  });
});



// 2) High score should not decrease if current run < previous high score
describe('High-score does not decrease', () => {
  it('sets a high score of 5, then does a shorter run of 3 and verifies high score stays 5', () => {
    // First run → build a high score of 5
    login();
    cy.answerCorrectlyNTimes(5);
    cy.contains('Current Score: 5').should('be.visible');
    cy.wait(1000); // wait for shuffling
    cy.pickIncorrectCard();
    cy.checkLoss();
    cy.highScoreCheck(5);

    // Click “Play Again” to start a new session
    cy.contains('button', 'Play Again').click();
    cy.wait(700);
    cy.highScoreCheck(5);

    // Now do only 3 correct, then lose
    cy.answerCorrectlyNTimes(3);
    cy.wait(1000); // wait for shuffling
    cy.pickIncorrectCard();
    cy.checkLoss();

    // Verify high score remains 5
    cy.highScoreCheck(5);
  });
});


// 3) High score persists through a full page reload
describe('High-score persistence across reload', () => {
  it('sets high score to 4, reloads, and verifies it is still 4', () => {
    login();
    cy.reload(); // Ensure we start fresh
    cy.answerCorrectlyNTimes(4);
    cy.contains('Current Score: 4').should('be.visible');
    cy.wait(1000); // wait for shuffling
    cy.pickIncorrectCard();
    cy.checkLoss();
    cy.highScoreCheck(4);

    // Force a full page reload
    cy.wait(700);
    cy.reload();
    cy.wait(700);

    // The app should read the old high score from localStorage
    cy.highScoreCheck(4);
  });
});


// 4) “Play Again” resets current score but does not reset high score
describe('Play Again resets current score only', () => {
  it('play 2 correctly, lose, click Play Again, verify current=0 & high=2', () => {
    login();
    cy.reload(); // Ensure we start fresh
    cy.answerCorrectlyNTimes(2);
    cy.contains('Current Score: 2').should('be.visible');
    cy.wait(1000); // wait for shuffling
    cy.pickIncorrectCard();
    cy.checkLoss();
    cy.highScoreCheck(2);

    // Click “Play Again”
    cy.contains('button', 'Play Again').click();
    cy.wait(700);

    // After clicking Play Again:
    cy.contains('Current Score: 0').should('be.visible');
    cy.highScoreCheck(2);
  });
});




// 6) Logging out clears high score and returns to login
describe('Logging out retains high scoren', () => {
  it('logs in, sets a high score, logs out, and verifies high score is cleared, log back in verify high score is brought back', () => {
    login();
    cy.reload(); // Ensure we start fresh
    cy.answerCorrectlyNTimes(3);
    cy.contains('Current Score: 3').should('be.visible');
    cy.wait(1000); // wait for shuffling
    cy.pickIncorrectCard();
    cy.checkLoss();
    cy.highScoreCheck(3);

    // Click the logout button (adjust selector if needed)
    cy.get('.account-button').click();
    cy.get('.logout-item').click();

    cy.reload();
    // URL should return to /login
    cy.highScoreCheck(0);
    login();
    // Reload to check localStorage is cleared
    cy.wait(100);

    // Verify high score got set to 3
    cy.highScoreCheck(3);
  });

  it('current way to refresh highscore', () => {
    // Log in again
    login();
    cy.visit('http://localhost:5173/game');
    cy.reload();
  });
});


