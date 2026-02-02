const route = require("express").Router();
const ratingModule = require("../module/ratingModule");
const userAuthModule = require("../module/userAuthModule");

// Get product ratings (average and all ratings) - Public
route.get('/product/:productId', ratingModule.getProductRatings);

// Get user's rating for a product - Protected
// route.get('/user/product/:productId', userAuthModule.verifyToken, ratingModule.getUserProductRating);
route.get('/user/product/:productId',  ratingModule.getUserProductRating);

// Add or update rating - Protected
// route.post('/add', userAuthModule.verifyToken, ratingModule.addOrUpdateRating);
route.post('/add', ratingModule.addOrUpdateRating);

// Get all ratings for logged-in user - Protected
// route.get('/user/all', userAuthModule.verifyToken, ratingModule.getUserRatings);
route.get('/user/all',  ratingModule.getUserRatings);

// Delete user rating - Protected
// route.delete('/delete/:productId', userAuthModule.verifyToken, ratingModule.deleteRating);
route.delete('/delete/:productId',  ratingModule.deleteRating);

module.exports = route;
