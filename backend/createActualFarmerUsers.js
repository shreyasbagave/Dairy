require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Farmer = require('./src/models/Farmer');

async function createActualFarmerUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all farmers from the database
    const farmers = await Farmer.find({});
    console.log(`Found ${farmers.length} farmers in database`);

    // Create user accounts for each farmer
    for (const farmer of farmers) {
      const farmerId = farmer.farmer_id;
      const farmerName = farmer.name;
      
      // Check if user already exists for this farmer
      const existingUser = await User.findOne({ linked_farmer_id: farmerId });
      
      if (existingUser) {
        console.log(`✅ User already exists for farmer ${farmerId} (${farmerName})`);
        continue;
      }

      // Create username from farmer name
      const username = farmerName.toLowerCase().replace(/\s+/g, '') + farmerId;
      
      // Create password (you can change this)
      const password = 'password123';
      
      // Hash password
      const password_hash = await bcrypt.hash(password, 10);
      
      // Create user with _id field
      const newUser = new User({
        _id: username, // Use username as _id
        username: username,
        password_hash: password_hash,
        role: 'farmer',
        linked_farmer_id: farmerId
      });
      
      await newUser.save();
      console.log(`✅ Created user for farmer ${farmerId} (${farmerName})`);
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: farmer`);
      console.log(`   Linked Farmer ID: ${farmerId}`);
      console.log('');
    }

    console.log('\n📋 All Farmer Login Credentials:');
    const farmerUsers = await User.find({ role: 'farmer' });
    farmerUsers.forEach(user => {
      console.log(`\n👤 ${user.username}:`);
      console.log(`   Password: password123`);
      console.log(`   Role: farmer`);
      console.log(`   Linked Farmer ID: ${user.linked_farmer_id}`);
    });

  } catch (err) {
    console.error('Error creating farmer users:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createActualFarmerUsers(); 