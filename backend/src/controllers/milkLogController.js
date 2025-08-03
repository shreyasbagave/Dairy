const MilkLog = require('../models/MilkLog');
const { v4: uuidv4 } = require('uuid');

exports.addMilkLog = async (req, res) => {
  try {
    const { farmer_id, date, session, quantity_liters, fat_percent, rate_per_liter } = req.body;
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    const total_cost = quantity_liters * rate_per_liter;
    const log = new MilkLog({
      log_id: uuidv4(),
      admin_id, // Include admin_id in the log entry
      farmer_id,
      date,
      session,
      quantity_liters,
      fat_percent,
      rate_per_liter,
      total_cost,
    });
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllMilkLogs = async (req, res) => {
  try {
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    const logs = await MilkLog.find({ admin_id }); // Only return logs created by this admin
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// New function to delete a milk log
exports.deleteMilkLog = async (req, res) => {
  try {
    const { log_id } = req.params;
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    
    console.log(`Attempting to delete milk log: ${log_id} by admin: ${admin_id}`);
    
    // Find and delete the milk log (only if admin owns it)
    const deletedLog = await MilkLog.findOneAndDelete({ 
      log_id: log_id, 
      admin_id: admin_id 
    });
    
    if (!deletedLog) {
      console.log(`Milk log not found or not owned by admin: ${log_id}`);
      return res.status(404).json({ 
        message: 'Milk log not found or you do not have permission to delete it' 
      });
    }
    
    console.log(`Successfully deleted milk log: ${log_id}`);
    res.json({ 
      message: 'Milk log deleted successfully',
      deletedLog: {
        log_id: deletedLog.log_id,
        farmer_id: deletedLog.farmer_id,
        date: deletedLog.date,
        session: deletedLog.session,
        quantity_liters: deletedLog.quantity_liters
      }
    });
  } catch (err) {
    console.error('Error deleting milk log:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// New function to get milk logs for a specific farmer
exports.getFarmerMilkLogs = async (req, res) => {
  try {
    console.log('getFarmerMilkLogs called');
    console.log('User from token:', req.user);
    
    const farmer_id = req.user.linked_farmer_id; // Get farmer_id from authenticated user
    console.log('Farmer ID from token:', farmer_id);
    
    if (!farmer_id) {
      console.log('No farmer_id found in user token');
      return res.status(400).json({ message: 'Farmer ID not found in user profile' });
    }

    console.log('Searching for milk logs with farmer_id:', farmer_id);
    const logs = await MilkLog.find({ farmer_id }).sort({ date: -1, session: 1 }); // Sort by date descending, then session
    console.log('Found logs:', logs.length);
    
    res.json(logs);
  } catch (err) {
    console.error('Error fetching farmer milk logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// New function to filter farmer's milk logs
exports.filterFarmerMilkLogs = async (req, res) => {
  try {
    const { date, session, month, section } = req.query;
    const farmer_id = req.user.linked_farmer_id; // Get farmer_id from authenticated user
    
    if (!farmer_id) {
      return res.status(400).json({ message: 'Farmer ID not found in user profile' });
    }
    
    let query = { farmer_id }; // Always filter by farmer_id first
    
    if (date) query.date = new Date(date);
    if (session && session !== 'All') query.session = session;
    if (month) {
      const start = new Date(month + '-01');
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }
    
    // Section logic: section 1 = day 1-10, 2 = 11-20, 3 = 21-end
    if (section && section !== 'All') {
      if (section === '1–10') {
        query['$expr'] = { 
          $and: [ 
            { $gte: [{ $dayOfMonth: '$date' }, 1] }, 
            { $lte: [{ $dayOfMonth: '$date' }, 10] } 
          ] 
        };
      }
      if (section === '11–20') {
        query['$expr'] = { 
          $and: [ 
            { $gte: [{ $dayOfMonth: '$date' }, 11] }, 
            { $lte: [{ $dayOfMonth: '$date' }, 20] } 
          ] 
        };
      }
      if (section === '21–End') {
        query['$expr'] = { $gte: [{ $dayOfMonth: '$date' }, 21] };
      }
    }
    
    const logs = await MilkLog.find(query).sort({ date: -1, session: 1 });
    res.json(logs);
  } catch (err) {
    console.error('Error filtering farmer milk logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.filterMilkLogs = async (req, res) => {
  try {
    const { date, session, farmer_id, month, section } = req.query;
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    
    console.log('Filter milk logs request:', { date, session, farmer_id, month, section, admin_id });
    
    let query = { admin_id }; // Always filter by admin_id first
    
    if (date) {
      // Handle date filtering more efficiently
      const dateObj = new Date(date);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: dateObj, $lt: nextDay };
    }
    
    // Only add session filter if it's provided and not empty
    if (session && session.trim() !== '') {
      query.session = session;
    }
    
    if (farmer_id) query.farmer_id = farmer_id;
    
    if (month) {
      const start = new Date(month + '-01');
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }
    
    // Section logic: section 1 = day 1-10, 2 = 11-20, 3 = 21-end
    if (section) {
      if (section === '1-10') query['$expr'] = { $and: [ { $gte: [{ $dayOfMonth: '$date' }, 1] }, { $lte: [{ $dayOfMonth: '$date' }, 10] } ] };
      if (section === '11-20') query['$expr'] = { $and: [ { $gte: [{ $dayOfMonth: '$date' }, 11] }, { $lte: [{ $dayOfMonth: '$date' }, 20] } ] };
      if (section === '21-End') query['$expr'] = { $gte: [{ $dayOfMonth: '$date' }, 21] };
    }
    
    console.log('MongoDB query:', JSON.stringify(query, null, 2));
    
    const logs = await MilkLog.find(query).sort({ date: -1, session: 1 });
    console.log(`Found ${logs.length} logs for admin ${admin_id}`);
    
    res.json(logs);
  } catch (err) {
    console.error('Error in filterMilkLogs:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 