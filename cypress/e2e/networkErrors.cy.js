function login() {
  cy.visit("http://localhost:5173/login");
  cy.get("#emailOrUsername").type("testuser@example.com");
  cy.get('input[type="password"]').type("password123");
  cy.contains("button", "Sign In").click();
}

describe("Network Errors", () => {
  it("Login Network Error", () => {
    cy.intercept("POST", "/api/auth/login", { forceNetworkError: true }).as(
      "getDataFailure"
    );

    // Now trigger whatever in your app fires that request (e.g., clicking a “Load” button)
    login();
    // Wait for the failed call, then assert how your UI handles it
    cy.wait("@getDataFailure");
    cy.contains("Invalid email/username or password").should("be.visible");
  });

  it("Highscore leaderboard Network Error", () => {
    cy.intercept("GET", "/api/leaderboard*", { forceNetworkError: true }).as(
      "loadLeaderboardFailure"
    );

    login();
    cy.get(".high-score-button").click();
    cy.wait("@loadLeaderboardFailure");
    cy.url().should("not.include", "/leaderboard");
  });

  it("Game page Network Error", () => {
    cy.intercept("POST", "/api/cards/guess", { forceNetworkError: true }).as(
      "loadGameFailure"
    );

    login();
    cy.contains("Play").click();
    cy.contains("Current Score: 0").should("be.visible");
    cy.wait(700);
    cy.pickCorrectCard();
    cy.wait("@loadGameFailure");
    //cy.url().should('not.include', '/game');
    cy.contains("Failed to process guess").should("be.visible");
  });
});
