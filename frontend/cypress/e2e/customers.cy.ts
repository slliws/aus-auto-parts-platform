// Tests for customer management functionality

describe('Customer Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('admin@example.com', 'password123');
    
    // Navigate to customers page
    cy.visit('/customers');
  });
  
  it('should display the customers listing page', () => {
    cy.url().should('include', '/customers');
    cy.findByRole('heading', { name: /customers/i }).should('exist');
    cy.findByRole('button', { name: /add customer/i }).should('exist');
  });
  
  it('should open the add customer form when add button is clicked', () => {
    cy.findByRole('button', { name: /add customer/i }).click();
    cy.findByRole('dialog').should('be.visible');
    cy.findByText(/add new customer/i).should('exist');
    cy.findByLabelText(/name/i).should('exist');
    cy.findByLabelText(/email/i).should('exist');
    cy.findByLabelText(/phone/i).should('exist');
    cy.findByLabelText(/address/i).should('exist');
  });
  
  it('should show validation errors when submitting empty form', () => {
    cy.findByRole('button', { name: /add customer/i }).click();
    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: /save/i }).click();
      cy.findByText(/name is required/i).should('exist');
      cy.findByText(/email is required/i).should('exist');
    });
  });
  
  it('should successfully add a new customer', () => {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    cy.findByRole('button', { name: /add customer/i }).click();
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText(/name/i).type(`Test Customer ${timestamp}`);
      cy.findByLabelText(/email/i).type(email);
      cy.findByLabelText(/phone/i).type('0400123456');
      cy.findByLabelText(/address/i).type('123 Test St, Sydney NSW 2000');
      cy.findByRole('button', { name: /save/i }).click();
    });
    
    // Verify success message and customer appears in the list
    cy.findByText(/customer created successfully/i).should('exist');
    cy.findByText(`Test Customer ${timestamp}`).should('exist');
    cy.findByText(email).should('exist');
  });
  
  it('should search for customers', () => {
    // Assuming there's a customer with "Smith" in the name
    cy.findByRole('textbox', { name: /search/i }).type('Smith');
    cy.findByRole('button', { name: /search/i }).click();
    
    // Verify search results
    cy.findByText(/smith/i).should('exist');
  });
  
  it('should edit an existing customer', () => {
    // Find and click edit button for first customer in the list
    cy.get('[data-testid="edit-customer-button"]').first().click();
    
    // Update customer details
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText(/phone/i).clear().type('0400999888');
      cy.findByLabelText(/address/i).clear().type('456 Updated Ave, Melbourne VIC 3000');
      cy.findByRole('button', { name: /save/i }).click();
    });
    
    // Verify success message
    cy.findByText(/customer updated successfully/i).should('exist');
  });
  
  it('should show customer details and vehicles', () => {
    // Click on a customer to view details
    cy.get('[data-testid="customer-row"]').first().click();
    
    // Verify navigation to details page
    cy.url().should('include', '/customers/');
    cy.findByRole('heading', { name: /customer details/i }).should('exist');
    cy.findByRole('heading', { name: /vehicles/i }).should('exist');
    cy.findByRole('button', { name: /add vehicle/i }).should('exist');
  });
  
  it('should delete a customer', () => {
    // Create a customer to delete
    const timestamp = Date.now();
    const email = `delete${timestamp}@example.com`;
    
    // Create customer via API for faster testing
    cy.createTestData('customer', {
      name: `Customer to Delete ${timestamp}`,
      email: email,
      phone: '0400123456',
      address: '123 Delete St, Sydney NSW 2000'
    }).then(customer => {
      // Refresh the page to see the new customer
      cy.visit('/customers');
      
      // Find and delete the customer
      cy.contains(email).parent().within(() => {
        cy.get('[data-testid="delete-customer-button"]').click();
      });
      
      // Confirm deletion in dialog
      cy.findByRole('dialog').within(() => {
        cy.findByRole('button', { name: /confirm/i }).click();
      });
      
      // Verify success message
      cy.findByText(/customer deleted successfully/i).should('exist');
      
      // Verify customer no longer appears
      cy.contains(email).should('not.exist');
    });
  });
  
  it('should paginate through customers list', () => {
    // Get the first page items
    cy.get('[data-testid="customers-table"] tbody tr').then($firstPageRows => {
      const firstPageFirstItem = $firstPageRows.first().text();
      
      // Go to next page
      cy.findByRole('button', { name: /next page/i }).click();
      
      // Verify different items on second page
      cy.get('[data-testid="customers-table"] tbody tr').then($secondPageRows => {
        const secondPageFirstItem = $secondPageRows.first().text();
        expect(secondPageFirstItem).not.to.equal(firstPageFirstItem);
      });
      
      // Go back to first page
      cy.findByRole('button', { name: /previous page/i }).click();
      
      // Verify back to first page
      cy.get('[data-testid="customers-table"] tbody tr').first().should('contain.text', firstPageFirstItem);
    });
  });
});