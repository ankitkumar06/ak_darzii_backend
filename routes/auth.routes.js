
const route = require("express").Router();
const userAuthModule = require("../module/userAuthModule")

//email notifications

//subscription details api 
route.post('/signup',userAuthModule.signup);
route.post('/signin',userAuthModule.signin);
route.post('/forgot-password',userAuthModule.forgotPassword);
route.post('/reset-password/:token',userAuthModule.resetPassword);
route.get('/verify-reset-token/:token',userAuthModule.verifyResetToken);

// Protected route - Get current user
route.get('/me', userAuthModule.verifyToken, userAuthModule.getCurrentUser);

// User profile routes
route.get('/profile/:userId', userAuthModule.getUserProfile);
route.post('/update-profile/:userId', userAuthModule.updateProfile);

// Address management routes
route.post('/add-address/:userId', userAuthModule.addAddress);
route.post('/update-address/:userId', userAuthModule.updateAddress);
route.delete('/delete-address/:userId/:addressId', userAuthModule.deleteAddress);
route.post('/set-primary-address/:userId', userAuthModule.setPrimaryAddress);

module.exports = route
