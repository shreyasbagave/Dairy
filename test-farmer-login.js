const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testFarmerLogin() {
  console.log('🧪 Testing Farmer Login Functionality\n');

  try {
    // Test 1: Try to login with a non-existent farmer
    console.log('Test 1: Login with non-existent farmer');
    try {
      const response = await axios.post(`${BASE_URL}/farmer-auth/login`, {
        farmer_id: 'NONEXISTENT',
        password: 'password123'
      });
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected non-existent farmer');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 2: Try to login with wrong password
    console.log('\nTest 2: Login with wrong password');
    try {
      const response = await axios.post(`${BASE_URL}/farmer-auth/login`, {
        farmer_id: 'F001', // Assuming F001 exists
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed but got:', response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly rejected wrong password');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Try first-time login (farmer_id as password)
    console.log('\nTest 3: First-time login with farmer_id as password');
    try {
      const response = await axios.post(`${BASE_URL}/farmer-auth/login`, {
        farmer_id: 'F001',
        password: 'F001' // Use farmer_id as password for first-time login
      });
      
      if (response.data.token) {
        console.log('✅ Successfully logged in farmer (first-time)');
        console.log('Farmer ID:', response.data.farmer_id);
        console.log('Farmer Name:', response.data.farmer_name);
        console.log('Is First Login:', response.data.is_first_login);
        console.log('Token received:', response.data.token ? 'Yes' : 'No');
        
        if (response.data.is_first_login) {
          console.log('✅ Correctly identified as first-time login');
          
          // Test 4: Set initial password
          console.log('\nTest 4: Set initial password');
          try {
            const passwordResponse = await axios.post(`${BASE_URL}/farmer-auth/set-initial-password`, {
              newPassword: 'newpassword123',
              confirmPassword: 'newpassword123'
            }, {
              headers: {
                'Authorization': `Bearer ${response.data.token}`
              }
            });
            console.log('✅ Successfully set initial password');
            console.log('New token received:', passwordResponse.data.token ? 'Yes' : 'No');
            console.log('Is First Login after password set:', passwordResponse.data.is_first_login);
            
            // Test 5: Try login with new password
            console.log('\nTest 5: Login with new password');
            try {
              const newLoginResponse = await axios.post(`${BASE_URL}/farmer-auth/login`, {
                farmer_id: 'F001',
                password: 'newpassword123'
              });
              console.log('✅ Successfully logged in with new password');
              console.log('Is First Login:', newLoginResponse.data.is_first_login);
            } catch (newLoginError) {
              console.log('❌ Failed to login with new password:', newLoginError.message);
            }
            
          } catch (passwordError) {
            console.log('❌ Failed to set initial password:', passwordError.message);
          }
        } else {
          console.log('⚠️  Farmer is not in first-time login state');
        }
      } else {
        console.log('❌ Login failed - no token received');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('❌ Login failed - farmer might not exist or wrong credentials');
        console.log('Error details:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

  } catch (error) {
    console.log('❌ Test setup error:', error.message);
  }

  console.log('\n🏁 Farmer login tests completed');
}

// Run the tests
testFarmerLogin();
