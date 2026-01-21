const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { sendForgotPasswordEmail, sendPasswordResetSuccessEmail } = require('../utils/emailService');
const { logErrorToDatabase, getErrorDetails } = require('../utils/errorLogger');

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
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email
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

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
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


