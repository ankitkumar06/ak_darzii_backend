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

var whitelist = ['http://localhost:3001','http://localhost:3000','http://localhost:5001','http://localhost:5000', 'http://localhost:5173','https://your-app.vercel.app'];
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
app.use(cookieParser());

// Increase payload limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

 mongo.connection();
 app.listen(5000, () => console.log(`Server listening on 5000`));

 var productRouter = require('./routes/product.routes');
 var authRouter = require('./routes/auth.routes');
 var bookmarkRouter = require('./routes/bookmark.routes');

 app.use('/auth',authRouter);
 app.use('/products',productRouter);
 app.use('/bookmark',bookmarkRouter);


