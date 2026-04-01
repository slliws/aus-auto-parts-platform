// Simple test script to verify the quote conversion functionality
// This is a temporary file for testing purposes

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const TENANT_ID = 'your-tenant-id'; // Replace with actual tenant ID
const AUTH_TOKEN = 'your-auth-token'; // Replace with actual JWT token

// Test function
async function testQuoteConversion() {
  try {
    console.log('Testing quote conversion functionality...');

    // First, get an accepted quote
    const quotesResponse = await axios.get(`${BASE_URL}/quotes?status=ACCEPTED`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-tenant-id': TENANT_ID
      }
    });

    if (quotesResponse.data.data.length === 0) {
      console.log('No accepted quotes found. Please create an accepted quote first.');
      return;
    }

    const quoteId = quotesResponse.data.data[0].id;
    console.log(`Found accepted quote with ID: ${quoteId}`);

    // Convert the quote to order
    const convertResponse = await axios.post(`${BASE_URL}/quotes/${quoteId}/convert`, {}, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-tenant-id': TENANT_ID
      }
    });

    console.log('Quote conversion successful!');
    console.log('Response:', convertResponse.data);

    // Verify the quote status was updated
    const updatedQuoteResponse = await axios.get(`${BASE_URL}/quotes/${quoteId}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'x-tenant-id': TENANT_ID
      }
    });

    console.log('Updated quote status:', updatedQuoteResponse.data.data.quote.status);

    if (updatedQuoteResponse.data.data.quote.status === 'CONVERTED') {
      console.log('✅ Test passed: Quote status updated to CONVERTED');
    } else {
      console.log('❌ Test failed: Quote status was not updated to CONVERTED');
    }

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testQuoteConversion();