const  Mongoose  = require("mongoose");
const fs = require("fs");
const Products = require("../models/Product");
const axios = require("axios");

exports.getproduct = async(req,res,next)=>{
    try {

        let data = await Products.find({});
        res.status(200).send({data});
    
  } catch (error) {
    console.log(error,"error........")
      res.status(500).send({error:'Error updating interest - internal server error',err:error.message});
  }
  }