const Farmer = require('../models/Farmer');
const jwt = require('jsonwebtoken');

// Farmer signup - register new farmer and auto-login
exports.farmerSignup = async (req, res) => {
  const { farmer_id, name, phone, address, bank_details, password } = req.body;
  
  try {
    // Validate required fields
    if (!farmer_id || !name || !phone || !address || !bank_details || !password) {
      return res.status(400).json({ 
        message: 'All fields are required: farmer_id, name, phone, address, bank_details, password' 
      });
    }

    if (!bank_details.account_no || !bank_details.ifsc) {
      return res.status(400).json({ 
        message: 'Bank details must include account_no and ifsc' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if farmer_id already exists
    const existingFarmer = await Farmer.findOne({ farmer_id });
    if (existingFarmer) {
      return res.status(400).json({ 
        message: 'Farmer ID already exists. Please use a different ID.' 
      });
    }

    // Create new farmer
    const farmer = new Farmer({
      farmer_id,
      admin_id: 'self-registered', // Mark as self-registered
      name,
      phone,
      address,
      bank_details,
      is_first_login: false // Not first login since they're setting password now
    });

    // Set password
    await farmer.setPassword(password);
    await farmer.save();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { 
        farmerId: farmer._id, 
        farmer_id: farmer.farmer_id,
        admin_id: farmer.admin_id,
        role: 'farmer' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      message: 'Farmer registered successfully and logged in',
      token, 
      role: 'farmer',
      farmer_id: farmer.farmer_id,
      farmer_name: farmer.name,
      admin_id: farmer.admin_id,
      is_first_login: false
    });

  } catch (err) {
    console.error('Farmer signup error:', err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Farmer ID already exists. Please use a different ID.' 
      });
    }
    
    res.status(500).json({ message: 'Server error during signup' });
  }
};

// Farmer login using farmer_id and password
exports.farmerLogin = async (req, res) => {
  const { farmer_id, password } = req.body;
  
  try {
    // Find farmer by farmer_id
    const farmer = await Farmer.findOne({ farmer_id, is_active: true });
    if (!farmer) {
      return res.status(401).json({ message: 'Invalid farmer ID or farmer is inactive' });
    }

    // Check if this is first-time login
    if (farmer.is_first_login) {
      // For first-time login, we need to verify the farmer_id as password
      if (password !== farmer_id) {
        return res.status(401).json({ 
          message: 'First-time login: Please use your Farmer ID as password',
          is_first_login: true 
        });
      }

      // Generate temporary token for password setup
      const tempToken = jwt.sign(
        { 
          farmerId: farmer._id, 
          farmer_id: farmer.farmer_id,
          admin_id: farmer.admin_id,
          role: 'farmer',
          is_first_login: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m' } // Short expiry for security
      );

      return res.json({ 
        token: tempToken, 
        role: 'farmer',
        farmer_id: farmer.farmer_id,
        farmer_name: farmer.name,
        admin_id: farmer.admin_id,
        is_first_login: true,
        message: 'Please set your password to continue'
      });
    }

    // Regular login - check password
    if (!farmer.password_hash) {
      return res.status(401).json({ message: 'Password not set. Please contact admin.' });
    }

    const validPassword = await farmer.checkPassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        farmerId: farmer._id, 
        farmer_id: farmer.farmer_id,
        admin_id: farmer.admin_id,
        role: 'farmer' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      token, 
      role: 'farmer',
      farmer_id: farmer.farmer_id,
      farmer_name: farmer.name,
      admin_id: farmer.admin_id,
      is_first_login: false
    });
  } catch (err) {
    console.error('Farmer login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set password for farmer (admin function)
exports.setFarmerPassword = async (req, res) => {
  const { farmer_id, password } = req.body;
  const admin_id = req.user.userId; // Assuming admin is logged in
  
  try {
    const farmer = await Farmer.findOne({ farmer_id, admin_id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    await farmer.setPassword(password);
    await farmer.save();

    res.json({ message: 'Password set successfully for farmer' });
  } catch (err) {
    console.error('Set farmer password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Set initial password for first-time login
exports.setInitialPassword = async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const farmer_id = req.user.farmer_id; // From JWT token
  
  try {
    // Validate input
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Password and confirmation are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const farmer = await Farmer.findOne({ farmer_id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Check if this is actually a first-time login
    if (!farmer.is_first_login) {
      return res.status(400).json({ message: 'Password has already been set' });
    }

    // Set new password
    await farmer.setPassword(newPassword);
    farmer.is_first_login = false; // Mark as no longer first login
    await farmer.save();

    // Generate new token for regular login
    const token = jwt.sign(
      { 
        farmerId: farmer._id, 
        farmer_id: farmer.farmer_id,
        admin_id: farmer.admin_id,
        role: 'farmer' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ 
      message: 'Password set successfully',
      token,
      role: 'farmer',
      farmer_id: farmer.farmer_id,
      farmer_name: farmer.name,
      admin_id: farmer.admin_id,
      is_first_login: false
    });
  } catch (err) {
    console.error('Set initial password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change farmer password (farmer function)
exports.changeFarmerPassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const farmer_id = req.user.farmer_id; // From JWT token
  
  try {
    const farmer = await Farmer.findOne({ farmer_id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    // Verify current password
    const validCurrentPassword = await farmer.checkPassword(currentPassword);
    if (!validCurrentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Set new password
    await farmer.setPassword(newPassword);
    await farmer.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change farmer password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get farmer profile
exports.getFarmerProfile = async (req, res) => {
  const farmer_id = req.user.farmer_id; // From JWT token
  
  try {
    const farmer = await Farmer.findOne({ farmer_id }).select('-password_hash');
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    res.json(farmer);
  } catch (err) {
    console.error('Get farmer profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
