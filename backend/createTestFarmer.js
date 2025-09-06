require('dotenv').config();
const mongoose = require('mongoose');
const Farmer = require('./src/models/Farmer');

async function createTestFarmer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create a test farmer
    const testFarmer = new Farmer({
      farmer_id: 'F001',
      admin_id: 'admin1', // You can change this to match your admin ID
      name: 'Test Farmer',
      phone: '1234567890',
      address: 'Test Address, Test City',
      bank_details: {
        account_no: '1234567890',
        ifsc: 'TEST0001234'
      }
      // No password set - farmer will set it on first login
    });
    
    // Save the farmer
    await testFarmer.save();
    console.log('✅ Test farmer created successfully!');
    console.log('Farmer ID: F001');
    console.log('First-time login password: F001 (use farmer_id as password)');
    console.log('Name:', testFarmer.name);
    console.log('Admin ID:', testFarmer.admin_id);
    console.log('Note: Farmer will be prompted to set a new password on first login');

  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Farmer F001 already exists. You can use it for testing.');
      console.log('Farmer ID: F001');
      console.log('First-time login password: F001 (use farmer_id as password)');
    } else {
      console.error('❌ Error creating test farmer:', error);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestFarmer();
