const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testBillingEndpoints() {
  console.log('🧪 Testing Billing Endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthCheck = await fetch(`${API_BASE}/`);
    if (healthCheck.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server connection failed');
      return;
    }

    // Test 2: Test billing test endpoint
    console.log('\n2. Testing billing test endpoint...');
    try {
      const testResponse = await fetch(`${API_BASE}/api/billing/test`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        console.log('✅ Billing test endpoint working:', testData.message);
      } else {
        console.log('❌ Billing test endpoint failed:', testResponse.status, testResponse.statusText);
      }
    } catch (error) {
      console.log('❌ Billing test endpoint error:', error.message);
    }

    // Test 3: Test billing test endpoint without /api prefix
    console.log('\n3. Testing billing test endpoint without /api prefix...');
    try {
      const testResponse2 = await fetch(`${API_BASE}/billing/test`);
      if (testResponse2.ok) {
        const testData2 = await testResponse2.json();
        console.log('✅ Billing test endpoint (no /api) working:', testData2.message);
      } else {
        console.log('❌ Billing test endpoint (no /api) failed:', testResponse2.status, testResponse2.statusText);
      }
    } catch (error) {
      console.log('❌ Billing test endpoint (no /api) error:', error.message);
    }

    // Test 4: Test preview endpoint (should fail without auth)
    console.log('\n4. Testing preview endpoint without authentication...');
    try {
      const previewResponse = await fetch(`${API_BASE}/api/billing/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_id: 'test123',
          period_start: '2024-01-01',
          period_end: '2024-01-31'
        })
      });
      
      if (previewResponse.status === 401) {
        console.log('✅ Preview endpoint properly requires authentication');
      } else {
        console.log('⚠️ Preview endpoint response:', previewResponse.status, previewResponse.statusText);
      }
    } catch (error) {
      console.log('❌ Preview endpoint test error:', error.message);
    }

    console.log('\n🎯 Testing completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Check if you have a valid admin token in localStorage');
    console.log('2. Verify the farmer ID exists in your database');
    console.log('3. Check browser console for any JavaScript errors');
    console.log('4. Check server console for any backend errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBillingEndpoints();
