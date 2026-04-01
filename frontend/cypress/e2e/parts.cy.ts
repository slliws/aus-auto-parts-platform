// Tests for parts management functionality

describe('Parts Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('admin@example.com', 'password123');
    
    // Navigate to parts page
    cy.visit('/parts');
  });
  
  it('should display the parts listing page', () => {
    cy.url().should('include', '/parts');
    cy.findByRole('heading', { name: /parts/i }).should('exist');
    cy.findByRole('button', { name: /add part/i }).should('exist');
  });
  
  it('should open the add part form when add button is clicked', () => {
    cy.findByRole('button', { name: /add part/i }).click();
    cy.findByRole('dialog').should('be.visible');
    cy.findByText(/add new part/i).should('exist');
    cy.findByLabelText(/part number/i).should('exist');
    cy.findByLabelText(/name/i).should('exist');
    cy.findByLabelText(/category/i).should('exist');
    cy.findByLabelText(/price/i).should('exist');
  });
  
  it('should show validation errors when submitting empty form', () => {
    cy.findByRole('button', { name: /add part/i }).click();
    cy.findByRole('dialog').within(() => {
      cy.findByRole('button', { name: /save/i }).click();
      cy.findByText(/part number is required/i).should('exist');
      cy.findByText(/name is required/i).should('exist');
    });
  });
  
  it('should successfully add a new part', () => {
    const partNumber = `TEST-${Date.now()}`;
    
    cy.findByRole('button', { name: /add part/i }).click();
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText(/part number/i).type(partNumber);
      cy.findByLabelText(/name/i).type('Test Part');
      cy.findByLabelText(/description/i).type('This is a test part');
      cy.findByLabelText(/category/i).click();
    });
    
    // Select category from dropdown
    cy.findByRole('option', { name: /engine/i }).click();
    
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText(/price/i).type('99.99');
      cy.findByLabelText(/cost/i).type('49.99');
      cy.findByLabelText(/quantity/i).type('100');
      cy.findByRole('button', { name: /save/i }).click();
    });
    
    // Verify success message and part appears in the list
    cy.findByText(/part created successfully/i).should('exist');
    cy.findByText(partNumber).should('exist');
    cy.findByText('Test Part').should('exist');
  });
  
  it('should search for parts', () => {
    // Assuming there's a part with "Filter" in the name
    cy.findByRole('textbox', { name: /search/i }).type('Filter');
    cy.findByRole('button', { name: /search/i }).click();
    
    // Verify search results
    cy.findByText(/filter/i).should('exist');
  });
  
  it('should edit an existing part', () => {
    // Find and click edit button for first part in the list
    cy.get('[data-testid="edit-part-button"]').first().click();
    
    // Update part details
    cy.findByRole('dialog').within(() => {
      cy.findByLabelText(/description/i).clear().type('Updated description');
      cy.findByLabelText(/price/i).clear().type('129.99');
      cy.findByRole('button', { name: /save/i }).click();
    });
    
    // Verify success message
    cy.findByText(/part updated successfully/i).should('exist');
  });
  
  it('should delete a part', () => {
    // Create a part to delete
    const partNumber = `DELETE-${Date.now()}`;
    
    // Create part via API for faster testing
    cy.createTestData('part', {
      partNumber,
      name: 'Part to Delete',
      description: 'This part will be deleted',
      category: 'ENGINE',
      price: 99.99,
      cost: 49.99,
      quantity: 100
    }).then(part => {
      // Refresh the page to see the new part
      cy.visit('/parts');
      
      // Find and delete the part
      cy.contains(partNumber).parent().within(() => {
        cy.get('[data-testid="delete-part-button"]').click();
      });
      
      // Confirm deletion in dialog
      cy.findByRole('dialog').within(() => {
        cy.findByRole('button', { name: /confirm/i }).click();
      });
      
      // Verify success message
      cy.findByText(/part deleted successfully/i).should('exist');
      
      // Verify part no longer appears
      cy.contains(partNumber).should('not.exist');
    });
  });
  
  it('should filter parts by category', () => {
    // Click on category filter
    cy.findByLabelText(/filter by category/i).click();
    
    // Select a category
    cy.findByRole('option', { name: /brakes/i }).click();
    
    // Verify filtered results
    cy.findByText(/brakes/i).should('exist');
  });
  
  it('should paginate through parts list', () => {
    // Get the first page items
    cy.get('[data-testid="parts-table"] tbody tr').then($firstPageRows => {
      const firstPageFirstItem = $firstPageRows.first().text();
      
      // Go to next page
      cy.findByRole('button', { name: /next page/i }).click();
      
      // Verify different items on second page
      cy.get('[data-testid="parts-table"] tbody tr').then($secondPageRows => {
        const secondPageFirstItem = $secondPageRows.first().text();
        expect(secondPageFirstItem).not.to.equal(firstPageFirstItem);
      });
      
      // Go back to first page
      cy.findByRole('button', { name: /previous page/i }).click();
      
      // Verify back to first page
      cy.get('[data-testid="parts-table"] tbody tr').first().should('contain.text', firstPageFirstItem);
    });
  });
});