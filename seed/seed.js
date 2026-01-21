require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const products = require('./products.json'); // see note above

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected. Seeding products...');
    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('Seed complete');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });