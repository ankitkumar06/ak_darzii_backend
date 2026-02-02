const Rating = require('../models/Rating');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Get product ratings (average and count)
exports.getProductRatings = async (req, res) => {
  try {
    const { productId } = req.params;

    const ratings = await Rating.find({ productId });
    
    if (ratings.length === 0) {
      return res.status(200).json({
        success: true,
        productId,
        averageRating: 0,
        totalRatings: 0,
        ratings: []
      });
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / ratings.length).toFixed(1);

    res.status(200).json({
      success: true,
      productId,
      averageRating: parseFloat(averageRating),
      totalRatings: ratings.length,
      ratings: ratings.map(r => ({
        userId: r.userId,
        rating: r.rating,
        review: r.review,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get product ratings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's rating for a specific product
exports.getUserProductRating = async (req, res) => {
  try {
    const { productId } = req.params;
     // Get token from Authorization header or cookie
        let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;
    
        if (!token) {
          return res.status(401).json({ success: false, message: 'No token provided' });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
        const userId = decoded.id;
    // const userId = req.userId;

    const rating = await Rating.findOne({ userId, productId });

    if (!rating) {
      return res.status(200).json({
        success: true,
        hasRated: false,
        rating: null
      });
    }

    res.status(200).json({
      success: true,
      hasRated: true,
      rating: rating.rating,
      review: rating.review
    });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add or update user rating for a product
exports.addOrUpdateRating = async (req, res) => {
  try {
    const { productId, productName, rating, review } = req.body;
    // const userId = req.userId;
     // Get token from Authorization header or cookie
        let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;
    
        if (!token) {
          return res.status(401).json({ success: false, message: 'No token provided' });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
        const userId = decoded.id;

    // Validation
    if (!productId || !productName || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID, name, and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Check if rating already exists
    let ratingDoc = await Rating.findOne({ userId, productId });

    if (ratingDoc) {
      // Update existing rating
      ratingDoc.rating = rating;
      ratingDoc.review = review || '';
      ratingDoc.updatedAt = new Date();
      await ratingDoc.save();

      return res.status(200).json({
        success: true,
        message: 'Rating updated successfully!',
        rating: {
          rating: ratingDoc.rating,
          review: ratingDoc.review
        }
      });
    }

    // Create new rating
    ratingDoc = new Rating({
      userId,
      productId,
      productName,
      rating,
      review: review || ''
    });

    await ratingDoc.save();

    res.status(201).json({
      success: true,
      message: 'Rating added successfully!',
      rating: {
        rating: ratingDoc.rating,
        review: ratingDoc.review
      }
    });
  } catch (error) {
    console.error('Add/Update rating error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all ratings for a user
exports.getUserRatings = async (req, res) => {
  try {
    // Get token from Authorization header or cookie
    let token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
    const userId = decoded.id;

    const ratings = await Rating.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      ratings: ratings.map(r => ({
        productId: r.productId,
        productName: r.productName,
        rating: r.rating,
        review: r.review,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user rating
exports.deleteRating = async (req, res) => {
  try {
    const { productId } = req.params;
    // const userId = req.userId;
     // Get token from Authorization header or cookie
        let token = req.headers.authorization?.split(' ')[1] || req.cookies.authToken;
    
        if (!token) {
          return res.status(401).json({ success: false, message: 'No token provided' });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');
        const userId = decoded.id;

    const result = await Rating.deleteOne({ userId, productId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rating not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully!'
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
