
const route = require("express").Router();
const userAuthModule = require("../module/userAuthModule")

//email notifications

//subscription details api 
route.post('/signup',userAuthModule.signup);
route.post('/signin',userAuthModule.signin);
route.post('/forgot-password',userAuthModule.forgotPassword);
route.post('/reset-password/:token',userAuthModule.resetPassword);
route.get('/verify-reset-token/:token',userAuthModule.verifyResetToken);


module.exports = route

