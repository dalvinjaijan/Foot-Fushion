const User=require("../model/userModel")
const otpHelper=require('../helpers/otpHelper')
const userHelper=require('../helpers/userHelper')
const Category=require('../model/categoryModel')
const Product=require('../model/productModel')
const Cart=require('../model/cartModel')

const bcrypt= require('bcrypt')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const maxAge = 3*24*60*60;
const createToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET_KEY,{
        expiresIn: maxAge
    })
}


// const securePassword = async(password)=>{
//     try{
//         const passwordHash = await bcrypt.hash(password,10)
//         return passwordHash
//     }catch(error){
//         console.log(error.message);
//     }
// }


const loadHome = async(req,res)=>{
    try {
      if(res.locals.user){
        const userId=res.locals.user._id
        const cart=await Cart.findOne({user:userId})
        if(cart){
          console.log("cart is there",cart)
          res.render('index',{cart:cart})
      }else{
        res.render('index')
      }
       
        }else{
          res.render('index',{cart:{cartItems:[]}})
        }
        
    } catch (error) {

        console.log(error.message); 
    }
}
const loadLogin=async(req,res)=>{
    try {
        
        if(res.locals.user!=null){
            res.redirect('/')
        }
        else{
        res.render('login')
        }
         
    } catch (error) {
        console.log(error.message)
    }
}

const loadRegister=async(req,res)=>{
    try {
        res.render('signup')
        
    } catch (error) {
        console.log(error.message)
    }

}
 const insertUser= async (req,res)=>{
    const email=req.body.email
    const mobileNumber = req.body.mno
    const existingUser = await User.findOne({email:email})
    if (!req.body.fname || req.body.fname.trim().length === 0) {
        return res.render("signup", { message: "Name is required" });
    }
    if (/\d/.test(req.body.fname) || /\d/.test(req.body.lname)) {
        return res.render("signup", { message: "Name should not contain numbers" });
      }
      const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|hotmail\.com)$/i;
    if (!emailRegex.test(email)){
        return res.render("signup", { message: "Email Not Valid" });
    }
    if(existingUser){
      return res.render("signup",{message:"Email already exists"})
    }
    const mobileNumberRegex = /^\d{10}$/;
    if (!mobileNumberRegex.test(mobileNumber)) {
        return res.render("signup", { message: "Mobile Number should have 10 digit" });

    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if(!passwordRegex.test(req.body.password)){
        return res.render("signup", { message: "Password Should Contain atleast 8 characters,one number and a special character" });
    }
    // console.log(req.body.password)
    // console.log(req.body.confpassword)


    if(req.body.password!=req.body.confPassword){
        return res.render("signup", { message: "Password and Confirm Password must be same" });
    }
   


   
    
    const otp = otpHelper.generateOTP();
    try {
        req.session.userData=req.body
        req.session.otp = otp 
        

    } catch (error) {
        console.log(error.message);
    }
    
    const mailSend =  otpHelper.mailer(req.body.email,otp)
    
    if(mailSend){
        res.render('verifyOtp', { email: req.body.email, otp });
    }else{
        res.status(500).send('Error sending OTP via email');
    }

 }



 const verifyOtp = async(req,res)=>{
    const otp = req.body.otp
    try {
    const userData = req.session.userData;
    console.log(req.session)
        const otpfrom = req.session.otp
        // console.log(otp,otpfrom,userData)
    if(otpfrom === otp){
    const spassword =await bcrypt.hash(userData.password,10)
        const user = new User({
            fname:userData.fname,
            lname:userData.lname,
            email:userData.email,
            mobile:userData.mno,
            password:spassword,
            is_admin:0
        })
        const userDataSave = await user.save()
        if(userDataSave){
            const token = createToken(user._id);
            res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
            res.redirect('/')
        }else{
            res.render('signup',{message:"Registration Failed"})
        }
      }else{
        res.render('verifyOtp',{ message: 'Wrong Otp' });

      }


    } catch (error) {
        console.log(error.message);
     
    }
}
const resendOTP = async (req, res) => {
    try {
      const userData = req.session.userData;
    const email = userData.email
     
  
      if (!userData) {
        res.status(400).json({ message: 'Invalid or expired session' });
      }
      const otp = otpHelper.generateOTP();

      const mailSend =  otpHelper.mailer(email,otp)
      
      if(mailSend)
      {
      res.render('verifyOtp',{ message: 'OTP resent successfully' });
      }else{
      res.render('verifyOtp',{ message: 'Failed to send otp' });

      }

    } catch (error) {
      console.error('Error: ', error);
      res.render('verifyOtp',{ message: 'Failed to send otp' });
    }
  };


  const verifyLogin = async(req,res)=>{
    const data = req.body;
    const result= await userHelper.verifyLogin(data);
    if(result.error){
        res.render('login',{message: result.error});

    }else{ 
        const token = result.token;
        res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.redirect('/');
      }

}

const error404 = async(req,res)=>{
    try {
      res.render('errorPages/error-404')
      
    } catch (error) {
      console.log(error.message);
      
    }
  }

  const displayProduct = async (req, res) => {
    try {
      const userId=res.locals.user._id
      
      const category = await Category.find({});
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit; // Calculate the number of products to skip
      const searchQuery = req.query.search || ''; // Get the search query from request query parameters
      const sortQuery = req.query.sort || 'default'; // Get the sort query from request query parameters (default value is 'default')
      const minPrice = parseFloat(req.query.minPrice); // Get the minimum price from request query parameters
      const maxPrice = parseFloat(req.query.maxPrice)

  
      // Build the search filter
      const searchFilter = {
        $and: [
          { isListed: true },
          { isProductListed: true },
          {
            $or: [
              { name: { $regex: new RegExp(searchQuery, 'i') } },
            ],
          },
        ],
      };
      if (!isNaN(minPrice) && !isNaN(maxPrice)) {
        searchFilter.$and.push({ price: { $gte: minPrice, $lte: maxPrice } });
      }

      let sortOption = {};
      if (sortQuery === 'price_asc' ||sortQuery === 'default' ) {
        sortOption = { price: 1 }; 
      } else if (sortQuery === 'price_desc') {
        sortOption = { price: -1 }; 
      }
  
      const totalProducts = await Product.countDocuments(searchFilter); // Get the total number of products matching the search query
      const totalPages = Math.ceil(totalProducts / limit); // Calculate the total number of pages
  
      const products = await Product.find(searchFilter)
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .populate('category')
        console.log(userId);
        const cart= await Cart.findOne({user:userId})
       

    if(searchQuery!=''){
        res.render('categoryShop',{product: products,category, currentPage: page, totalPages })

    }else{
      if(cart){
        res.render('shop', { product: products, category, currentPage: page, totalPages,cart:cart });
      }
      else{
        res.render('shop', { product: products, category, currentPage: page, totalPages });
      }
        

    }
  
     
    } catch (error) {
      console.log(error.message);
      res.redirect('/error-404')

    }
  };

 
const logout=async(req,res)=>{
  console.log("hi")
  res.cookie('jwt','',{maxAge:1})
  res.redirect('/')
}












module.exports={
    loadHome,
    loadLogin,
    loadRegister,
    insertUser,
    verifyOtp,
    resendOTP,
    verifyLogin,
    error404,
    displayProduct,
    logout    
}