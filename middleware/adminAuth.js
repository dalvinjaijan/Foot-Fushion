const jwt = require('jsonwebtoken')
const User = require('../model/userModel')
require('dotenv').config()
const requireAuth = (req, res, next) => {
    const token = req.cookies.jwtAdmin;
  
    // check json web token exists & is verified
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          res.redirect('/admin');
        } else {
          next();
        }
      });
    } else {
      res.redirect('/admin');
    }
  };

  const requireAuth2 = (req, res, next) => {
    const token = req.cookies.jwtAdmin;
  
    // check json web token exists & is verified
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
        if (err) {
          console.log(err.message);
          next();
        } else {
          res.redirect('/admin/dashboard');

        }
      });
    } else {
      next()
    }
  };
  module.exports={
    requireAuth,
    requireAuth2
  }