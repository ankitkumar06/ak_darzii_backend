const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendForgotPasswordEmail, sendPasswordResetSuccessEmail } = require('../utils/emailService');
const { logErrorToDatabase, getErrorDetails } = require('../utils/errorLogger');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'your-secret-key-change-in-env',
    { expiresIn: '7d' }
  );
};

// Sign Up
exports.signup = async(req,res,next)=>{
  try {
    const { name, email, password, phone, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Phone number must be at least 10 digits' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      name,
      phone,
      email: email.toLowerCase(),
      password: hashedPassword,
      lastLogin: new Date()
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Set token as httpOnly cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/' // Ensure cookie is sent for all paths
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        profileImage: user.profileImage,
        addresses: user.addresses || [],
        primaryAddressId: user.primaryAddressId
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    await logErrorToDatabase({
      errorType: 'Signup Error',
      ...getErrorDetails(error, null, {
        email: req?.body?.email || null,
        phone: req?.body?.phone || null,
        severity: 'high'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Sign In
exports.signin = async(req,res,next)=>{
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Set token as httpOnly cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/' // Ensure cookie is sent for all paths
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses,
        primaryAddressId: user.primaryAddressId
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    await logErrorToDatabase({
      errorType: 'Signin Error',
      ...getErrorDetails(error, null, {
        email: req?.body?.email || null,
        severity: 'high'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Logout
exports.logout = async (req, res) => {
  try {
    // Clear the authToken cookie
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/' // Must match the path used when setting the cookie
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully!'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: 'If this email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiry (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpiry = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Send email
    const emailResult = await sendForgotPasswordEmail(user.email, resetToken, resetUrl);

    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'Password reset link has been sent to your email'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    await logErrorToDatabase({
      errorType: 'Forgot Password Error',
      ...getErrorDetails(error, null, {
        email: req?.body?.email || null,
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    // Validation
    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Hash the token from URL
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    // Send success email
    await sendPasswordResetSuccessEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    await logErrorToDatabase({
      errorType: 'Reset Password Error',
      ...getErrorDetails(error, null, {
        severity: 'high'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check if token exists and is not expired
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Verify token error:', error);
    await logErrorToDatabase({
      errorType: 'Verify Token Error',
      ...getErrorDetails(error, null, {
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update Address
exports.updateAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { addressId, fullName, phone, street, city, state, zipCode, country, type } = req.body;

    // Validation
    if (!addressId || !fullName || !phone || !street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Find user and update address
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find the address to update
    const addressIndex = user.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Update the address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      type: type || 'home'
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully!',
      address: user.addresses[addressIndex]
    });
  } catch (error) {
    console.error('Update address error:', error);
    await logErrorToDatabase({
      errorType: 'Update Address Error',
      ...getErrorDetails(error, null, {
        userId: req?.params?.userId || null,
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Set Primary Address
exports.setPrimaryAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { addressId } = req.body;

    // Validation
    if (!addressId) {
      return res.status(400).json({ success: false, message: 'Address ID is required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if address exists
    const addressExists = user.addresses.some(addr => addr.id === addressId);
    if (!addressExists) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Update all addresses: set isDefault to true only for the selected address
    user.addresses = user.addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));

    user.primaryAddressId = addressId;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Primary address updated successfully!',
      addresses: user.addresses,
      primaryAddressId: user.primaryAddressId
    });
  } catch (error) {
    console.error('Set primary address error:', error);
    await logErrorToDatabase({
      errorType: 'Set Primary Address Error',
      ...getErrorDetails(error, null, {
        userId: req?.params?.userId || null,
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get User Profile
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses || [],
        primaryAddressId: user.primaryAddressId
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    await logErrorToDatabase({
      errorType: 'Get Profile Error',
      ...getErrorDetails(error, null, {
        userId: req?.params?.userId || null,
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Add Address
exports.addAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, phone, street, city, state, zipCode, country, type } = req.body;

    // Validation
    if (!fullName || !phone || !street || !city || !state || !zipCode || !country) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create new address
    const newAddress = {
      id: Date.now().toString(),
      fullName,
      phone,
      street,
      city,
      state,
      zipCode,
      country,
      type: type || 'home',
      isDefault: user.addresses.length === 0
    };

    user.addresses.push(newAddress);

    // Set as primary if it's the first address
    if (newAddress.isDefault) {
      user.primaryAddressId = newAddress.id;
    }

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully!',
      address: newAddress
    });
  } catch (error) {
    console.error('Add address error:', error);
    await logErrorToDatabase({
      errorType: 'Add Address Error',
      ...getErrorDetails(error, null, {
        userId: req?.params?.userId || null,
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Delete Address
exports.deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if address exists
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);

    // If deleted address was primary, set the first remaining address as primary
    if (deletedAddress.isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      user.primaryAddressId = user.addresses[0].id;
    } else if (user.addresses.length === 0) {
      user.primaryAddressId = null;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully!',
      addresses: user.addresses,
      primaryAddressId: user.primaryAddressId
    });
  } catch (error) {
    console.error('Delete address error:', error);
    await logErrorToDatabase({
      errorType: 'Delete Address Error',
      ...getErrorDetails(error, null, {
        userId: req?.params?.userId || null,
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, profileImage } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses || [],
        primaryAddressId: user.primaryAddressId
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    await logErrorToDatabase({
      errorType: 'Update Profile Error',
      ...getErrorDetails(error, null, {
        userId: req?.params?.userId || null,
        severity: 'medium'
      })
    });
    res.status(500).json({ success: false, message: error.message });
  }
}

// JWT Verification Middleware
exports.verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookie
    let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
    const userId = decoded.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid token - user not found' });
    }
   
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// Get Current User
exports.getCurrentUser = async (req, res) => {
  console.log(req.cookies.authToken)
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
    const userId = decoded.id;
    const user = await User.findById(userId);

console.log("Current User ID:", userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses || [],
        primaryAddressId: user.primaryAddressId
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

