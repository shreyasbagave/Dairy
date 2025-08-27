const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// This script will test the feed management system with actual data
// Make sure you have farmers in your database first

async function testFeedManagement() {
  console.log('🌾 Testing Feed Management System...\n');

  try {
    // 1. First, get all farmers from the database
    console.log('1. Fetching farmers from database...');
    const farmersResponse = await axios.get(`${API_BASE_URL}/admin/farmers`);
    
    if (!farmersResponse.data || farmersResponse.data.length === 0) {
      console.log('❌ No farmers found in database. Please add some farmers first.');
      return;
    }

    const farmers = farmersResponse.data;
    console.log(`✅ Found ${farmers.length} farmers in database`);
    
    // Use the first farmer for testing
    const testFarmer = farmers[0];
    console.log(`   Using farmer: ${testFarmer.farmer_id} - ${testFarmer.name}`);

    // 2. Test adding feed purchase
    console.log('\n2. Testing feed purchase addition...');
    const feedResponse = await axios.post(`${API_BASE_URL}/api/feed/purchases/${testFarmer.farmer_id}`, {
      bags: 5,
      amount: 2500,
      date: new Date().toISOString().slice(0, 10)
    });
    console.log('✅ Feed purchase added successfully');
    console.log('   Response:', feedResponse.data);

    // 3. Test getting all feed purchases
    console.log('\n3. Testing feed purchases retrieval...');
    const purchasesResponse = await axios.get(`${API_BASE_URL}/api/feed/purchases`);
    console.log('✅ Feed purchases retrieved successfully');
    console.log('   Response:', purchasesResponse.data);

    // 4. Test getting feed purchases for specific farmer
    console.log('\n4. Testing farmer-specific feed purchases...');
    const farmerPurchasesResponse = await axios.get(`${API_BASE_URL}/api/feed/purchases/farmer/${testFarmer.farmer_id}`);
    console.log('✅ Farmer feed purchases retrieved successfully');
    console.log('   Response:', farmerPurchasesResponse.data);

    // 5. Test updating feed purchase (if any purchases exist)
    if (purchasesResponse.data.purchases && purchasesResponse.data.purchases.length > 0) {
      const purchaseId = purchasesResponse.data.purchases[0]._id;
      console.log('\n5. Testing feed purchase update...');
      const updateResponse = await axios.put(`${API_BASE_URL}/api/feed/purchases/${purchaseId}`, {
        bags: 6,
        amount: 3000
      });
      console.log('✅ Feed purchase updated successfully');
      console.log('   Response:', updateResponse.data);
    }

    // 6. Test deleting feed purchase (if any purchases exist)
    if (purchasesResponse.data.purchases && purchasesResponse.data.purchases.length > 0) {
      const purchaseId = purchasesResponse.data.purchases[0]._id;
      console.log('\n6. Testing feed purchase deletion...');
      const deleteResponse = await axios.delete(`${API_BASE_URL}/api/feed/purchases/${purchaseId}`);
      console.log('✅ Feed purchase deleted successfully');
      console.log('   Response:', deleteResponse.data);
    }

    console.log('\n🎉 All feed management tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   - Farmer tested: ${testFarmer.farmer_id} - ${testFarmer.name}`);
    console.log(`   - Feed purchase: 5 bags for ₹2500`);
    console.log(`   - Purchase date: ${new Date().toISOString().slice(0, 10)}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure the backend server is running on port 5000');
    console.log('   2. Ensure you have farmers in your database');
    console.log('   3. Check that MongoDB is connected');
    console.log('   4. Verify that the feed routes are properly configured');
    console.log('   5. Ensure you have valid authentication token');
  }
}

// Run the test
testFeedManagement();
