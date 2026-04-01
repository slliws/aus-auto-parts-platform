// Tests for vehicle management functionality

describe('Vehicle Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('admin@example.com', 'password123');
    
    // Navigate to vehicles page
    cy.visit('/vehicles');
  });
  
  it('should display the vehicles listing page', () => {
    cy.url().should('include', '/vehicles');
    cy.findByRole('heading', { name: /vehicles/i }).should('exist');
    cy.findByRole('button', { name: /add vehicle/i }).should('exist');
  });
  
  it('should open the add vehicle form when add button is clicked', () => {
    cy.findByRole('button', { name: /add vehicle/i }).click();
    cy.findByRole('dialog').should('be.visible');
    cy.findByText(/add new vehicle/i).should('exist');
    cy.findByLabelText(/vin/i).should('exist');
    cy.findByLabelText(/customer/i).should('exist');
    cy.findByLabelText(/make/i).should('exist');
    cy.findByLabelText(/model/i).should('exist');
  });
  
  it('should show validation errors when submitting empty form', () => {
    cy.findByRole('button', { name: /add vehicle/i }).click();
    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: /save/i }).click();
      cy.findByText(/vin is required/i).should('exist');
      cy.findByText(/customer is required/i).should('exist');
    });
  });
  
  it('should decode VIN information when entered', () => {
    cy.findByRole('button', { name: /add vehicle/i }).click();
    
    // Select a customer first
    cy.findByLabelText(/customer/i).click();
    cy.findByRole('option').first().click();
    
    // Enter a VIN
    cy.findByLabelText(/vin/i).type('1HGCM82633A123456');
    
    // Wait for the decoder to populate fields
    cy.findByLabelText(/make/i).should('have.value');
    cy.findByLabelText(/model/i).should('have.value');
    cy.findByLabelText(/year/i).should('have.value');
  });
  
  it('should successfully add a new vehicle', () => {
    const timestamp = Date.now();
    const vin = `TEST${timestamp}`;
    
    // Create a customer first via API for association
    cy.createTestData('customer', {
      name: `Vehicle Owner ${timestamp}`,
      email: `owner${timestamp}@example.com`,
      phone: '0400123456',
      address: '123 Test St, Sydney NSW 2000'
    }).then(customer => {
      cy.findByRole('button', { name: /add vehicle/i }).click();
      
      // Select the customer
      cy.findByLabelText(/customer/i).click();
      cy.contains(customer.name).click();
      
      // Fill vehicle details
      cy.findByLabelText(/vin/i).type(vin);
      cy.findByLabelText(/make/i).type('Toyota');
      cy.findByLabelText(/model/i).type('Corolla');
      cy.findByLabelText(/year/i).type('2022');
      cy.findByLabelText(/engine/i).type('1.8L Hybrid');
      cy.findByLabelText(/transmission/i).type('CVT');
      cy.findByRole('button', { name: /save/i }).click();
      
      // Verify success message and vehicle appears in the list
      cy.findByText(/vehicle created successfully/i).should('exist');
      cy.findByText(vin).should('exist');
      cy.findByText('Toyota').should('exist');
      cy.findByText('Corolla').should('exist');
    });
  });
  
  it('should search for vehicles', () => {
    // Assuming there's a vehicle with "Toyota" as the make
    cy.findByRole('textbox', { name: /search/i }).type('Toyota');
    cy.findByRole('button', { name: /search/i }).click();
    
    // Verify search results
    cy.findByText(/toyota/i).should('exist');
  });
  
  it('should edit an existing vehicle', () => {
    // Find and click edit button for first vehicle in the list
    cy.get('[data-testid="edit-vehicle-button"]').first().click();
    
    // Update vehicle details
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText(/notes/i).clear().type('Updated vehicle notes');
      cy.findByLabelText(/year/i).clear().type('2023');
      cy.findByRole('button', { name: /save/i }).click();
    });
    
    // Verify success message
    cy.findByText(/vehicle updated successfully/i).should('exist');
  });
  
  it('should show vehicle details with customer info', () => {
    // Click on a vehicle to view details
    cy.get('[data-testid="vehicle-row"]').first().click();
    
    // Verify navigation to details page
    cy.url().should('include', '/vehicles/');
    cy.findByRole('heading', { name: /vehicle details/i }).should('exist');
    cy.findByText(/customer/i).should('exist');
    cy.findByText(/vin/i).should('exist');
    cy.findByRole('button', { name: /edit/i }).should('exist');
  });
  
  it('should delete a vehicle', () => {
    // Create a vehicle to delete
    const timestamp = Date.now();
    const vin = `DELETE${timestamp}`;
    
    // Create customer first
    cy.createTestData('customer', {
      name: `Delete Vehicle Owner ${timestamp}`,
      email: `delete-owner${timestamp}@example.com`,
      phone: '0400123456',
      address: '123 Delete St, Sydney NSW 2000'
    }).then(customer => {
      // Create vehicle via API for faster testing
      cy.createTestData('vehicle', {
        vin: vin,
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        engine: '2.0L',
        transmission: 'CVT',
        customerId: customer.id
      }).then(vehicle => {
        // Refresh the page to see the new vehicle
        cy.visit('/vehicles');
        
        // Find and delete the vehicle
        cy.contains(vin).parent().within(() => {
          cy.get('[data-testid="delete-vehicle-button"]').click();
        });
        
        // Confirm deletion in dialog
        cy.findByRole('dialog').within(() => {
          cy.findByRole('button', { name: /confirm/i }).click();
        });
        
        // Verify success message
        cy.findByText(/vehicle deleted successfully/i).should('exist');
        
        // Verify vehicle no longer appears
        cy.contains(vin).should('not.exist');
      });
    });
  });
  
  it('should filter vehicles by make', () => {
    // Click on make filter
    cy.findByLabelText(/filter by make/i).click();
    
    // Select a make
    cy.findByRole('option', { name: /toyota/i }).click();
    
    // Verify filtered results
    cy.findByText(/toyota/i).should('exist');
  });
  
  it('should paginate through vehicles list', () => {
    // Get the first page items
    cy.get('[data-testid="vehicles-table"] tbody tr').then($firstPageRows => {
      const firstPageFirstItem = $firstPageRows.first().text();
      
      // Go to next page
      cy.findByRole('button', { name: /next page/i }).click();
      
      // Verify different items on second page
      cy.get('[data-testid="vehicles-table"] tbody tr').then($secondPageRows => {
        const secondPageFirstItem = $secondPageRows.first().text();
        expect(secondPageFirstItem).not.to.equal(firstPageFirstItem);
      });
      
      // Go back to first page
      cy.findByRole('button', { name: /previous page/i }).click();
      
      // Verify back to first page
      cy.get('[data-testid="vehicles-table"] tbody tr').first().should('contain.text', firstPageFirstItem);
    });
  });
});