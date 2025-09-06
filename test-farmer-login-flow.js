const axios = require('axios');

const API_BASE = 'http://localhost:5000';

async function testFarmerLoginFlow() {
  console.log('Testing Complete Farmer Login Flow...\n');

  try {
    // Step 1: Test farmer login
    console.log('1. Testing farmer login...');
    const loginData = {
      farmer_id: 'TEST002', // Using the farmer we created earlier
      password: 'testpass123'
    };

    const loginResponse = await axios.post(`${API_BASE}/farmer-auth/login`, loginData);
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful!');
      console.log('Response:', {
        farmer_id: loginResponse.data.farmer_id,
        farmer_name: loginResponse.data.farmer_name,
        role: loginResponse.data.role,
        is_first_login: loginResponse.data.is_first_login,
        hasToken: !!loginResponse.data.token
      });

      const token = loginResponse.data.token;

      // Step 2: Test accessing farmer dashboard data
      console.log('\n2. Testing farmer dashboard access...');
      const dashboardResponse = await axios.get(`${API_BASE}/farmer/milk-logs-new`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (dashboardResponse.status === 200) {
        console.log('✅ Dashboard access successful!');
        console.log('Milk logs count:', dashboardResponse.data.length);
        console.log('Sample data:', dashboardResponse.data.slice(0, 2));
      } else {
        console.log('❌ Dashboard access failed:', dashboardResponse.status);
      }

      // Step 3: Test farmer profile access
      console.log('\n3. Testing farmer profile access...');
      const profileResponse = await axios.get(`${API_BASE}/farmer-auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.status === 200) {
        console.log('✅ Profile access successful!');
        console.log('Profile data:', {
          farmer_id: profileResponse.data.farmer_id,
          name: profileResponse.data.name,
          phone: profileResponse.data.phone,
          is_active: profileResponse.data.is_active
        });
      } else {
        console.log('❌ Profile access failed:', profileResponse.status);
      }

      // Step 4: Test unauthorized access (without token)
      console.log('\n4. Testing unauthorized access...');
      try {
        await axios.get(`${API_BASE}/farmer/milk-logs-new`);
        console.log('❌ Unauthorized access should have failed!');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Unauthorized access correctly blocked!');
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }

    } else {
      console.log('❌ Login failed:', loginResponse.status);
    }

    console.log('\n🎉 Farmer login flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testFarmerLoginFlow();
