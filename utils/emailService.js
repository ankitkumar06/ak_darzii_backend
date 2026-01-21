const nodemailer = require('nodemailer');

// Validate required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('Warning: EMAIL_USER or EMAIL_PASSWORD not set in .env file');
}

// Configure your email service
// For Gmail: Use an app-specific password (not your regular password)
// Go to https://myaccount.google.com/apppasswords to generate one
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  pool: {
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 4000,
    rateLimit: 14
  }
});

// Send forgot password email
const sendForgotPasswordEmail = async (email, resetToken, resetUrl) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - React Vite Shop',
      html: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password. Please click the link below to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
        <hr>
        <p><small>React Vite Shop - E-commerce Platform</small></p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
};

// Send password reset success email
const sendPasswordResetSuccessEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Successful - React Vite Shop',
      html: `
        <h2>Password Reset Successful</h2>
        <p>Hi ${name},</p>
        <p>Your password has been successfully reset.</p>
        <p>You can now log in with your new password.</p>
        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/signin" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Go to Sign In
          </a>
        </p>
        <p>If you did not request this change, please contact our support team immediately.</p>
        <hr>
        <p><small>React Vite Shop - E-commerce Platform</small></p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Success email sent:', info.response);
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendForgotPasswordEmail,
  sendPasswordResetSuccessEmail
};
