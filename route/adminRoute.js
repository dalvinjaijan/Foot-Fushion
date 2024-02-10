const express = require('express')
const adminRoute = express()
const adminController = require('../controller/adminController')
const validate=require('../middleware/adminAuth')
const categoryController=require('../controller/categoryController')
const productController=require('../controller/productController')
const multer=require('../multer/multer')



const session = require('express-session');
const cookieparser = require('cookie-parser');
adminRoute.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
  }));

  //view engine
  adminRoute.set('view engine','ejs')
  adminRoute.set('views','./views/admin')

  //parsing
  adminRoute.use(express.json())  
  adminRoute.use(express.urlencoded({extended:true}))   
  adminRoute.use(cookieparser())

  //login page 
  adminRoute.get('/',validate.requireAuth2,adminController.loadLogin) 
  adminRoute.post('/login',validate.requireAuth2,adminController.verifyLogin)
 //home page
  adminRoute.get('/dashboard',validate.requireAuth,adminController.loadDashboard)
  adminRoute.get('/logOut',adminController.logout)

  adminRoute.get('/users',validate.requireAuth,adminController.loadUsers)
  adminRoute.get('/unBlockUser',validate.requireAuth,adminController.unBlockUser)
  adminRoute.get('/blockUser',validate.requireAuth,adminController.blockUser)

  //category
  adminRoute.get('/category',validate.requireAuth,categoryController.loadCategory)
  adminRoute.get('/addCategory',validate.requireAuth,categoryController.loadAddCategory)
  adminRoute.post('/addCategory',validate.requireAuth,categoryController.createCategory)
  adminRoute.get('/editCategory',validate.requireAuth,categoryController.loadUpdateCategory)
  adminRoute.post('/editCategory',validate.requireAuth,categoryController.updateCategory)
  adminRoute.get('/unListCategory',validate.requireAuth,categoryController.unListCategory)
  adminRoute.get('/reListCategory',validate.requireAuth,categoryController.reListCategory)

  //Product

  adminRoute.get('/product',validate.requireAuth,productController.loadProduct)
  adminRoute.post('/addProduct',multer.upload,productController.createProduct)
  adminRoute.get('/displayProduct',validate.requireAuth,productController.displayProduct)
  adminRoute.get('/unListProduct',productController.unListProduct)
  adminRoute.get('/reListProduct',productController.reListProduct)
  adminRoute.get('/updateProduct',validate.requireAuth,productController.loadUpdateProduct)
  adminRoute.post('/updateProduct',multer.upload,productController.updateProduct)


  //order
  adminRoute.get('/orderList',validate.requireAuth,adminController.orderList)
  adminRoute.get('/orderDetails',validate.requireAuth,adminController.orderDetails)
  adminRoute.put('/orderStatus',adminController.changeStatus)  
  adminRoute.put('/cancelOrder',adminController.cancelOrder)











  module.exports=adminRoute