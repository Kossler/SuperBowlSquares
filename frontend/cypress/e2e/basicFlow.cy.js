describe('SuperBowlSquares E2E', () => {
  it('should load home page and login', () => {
    cy.visit('/');
    cy.contains('Login').click();
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpass');
    cy.get('button[type="submit"]').click();
    cy.contains('Welcome, testuser');
  });
});
