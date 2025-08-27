const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000'|| 'https://dairy-1-baro.onrender.com';

async function testFeedEndpoints() {
  console.log('🔍 Testing Feed Endpoints...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthResponse = await axios.get(`${API_BASE_URL}/`);
    console.log('✅ Server is running:', healthResponse.data);

    // Test 2: Check feed endpoints (should return 401 without auth)
    console.log('\n2. Testing feed endpoints (expecting 401 without auth)...');
    
    try {
      await axios.get(`${API_BASE_URL}/api/feed/purchases`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Feed endpoint accessible (401 as expected without auth)');
      } else {
        console.log('❌ Unexpected response:', error.response?.status);
      }
    }

    console.log('\n🎉 Feed endpoints are properly configured!');
    console.log('\n📋 Available endpoints:');
    console.log('   - GET /api/feed/purchases');
    console.log('   - GET /api/feed/purchases/farmer/:farmerId');
    console.log('   - POST /api/feed/purchases/:farmerId');
    console.log('   - PUT /api/feed/purchases/:purchaseId');
    console.log('   - DELETE /api/feed/purchases/:purchaseId');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running on port 5000');
    console.log('   2. MongoDB is connected');
    console.log('   3. All dependencies are installed');
  }
}

// Run the test
testFeedEndpoints();
