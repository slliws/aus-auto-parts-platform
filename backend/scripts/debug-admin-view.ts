// Using global fetch available in Node.js 18+

const BASE_URL = 'http://localhost:3000/api/v1';
const CREDENTIALS = {
  email: 'admin@aussieautoparts.com.au',
  password: 'Password123!'
};

async function debugAdminView() {
  console.log('🔍 Starting Admin View Debug Script...');

  try {
    // 1. Login
    console.log(`\n🔑 Authenticating as ${CREDENTIALS.email}...`);
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json() as any;
    const token = loginData.data?.accessToken;

    if (!token) {
      throw new Error('No access token received in login response');
    }
    console.log('✅ Authentication successful. Token received.');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get Customers
    console.log('\n👥 Fetching Customers (limit=100)...');
    const customersResponse = await fetch(`${BASE_URL}/customers?limit=100`, { headers });
    
    if (!customersResponse.ok) {
        const text = await customersResponse.text();
        console.error(`❌ Customer fetch failed: ${customersResponse.status} ${customersResponse.statusText}`, text);
    } else {
        const customersData = await customersResponse.json() as any;
        console.log(`✅ Customers request success: ${customersData.success}`);
        
        const meta = customersData.meta || {};
        const customers = customersData.data?.customers || [];

        console.log(`   Total Count (Meta): ${meta.total ?? 'N/A'}`);
        console.log(`   Pagination: Page ${meta.page}, Limit ${meta.limit}`);
        console.log(`   Customers Array Length: ${customers.length}`);
        
        if (customers.length > 0) {
           console.log(`   Sample Customer: ${customers[0].first_name} ${customers[0].last_name} (${customers[0].customer_type})`);
        }
    }

    // 3. Get Parts (Stock)
    console.log('\n🔧 Fetching Parts (limit=100)...');
    const partsResponse = await fetch(`${BASE_URL}/parts?limit=100`, { headers });

    if (!partsResponse.ok) {
        const text = await partsResponse.text();
        console.error(`❌ Parts fetch failed: ${partsResponse.status} ${partsResponse.statusText}`, text);
    } else {
        const partsData = await partsResponse.json() as any;
         console.log(`✅ Parts request success: ${partsData.success}`);
        
        const meta = partsData.meta || {};
        const parts = partsData.data?.parts || [];

        console.log(`   Total Count (Meta): ${meta.total ?? 'N/A'}`);
        console.log(`   Pagination: Page ${meta.page}, Limit ${meta.limit}`);
        console.log(`   Parts Array Length: ${parts.length}`);

        if (parts.length > 0) {
            console.log(`   Sample Part: ${parts[0].part_number} - ${parts[0].name}`);
         }
    }

    console.log('\n🏁 Debug script finished.');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error);
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes('fetch failed')) {
        console.error('💡 Hint: Is the backend server running on port 3000?');
    }
    process.exit(1);
  }
}

debugAdminView();