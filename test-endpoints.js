// Test script to verify backend endpoints
const API_BASE_URL = 'https://dairy-1-baro.onrender.com';

async function testEndpoints() {
  console.log('Testing backend endpoints...\n');

  // Test 1: Basic health check
  try {
    const response = await fetch(`${API_BASE_URL}/`);
    console.log('✅ Health check:', response.status, response.statusText);
    const text = await response.text();
    console.log('   Response:', text);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Test admin milk logs endpoint (should return 401 without auth)
  try {
    const response = await fetch(`${API_BASE_URL}/admin/milk-logs`);
    console.log('\n✅ Admin milk logs endpoint:', response.status, response.statusText);
    if (response.status === 401) {
      console.log('   Expected: 401 Unauthorized (no token provided)');
    }
  } catch (error) {
    console.log('❌ Admin milk logs endpoint failed:', error.message);
  }

  // Test 3: Test farmer milk logs endpoint (should return 401 without auth)
  try {
    const response = await fetch(`${API_BASE_URL}/farmer/milk-logs`);
    console.log('\n✅ Farmer milk logs endpoint:', response.status, response.statusText);
    if (response.status === 401) {
      console.log('   Expected: 401 Unauthorized (no token provided)');
    }
  } catch (error) {
    console.log('❌ Farmer milk logs endpoint failed:', error.message);
  }

  console.log('\n🎯 Endpoint test completed!');
  console.log('If you see 401 errors, that means the endpoints are working correctly');
  console.log('and just require authentication tokens.');
}

testEndpoints(); 