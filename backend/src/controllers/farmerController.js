const Farmer = require('../models/Farmer');
const MilkLog = require('../models/MilkLog');
const User = require('../models/User');

exports.addFarmer = async (req, res) => {
  try {
    const { farmer_id, name, phone, address, bank_details } = req.body;
    
    // Debug logging
    console.log('Received request body:', req.body);
    console.log('User from token:', req.user);
    
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    
    // Validate required fields
    if (!farmer_id || !name || !phone || !address || !bank_details) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { farmer_id, name, phone, address, bank_details }
      });
    }
    
    if (!bank_details.account_no || !bank_details.ifsc) {
      return res.status(400).json({ 
        message: 'Missing bank details',
        received: bank_details
      });
    }
    
    // Check if farmer exists for this admin
    const exists = await Farmer.findOne({ farmer_id, admin_id });
    if (exists) {
      return res.status(400).json({ message: 'Farmer ID already exists for this admin' });
    }
    
    // Also check if farmer_id exists globally (due to old index)
    const globalExists = await Farmer.findOne({ farmer_id });
    if (globalExists) {
      return res.status(400).json({ 
        message: 'Farmer ID already exists in the system. Please use a different ID.',
        suggestion: 'Try adding a prefix or suffix to make it unique'
      });
    }
    
    const farmer = new Farmer({ 
      farmer_id, 
      admin_id, // Include admin_id in the farmer entry
      name, 
      phone, 
      address, 
      bank_details
      // No password_hash set - farmer will set it on first login
    });
    
    console.log('Saving farmer:', farmer);
    
    await farmer.save();
    console.log('Farmer saved successfully:', farmer);
    
    res.status(201).json(farmer);
  } catch (err) {
    console.error('Error in addFarmer:', err);
    
    // Handle specific MongoDB duplicate key error
    if (err.code === 11000) {
      const keyValue = err.keyValue;
      if (keyValue && keyValue.farmer_id) {
        return res.status(400).json({ 
          message: `Farmer ID "${keyValue.farmer_id}" already exists. Please use a different ID.`,
          suggestion: 'Try adding a prefix (e.g., F001, F002) or use a different numbering system'
        });
      }
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.editFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    const update = req.body;
    const farmer = await Farmer.findOneAndUpdate(
      { farmer_id: id, admin_id }, // Only update if admin owns this farmer
      update, 
      { new: true }
    );
    if (!farmer) return res.status(404).json({ message: 'Farmer not found' });
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    
    console.log(`Attempting to delete farmer: ${id} by admin: ${admin_id}`);
    
    // First, find the farmer to get details
    const farmer = await Farmer.findOne({ farmer_id: id, admin_id });
    if (!farmer) {
      console.log(`Farmer not found or not owned by admin: ${id}`);
      return res.status(404).json({ message: 'Farmer not found or you do not have permission to delete it' });
    }
    
    console.log(`Found farmer: ${farmer.name} (ID: ${farmer.farmer_id})`);
    
    // Delete all milk logs for this farmer (owned by this admin)
    const deletedMilkLogs = await MilkLog.deleteMany({ 
      farmer_id: id, 
      admin_id: admin_id 
    });
    console.log(`Deleted ${deletedMilkLogs.deletedCount} milk logs for farmer ${id}`);
    
    // Delete the farmer record
    const deletedFarmer = await Farmer.findOneAndDelete({ 
      farmer_id: id, 
      admin_id: admin_id 
    });
    console.log(`Deleted farmer record: ${deletedFarmer.name}`);
    
    // Delete any user accounts linked to this farmer
    const deletedUsers = await User.deleteMany({ 
      linked_farmer_id: id 
    });
    console.log(`Deleted ${deletedUsers.deletedCount} user accounts linked to farmer ${id}`);
    
    res.json({ 
      message: 'Farmer and all related data deleted successfully',
      deletedFarmer: {
        farmer_id: deletedFarmer.farmer_id,
        name: deletedFarmer.name,
        phone: deletedFarmer.phone
      },
      deletedMilkLogs: deletedMilkLogs.deletedCount,
      deletedUserAccounts: deletedUsers.deletedCount
    });
    
  } catch (err) {
    console.error('Error deleting farmer:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllFarmers = async (req, res) => {
  try {
    const admin_id = req.user.userId; // Get admin ID from authenticated user
    const farmers = await Farmer.find({ admin_id }); // Only return farmers created by this admin
    res.json(farmers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 