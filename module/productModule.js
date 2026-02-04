const  Mongoose  = require("mongoose");
const fs = require("fs");
const Products = require("../models/Product");
const axios = require("axios");

exports.getproduct = async (req, res, next) => {
  try {
    // Support pagination and optional filters
    const { page = 1, limit = 20, category, search } = req.body || {};

    const query = {};
    if (category && category !== 'all') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Products.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const data = await Products.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit, 10));

    res.status(200).json({ success: true, data, total, page: parseInt(page, 10), totalPages });
  } catch (error) {
    console.log(error, 'error........');
    res.status(500).send({ error: 'Internal server error', err: error.message });
  }
};