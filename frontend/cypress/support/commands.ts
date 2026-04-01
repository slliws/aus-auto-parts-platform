// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Authentication commands

/**
 * Custom command to login user
 * @example cy.login('user@example.com', 'password')
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.findByLabelText(/email/i).type(email);
    cy.findByLabelText(/password/i).type(password);
    cy.findByRole('button', { name: /login/i }).click();
    
    // Wait for dashboard to load to confirm login success
    cy.url().should('include', '/dashboard');
    
    // Save the tokens for future requests
    cy.window().then((win) => {
      const tokens = win.localStorage.getItem('auth_tokens');
      if (tokens) {
        Cypress.env('auth_tokens', JSON.parse(tokens));
      }
    });
  }, {
    cacheAcrossSpecs: true,
  });
});

/**
 * Custom command to simulate token refresh
 * @example cy.refreshToken()
 */
Cypress.Commands.add('refreshToken', () => {
  const apiUrl = Cypress.env('apiUrl');
  const tokens = Cypress.env('auth_tokens');
  
  if (!tokens || !tokens.refreshToken) {
    throw new Error('No refresh token available. Login first.');
  }
  
  cy.request({
    method: 'POST',
    url: `${apiUrl}/auth/refresh`,
    body: {
      refreshToken: tokens.refreshToken,
    },
  }).then((response) => {
    expect(response.status).to.equal(200);
    
    const newTokens = {
      accessToken: response.body.data.accessToken,
      refreshToken: response.body.data.refreshToken || tokens.refreshToken,
    };
    
    Cypress.env('auth_tokens', newTokens);
    
    // Update tokens in localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
    });
  });
});

// API utility commands

/**
 * Custom command to create test data via API
 */
Cypress.Commands.add('createTestData', (type, data) => {
  const apiUrl = Cypress.env('apiUrl');
  const tokens = Cypress.env('auth_tokens');
  
  if (!tokens || !tokens.accessToken) {
    throw new Error('No access token available. Login first.');
  }
  
  const endpoints = {
    customer: '/customers',
    part: '/parts',
    vehicle: '/vehicles',
  };
  
  const endpoint = endpoints[type];
  if (!endpoint) {
    throw new Error(`Unknown data type: ${type}`);
  }
  
  cy.request({
    method: 'POST',
    url: `${apiUrl}${endpoint}`,
    body: data,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  }).then((response) => {
    expect(response.status).to.equal(201);
    return response.body.data;
  });
});

/**
 * Custom command to clear test data via API
 */
Cypress.Commands.add('clearTestData', (type, id) => {
  const apiUrl = Cypress.env('apiUrl');
  const tokens = Cypress.env('auth_tokens');
  
  if (!tokens || !tokens.accessToken) {
    throw new Error('No access token available. Login first.');
  }
  
  const endpoints = {
    customer: '/customers',
    part: '/parts',
    vehicle: '/vehicles',
  };
  
  const endpoint = endpoints[type];
  if (!endpoint) {
    throw new Error(`Unknown data type: ${type}`);
  }
  
  cy.request({
    method: 'DELETE',
    url: `${apiUrl}${endpoint}/${id}`,
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  }).then((response) => {
    expect(response.status).to.equal(200);
  });
});

// Declare the commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<Element>;
      refreshToken(): Chainable<Element>;
      createTestData(type: string, data: any): Chainable<any>;
      clearTestData(type: string, id: string): Chainable<void>;
    }
  }
}