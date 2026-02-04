const Order = require('../models/Order');
const jwt = require('jsonwebtoken');

// Get all orders for the authenticated user
exports.getUserOrders = async (req, res) => {
  try {
    // Get token from Authorization header or cookie
     let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;
        
      if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
      const userId = decoded.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('Get user orders error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get single order by ID (only if belongs to authenticated user)
exports.getOrderById = async (req, res) => {
  try {
    let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;
        
      if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
      const userId = decoded.id;
      
    const { id } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (String(order.userId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('Get order by id error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create a new order for authenticated user
exports.createOrder = async (req, res) => {
  try {
   
    // Get token from Authorization header or cookie
     let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;
        
      if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
      const userId = decoded.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { items, subtotal, shipping = 0, tax = 0, total, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items required' });
    }

    const order = new Order({ userId, items, subtotal, shipping, tax, total, customer });
    await order.save();

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};