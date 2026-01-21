require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var mongo = require("./connection");

// const Product = require('./models/Product');
// const Order = require('./models/Order');
const app = express();

var whitelist = ['http://localhost:3001','http://localhost:3000','http://localhost:5001','http://localhost:5000'];
const corsOpts = {
 //origin: true,
  origin: whitelist,
  credentials: true,
   methods: [
    'GET',
    'POST',
	'PATCH',
	'DELETE',
	  'OPTIONS'
   ],

optionsSuccessStatus:200,  
  preflightContinue: false, 
  exposedHeaders: ['SET-COOKIE'],
  
};


app.use(cors(corsOpts));



var productRouter = require('./routes/product.routes');
var authRouter = require('./routes/auth.routes');



app.use(express.json());

 mongo.connection();
 app.listen(5000, () => console.log(`Server listening on 5000`));


 app.use('/auth',authRouter);
 app.use('/products',productRouter);


// /* Routes */

// // GET /api/products
// // optional query: category, q (search)
// app.get('/api/products', async (req, res) => {
//   const { category, q } = req.query;
//   const filter = {};
//   if (category && category !== 'all') filter.category = category;
//   if (q) filter.$or = [
//     { name: new RegExp(q, 'i') },
//     { description: new RegExp(q, 'i') },
//     { fullDescription: new RegExp(q, 'i') }
//   ];
//   const products = await Product.find(filter).sort({ id: 1 });
//   res.json(products);
// });

// // GET /api/products/:id
// app.get('/api/products/:id', async (req, res) => {
//   const product = await Product.findOne({ id: Number(req.params.id) });
//   if (!product) return res.status(404).json({ message: 'Product not found' });
//   res.json(product);
// });

// // GET /api/categories
// app.get('/api/categories', async (req, res) => {
//   const cats = await Product.distinct('category');
//   res.json(cats.filter(Boolean));
// });

// // POST /api/orders
// app.post('/api/orders', async (req, res) => {
//   try {
//     const { items, subtotal, shipping, tax, total, customer } = req.body;
//     const order = new Order({ items, subtotal, shipping, tax, total, customer });
//     await order.save();
//     res.status(201).json({ message: 'Order placed', orderId: order._id });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Failed to place order' });
//   }
// });

// app.listen(PORT, () => console.log(`Server listening on ${PORT}`));