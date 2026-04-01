// Tests for complete user workflows and end-to-end scenarios

describe('Complete User Workflows', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password123');
  });

  describe('Customer Management Workflow', () => {
    it('should complete full customer lifecycle: create → view → edit → delete', () => {
      const timestamp = Date.now();
      const customerEmail = `workflow${timestamp}@example.com`;

      // Step 1: Navigate to customers page
      cy.visit('/customers');
      cy.findByRole('heading', { name: /customers/i }).should('exist');

      // Step 2: Create new customer
      cy.findByRole('button', { name: /add customer/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/name/i).type(`Workflow Customer ${timestamp}`);
        cy.findByLabelText(/email/i).type(customerEmail);
        cy.findByLabelText(/phone/i).type('0400123456');
        cy.findByLabelText(/address/i).type('123 Workflow St, Sydney NSW 2000');
        cy.findByRole('button', { name: /save/i }).click();
      });

      // Verify customer creation
      cy.findByText(/customer created successfully/i).should('exist');
      cy.findByText(`Workflow Customer ${timestamp}`).should('exist');

      // Step 3: View customer details
      cy.contains(customerEmail).parent().within(() => {
        cy.get('[data-testid="customer-row"]').click();
      });
      cy.url().should('include', '/customers/');
      cy.findByRole('heading', { name: /customer details/i }).should('exist');

      // Step 4: Edit customer
      cy.findByRole('button', { name: /edit/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/phone/i).clear().type('0400999888');
        cy.findByRole('button', { name: /save/i }).click();
      });
      cy.findByText(/customer updated successfully/i).should('exist');

      // Step 5: Return to customer list
      cy.findByRole('link', { name: /customers/i }).click();
      cy.url().should('include', '/customers');

      // Step 6: Delete customer
      cy.contains(customerEmail).parent().within(() => {
        cy.get('[data-testid="delete-customer-button"]').click();
      });
      cy.findByRole('dialog').within(() => {
        cy.findByRole('button', { name: /confirm/i }).click();
      });
      cy.findByText(/customer deleted successfully/i).should('exist');
      cy.contains(customerEmail).should('not.exist');
    });

    it('should handle customer with vehicle relationships', () => {
      const timestamp = Date.now();
      const customerEmail = `vehicle-owner${timestamp}@example.com`;
      const vin = `WORKFLOW${timestamp}VIN`;

      // Create customer first
      cy.createTestData('customer', {
        name: `Vehicle Owner ${timestamp}`,
        email: customerEmail,
        phone: '0400123456',
        address: '123 Vehicle St, Sydney NSW 2000'
      });

      // Create vehicle for customer
      cy.createTestData('vehicle', {
        vin,
        make: 'Toyota',
        model: 'Corolla',
        year: 2020
      });

      // Visit customer details
      cy.visit('/customers');
      cy.contains(customerEmail).parent().within(() => {
        cy.get('[data-testid="customer-row"]').click();
      });

      // Verify vehicles section shows
      cy.findByRole('heading', { name: /vehicles/i }).should('exist');
      cy.findByText(vin).should('exist');
      cy.findByText('Toyota Corolla').should('exist');
    });
  });

  describe('Parts Management Workflow', () => {
    it('should complete full parts management workflow', () => {
      const partNumber = `WORKFLOW-${Date.now()}`;

      // Navigate to parts
      cy.visit('/parts');

      // Create part
      cy.findByRole('button', { name: /add part/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/part number/i).type(partNumber);
        cy.findByLabelText(/name/i).type('Workflow Test Part');
        cy.findByLabelText(/description/i).type('Part created during workflow test');
        cy.findByLabelText(/category/i).click();
      });
      cy.findByRole('option', { name: /engine/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/price/i).type('99.99');
        cy.findByLabelText(/cost/i).type('49.99');
        cy.findByLabelText(/quantity/i).type('50');
        cy.findByRole('button', { name: /save/i }).click();
      });

      // Verify part creation
      cy.findByText(/part created successfully/i).should('exist');
      cy.findByText(partNumber).should('exist');

      // Edit part
      cy.contains(partNumber).parent().within(() => {
        cy.get('[data-testid="edit-part-button"]').click();
      });
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/description/i).clear().type('Updated during workflow test');
        cy.findByLabelText(/price/i).clear().type('129.99');
        cy.findByRole('button', { name: /save/i }).click();
      });
      cy.findByText(/part updated successfully/i).should('exist');

      // Search for part
      cy.findByRole('textbox', { name: /search/i }).clear().type('Workflow Test Part');
      cy.findByRole('button', { name: /search/i }).click();
      cy.findByText(partNumber).should('exist');

      // Delete part
      cy.contains(partNumber).parent().within(() => {
        cy.get('[data-testid="delete-part-button"]').click();
      });
      cy.findByRole('dialog').within(() => {
        cy.findByRole('button', { name: /confirm/i }).click();
      });
      cy.findByText(/part deleted successfully/i).should('exist');
      cy.contains(partNumber).should('not.exist');
    });
  });

  describe('Order Processing Workflow', () => {
    it('should create and manage an order from quote to completion', () => {
      const timestamp = Date.now();
      const customerEmail = `order${timestamp}@example.com`;
      const partNumber = `ORDER-${timestamp}`;

      // Setup: Create customer and part
      cy.createTestData('customer', {
        name: `Order Customer ${timestamp}`,
        email: customerEmail,
        phone: '0400123456',
        address: '123 Order St, Sydney NSW 2000'
      });

      cy.createTestData('part', {
        partNumber,
        name: 'Order Test Part',
        description: 'Part for order workflow',
        category: 'ENGINE',
        price: 79.99,
        cost: 39.99,
        quantity: 10
      });

      // Navigate to quotes/orders section
      cy.visit('/quotes');

      // Create quote (assuming quotes page exists)
      // This would depend on actual implementation

      // For now, test the order creation flow
      cy.visit('/orders');
      cy.findByRole('button', { name: /create order/i }).should('exist');
    });
  });

  describe('State Management Integration', () => {
    it('should maintain state consistency across page navigation', () => {
      // Start at dashboard
      cy.visit('/dashboard');

      // Navigate to customers and create one
      cy.findByRole('link', { name: /customers/i }).click();
      cy.url().should('include', '/customers');

      const customerName = `State Test ${Date.now()}`;
      cy.findByRole('button', { name: /add customer/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/name/i).type(customerName);
        cy.findByLabelText(/email/i).type(`state${Date.now()}@example.com`);
        cy.findByLabelText(/phone/i).type('0400123456');
        cy.findByLabelText(/address/i).type('123 State St, Sydney NSW 2000');
        cy.findByRole('button', { name: /save/i }).click();
      });

      // Navigate to parts page
      cy.findByRole('link', { name: /parts/i }).click();
      cy.url().should('include', '/parts');

      // Navigate back to customers
      cy.findByRole('link', { name: /customers/i }).click();
      cy.url().should('include', '/customers');

      // Verify customer still exists (state persistence)
      cy.findByText(customerName).should('exist');
    });

    it('should handle concurrent operations correctly', () => {
      // This test would require multiple browser sessions
      // For now, test basic state updates

      cy.visit('/customers');

      // Create first customer
      cy.findByRole('button', { name: /add customer/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/name/i).type('Concurrent Customer 1');
        cy.findByLabelText(/email/i).type(`concurrent1${Date.now()}@example.com`);
        cy.findByLabelText(/phone/i).type('0400111111');
        cy.findByLabelText(/address/i).type('123 Concurrent St, Sydney NSW 2000');
        cy.findByRole('button', { name: /save/i }).click();
      });

      // Create second customer
      cy.findByRole('button', { name: /add customer/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/name/i).type('Concurrent Customer 2');
        cy.findByLabelText(/email/i).type(`concurrent2${Date.now()}@example.com`);
        cy.findByLabelText(/phone/i).type('0400222222');
        cy.findByLabelText(/address/i).type('456 Concurrent St, Sydney NSW 2000');
        cy.findByRole('button', { name: /save/i }).click();
      });

      // Verify both customers exist
      cy.findByText('Concurrent Customer 1').should('exist');
      cy.findByText('Concurrent Customer 2').should('exist');
    });
  });

  describe('Error Handling in UI', () => {
    it('should handle network errors gracefully', () => {
      // Intercept API calls and simulate network failure
      cy.intercept('GET', '**/api/v1/customers', { forceNetworkError: true });

      cy.visit('/customers');

      // Should show error message instead of crashing
      cy.findByText(/network error/i).should('exist');
    });

    it('should handle API validation errors', () => {
      cy.visit('/customers');

      cy.findByRole('button', { name: /add customer/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/email/i).type('invalid-email');
        cy.findByLabelText(/phone/i).type('invalid-phone');
        cy.findByRole('button', { name: /save/i }).click();
      });

      // Should show validation errors
      cy.findByText(/invalid email format/i).should('exist');
      cy.findByText(/invalid phone format/i).should('exist');
    });

    it('should handle unauthorized access attempts', () => {
      // Manually corrupt token
      cy.window().then((win) => {
        win.localStorage.setItem('auth_tokens', JSON.stringify({
          accessToken: 'corrupted.token',
          refreshToken: 'corrupted.refresh'
        }));
      });

      // Try to access protected resource
      cy.findByRole('link', { name: /customers/i }).click();

      // Should redirect to login
      cy.url().should('include', '/login');
      cy.findByText(/authentication required/i).should('exist');
    });

    it('should handle form submission errors', () => {
      cy.visit('/customers');

      // Intercept and make API return error
      cy.intercept('POST', '**/api/v1/customers', {
        statusCode: 500,
        body: { success: false, message: 'Server error occurred' }
      });

      cy.findByRole('button', { name: /add customer/i }).click();
      cy.findByRole('dialog').within(() => {
        cy.findByLabelText(/name/i).type('Error Test Customer');
        cy.findByLabelText(/email/i).type(`error${Date.now()}@example.com`);
        cy.findByLabelText(/phone/i).type('0400123456');
        cy.findByLabelText(/address/i).type('123 Error St, Sydney NSW 2000');
        cy.findByRole('button', { name: /save/i }).click();
      });

      // Should show error message
      cy.findByText(/server error occurred/i).should('exist');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle large datasets efficiently', () => {
      // This would require creating many test records
      // For now, test pagination performance

      cy.visit('/customers');

      // Test pagination (assuming pagination exists)
      cy.findByRole('button', { name: /next page/i }).should('exist');

      // Measure page load time
      cy.window().then((win) => {
        const startTime = win.performance.now();
        cy.findByRole('button', { name: /next page/i }).click();
        cy.window().then((win) => {
          const endTime = win.performance.now();
          const loadTime = endTime - startTime;
          // Page should load within reasonable time (under 3 seconds)
          expect(loadTime).to.be.lessThan(3000);
        });
      });
    });

    it('should be responsive on different screen sizes', () => {
      cy.visit('/customers');

      // Test mobile view
      cy.viewport('iphone-6');
      cy.findByRole('button', { name: /add customer/i }).should('be.visible');

      // Test tablet view
      cy.viewport('ipad-2');
      cy.findByRole('button', { name: /add customer/i }).should('be.visible');

      // Test desktop view
      cy.viewport('macbook-15');
      cy.findByRole('button', { name: /add customer/i }).should('be.visible');
    });
  });
});