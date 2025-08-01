const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Store reset tokens in memory (in production, use Redis or database)
const resetTokens = new Map();

exports.signupAdmin = async (req, res) => {
  const { username, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({ _id: username, username, password_hash, role: 'admin' });
    await user.save();
    res.status(201).json({ message: 'Admin registered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.signupFarmer = async (req, res) => {
  const { username, password, farmer_id } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'Username already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = new User({ _id: username, username, password_hash, role: 'farmer', linked_farmer_id: farmer_id });
    await user.save();
    res.status(201).json({ message: 'Farmer registered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { username, password, role } = req.body; // add role
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Add this check:
    if (role && user.role !== role) {
      return res.status(403).json({ message: 'Role mismatch' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, role: user.role, linked_farmer_id: user.linked_farmer_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // Get user ID from JWT token

    // Find the user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const validCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validCurrentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password_hash = newPasswordHash;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { username, role } = req.body;

    // Find user by username and role
    const user = await User.findOne({ username, role });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Store token in memory (in production, store in database)
    resetTokens.set(resetToken, {
      userId: user._id,
      role: user.role,
      expiry: resetTokenExpiry
    });

    // In a real application, send email here
    // For now, we'll return the reset link
    const resetLink = `${process.env.FRONTEND_URL || 'https://dairy-frontend-1.onrender.com'}/reset-password?token=${resetToken}&role=${role}`;

    console.log('Password reset link generated:', resetLink);

    res.json({ 
      message: 'Password reset link sent successfully',
      resetLink: resetLink, // Remove this in production
      note: 'In production, this link would be sent via email'
    });

  } catch (err) {
    console.error('Error requesting password reset:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Find user
    const user = await User.findOne({ _id: tokenData.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Token is valid',
      username: user.username,
      role: user.role
    });

  } catch (err) {
    console.error('Error verifying reset token:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    // Find user
    const user = await User.findOne({ _id: tokenData.userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password_hash = newPasswordHash;
    await user.save();

    // Remove used token
    resetTokens.delete(token);

    res.json({ message: 'Password reset successfully' });

  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 
