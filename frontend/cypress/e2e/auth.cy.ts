// Tests for authentication functionality

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display the login page', () => {
    cy.url().should('include', '/login');
    cy.findByRole('heading', { name: /sign in/i }).should('exist');
    cy.findByLabelText(/email/i).should('exist');
    cy.findByLabelText(/password/i).should('exist');
    cy.findByRole('button', { name: /login/i }).should('exist');
  });

  it('should show validation errors for empty fields', () => {
    cy.findByRole('button', { name: /login/i }).click();
    cy.findByText(/email is required/i).should('exist');
    cy.findByText(/password is required/i).should('exist');
  });

  it('should show error message for invalid credentials', () => {
    cy.findByLabelText(/email/i).type('invalid@example.com');
    cy.findByLabelText(/password/i).type('wrongpassword');
    cy.findByRole('button', { name: /login/i }).click();
    
    cy.findByText(/invalid email or password/i, { timeout: 5000 }).should('exist');
  });

  it('should redirect to dashboard after successful login', () => {
    // This test requires a valid user in the test environment
    // Could be seeded in the test database
    cy.findByLabelText(/email/i).type('admin@example.com');
    cy.findByLabelText(/password/i).type('password123');
    cy.findByRole('button', { name: /login/i }).click();
    
    cy.url({ timeout: 8000 }).should('include', '/dashboard');
    cy.findByText(/dashboard/i).should('exist');
  });

  it('should maintain authentication state across page reloads', () => {
    // Log in first
    cy.findByLabelText(/email/i).type('admin@example.com');
    cy.findByLabelText(/password/i).type('password123');
    cy.findByRole('button', { name: /login/i }).click();
    
    // Verify login succeeded
    cy.url().should('include', '/dashboard');
    
    // Reload the page
    cy.reload();
    
    // Should still be logged in
    cy.url().should('include', '/dashboard');
  });

  it('should be able to logout successfully', () => {
    // Log in first
    cy.findByLabelText(/email/i).type('admin@example.com');
    cy.findByLabelText(/password/i).type('password123');
    cy.findByRole('button', { name: /login/i }).click();
    
    // Verify login succeeded
    cy.url().should('include', '/dashboard');
    
    // Find and click logout button
    cy.findByRole('button', { name: /logout/i }).click();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
  });
});