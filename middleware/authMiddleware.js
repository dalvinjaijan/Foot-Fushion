const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
require('dotenv').config(); // Module to Load environment variables from .env file

const requireAuth = async(req, res, next) => {
  const token = req.cookies.jwt;
  if(res.locals.user){
    const userId=res.locals.user._id
    const user=await User.findOne({_id:userId})
  
  
  


  // check json web token exists & is verified
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else if(user.is_Blocked==true && user.is_admin==0){
        res.cookie('jwt','',{maxAge:1})
        res.redirect('/')
        }else{
          next()
        }
      
    });
  } else {
    res.redirect('/login');
  }
}else{
  console.log("no user found");
  res.redirect('/login')
}
}

// check current user
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token,  process.env.JWT_SECRET_KEY, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        const user = await User.findById(decodedToken.id);
        res.locals.user = user;
        if(user.is_Blocked==true && user.is_admin==0){
          res.cookie('jwt','',{maxAge:1})
          res.redirect('/')
        }
        else{
          next()
        }
        ;
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};


module.exports = { requireAuth, checkUser };