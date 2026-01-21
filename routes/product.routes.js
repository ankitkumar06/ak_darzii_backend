const route = require("express").Router();
const productModule = require("../module/productModule")

//email notifications

//subscription details api 
route.post('/getproduct',productModule.getproduct);


module.exports = route