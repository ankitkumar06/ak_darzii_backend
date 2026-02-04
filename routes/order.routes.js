const express = require('express');
const route = express.Router();
const orderModule = require('../module/orderModule');
const userAuthModule = require('../module/userAuthModule');

// Create a new order for authenticated user
// route.post('/', userAuthModule.verifyToken, orderModule.createOrder);
route.post('/', orderModule.createOrder);

// Get all orders for current authenticated user
route.post('/user', orderModule.getUserOrders);

// Get a single order by _id (must belong to user)
route.post('/:id', orderModule.getOrderById);

module.exports = route;