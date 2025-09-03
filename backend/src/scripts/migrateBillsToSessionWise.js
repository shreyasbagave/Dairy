const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const MilkLog = require('../models/MilkLog');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dairy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function migrateBillsToSessionWise() {
  try {
    console.log('Starting migration of bills to session-wise breakdown...');
    
    // Get all bills that don't have session-wise data
    const billsToUpdate = await Bill.find({
      $or: [
        { morning_milk_liters: { $exists: false } },
        { morning_milk_amount: { $exists: false } },
        { evening_milk_liters: { $exists: false } },
        { evening_milk_amount: { $exists: false } }
      ]
    });
    
    console.log(`Found ${billsToUpdate.length} bills to update...`);
    
    let updatedCount = 0;
    
    for (const bill of billsToUpdate) {
      try {
        // Calculate session-wise totals from milk logs
        const logs = await MilkLog.find({
          admin_id: bill.admin_id,
          farmer_id: bill.farmer_id,
          date: { 
            $gte: bill.period_start, 
            $lte: bill.period_end 
          }
        });
        
        // Calculate session-wise totals
        const morningLogs = logs.filter(log => log.session === 'Morning');
        const eveningLogs = logs.filter(log => log.session === 'Evening');
        
        const morning_milk_liters = morningLogs.reduce((sum, l) => sum + (l.quantity_liters || 0), 0);
        const morning_milk_amount = morningLogs.reduce((sum, l) => sum + (l.total_cost || 0), 0);
        const evening_milk_liters = eveningLogs.reduce((sum, l) => sum + (l.quantity_liters || 0), 0);
        const evening_milk_amount = eveningLogs.reduce((sum, l) => sum + (l.total_cost || 0), 0);
        
        // Update the bill with session-wise data
        await Bill.updateOne(
          { _id: bill._id },
          {
            $set: {
              morning_milk_liters,
              morning_milk_amount,
              evening_milk_liters,
              evening_milk_amount
            }
          }
        );
        
        updatedCount++;
        console.log(`Updated bill ${bill.bill_id} with session-wise data`);
        
      } catch (error) {
        console.error(`Error updating bill ${bill.bill_id}:`, error.message);
      }
    }
    
    console.log(`Migration completed! Updated ${updatedCount} bills.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateBillsToSessionWise();
}

module.exports = migrateBillsToSessionWise;
