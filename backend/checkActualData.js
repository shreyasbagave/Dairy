require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Farmer = require('./src/models/Farmer');
const MilkLog = require('./src/models/MilkLog');

async function checkActualData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check all users
    console.log('\n=== ALL USERS ===');
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    users.forEach(user => {
      console.log(`- Username: ${user.username}, Role: ${user.role}, Linked Farmer ID: ${user.linked_farmer_id || 'None'}`);
    });

    // Check all farmers
    console.log('\n=== ALL FARMERS ===');
    const farmers = await Farmer.find({});
    console.log(`Total farmers: ${farmers.length}`);
    farmers.forEach(farmer => {
      console.log(`- Farmer ID: ${farmer.farmer_id}, Name: ${farmer.name}, Admin ID: ${farmer.admin_id}`);
    });

    // Check all milk logs
    console.log('\n=== ALL MILK LOGS ===');
    const milkLogs = await MilkLog.find({});
    console.log(`Total milk logs: ${milkLogs.length}`);
    milkLogs.forEach(log => {
      console.log(`- Log ID: ${log.log_id}, Farmer ID: ${log.farmer_id}, Date: ${log.date}, Session: ${log.session}, Quantity: ${log.quantity_liters}L`);
    });

    // Check specific admin data
    console.log('\n=== ADMIN 9067933268 DATA ===');
    const adminFarmers = await Farmer.find({ admin_id: '9067933268' });
    console.log(`Farmers added by admin 9067933268: ${adminFarmers.length}`);
    adminFarmers.forEach(farmer => {
      console.log(`- Farmer ID: ${farmer.farmer_id}, Name: ${farmer.name}`);
    });

    const adminMilkLogs = await MilkLog.find({ admin_id: '9067933268' });
    console.log(`Milk logs added by admin 9067933268: ${adminMilkLogs.length}`);
    adminMilkLogs.forEach(log => {
      console.log(`- Log ID: ${log.log_id}, Farmer ID: ${log.farmer_id}, Date: ${log.date}, Session: ${log.session}, Quantity: ${log.quantity_liters}L`);
    });

    // Group milk logs by farmer
    console.log('\n=== MILK LOGS BY FARMER ===');
    const logsByFarmer = {};
    milkLogs.forEach(log => {
      if (!logsByFarmer[log.farmer_id]) {
        logsByFarmer[log.farmer_id] = [];
      }
      logsByFarmer[log.farmer_id].push(log);
    });

    Object.keys(logsByFarmer).forEach(farmerId => {
      console.log(`\nFarmer ID: ${farmerId} - ${logsByFarmer[farmerId].length} logs`);
      logsByFarmer[farmerId].forEach(log => {
        console.log(`  - ${log.date} ${log.session}: ${log.quantity_liters}L @ ₹${log.rate_per_liter} = ₹${log.total_cost}`);
      });
    });

  } catch (err) {
    console.error('Error checking data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkActualData(); 