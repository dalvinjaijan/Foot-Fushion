const express=require("express")
const userRoute=express()
const userController=require('../controller/userController')
const productController=require('../controller/productController')
const categoryController=require('../controller/categoryController')
const profileController=require('../controller/profileController')
const cartController=require('../controller/cartController')
const orderController=require('../controller/orderController')
const validate=require('../middleware/authMiddleware')
userRoute.use(express.json())
userRoute.use(express.urlencoded({extended:true}))
const session = require('express-session');
const cookie = require('cookie-parser')
const nocache = require('nocache')
userRoute.use(nocache())


userRoute.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }));

userRoute.set('view engine','ejs')
userRoute.set('views','./views/users')
userRoute.use(cookie())

userRoute.all('*',validate.checkUser)
//load home
userRoute.get('/',userController.loadHome)
//signup
userRoute.get('/signup',userController.loadRegister)
userRoute.post('/signup',userController.insertUser)

userRoute.post('/verifyOtp',userController.verifyOtp)
//resend OTP
userRoute.get('/resendOtp',userController.resendOTP)
//login
userRoute.get('/login',userController.loadLogin)
userRoute.post('/login',userController.verifyLogin)
userRoute.get('/logout',userController.logout)

userRoute.get('/shop',userController.displayProduct)
userRoute.get('/productPage',productController.productPage)
userRoute.get('/categoryShop',categoryController.categoryPage)

userRoute.get('/error-404',userController.error404)

//profile
userRoute.get('/profileDetails',validate.requireAuth,profileController.profile)
userRoute.post('/editInfo',validate.requireAuth,profileController.updateProfile)
userRoute.post('/editPassword',validate.requireAuth,profileController.updatePassword)

userRoute.get('/profileAddress',validate.requireAuth,profileController.profileAddress)
userRoute.post('/submitAddress',validate.requireAuth,profileController.submitAddress)
userRoute.post('/updateAddress',validate.requireAuth,profileController.submitAddress)
//  userRoute.get('/deleteAddress',validate.requireAuth,profileController.deleteAddress)




//cart
userRoute.get('/cart',validate.requireAuth,cartController.loadCart)
userRoute.post('/addToCart/:id',validate.requireAuth,cartController.addToCart)
userRoute.put('/change-product-quantity',cartController.updateQuantity)
userRoute.delete('/delete-product-cart',cartController.deleteProduct)

userRoute.get('/checkOut',validate.requireAuth,orderController.checkOut)
userRoute.post('/checkOut',validate.requireAuth,orderController.postCheckOut)
userRoute.post('/checkOutAddress',validate.requireAuth,profileController.checkOutAddress)

userRoute.post('/changeDefaultAddress',orderController.changePrimary)










module.exports=userRoute
