
const jwt = require('jsonwebtoken')
const adminHelper=require('../helpers/adminHelper')
const User=require('../model/userModel')
const orderHelper=require('../helpers/orderHelper')


require('dotenv').config()

const maxAge = 3*24*60*60;
const createToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET_KEY,{
        expiresIn: maxAge
    })
}



const  loadLogin= async(req,res)=>{
    try {
        res.render('login')
    } catch (error) {
        console.log(error.message)
    }
}


const verifyLogin=async(req,res)=>{
    const data=req.body
    const result= await adminHelper.verifyLogin(data);
   // console.log(result)
    if(result.error){
        res.render('login',{message: result.error});

    }else{ 
        const token = result.token;
        res.cookie('jwtAdmin', token, { httpOnly: true, maxAge: maxAge * 1000 });
        res.redirect('/admin/dashboard');
      }

}

const loadDashboard=async(req,res)=>{
    try {
        res.render('dashboard')
    } catch (error) {
       console.log(error.message) 
    }
}
const logout = (req,res) =>{
    res.cookie('jwtAdmin', '' ,{maxAge : 1})
    res.redirect('/admin')
  }

  const loadUsers = async (req, res) => {
    try {
        var search = ''
        if (req.query.search) {
            search = req.query.search
        }
        
        const usersData = await User.find({is_admin:0,
            $or: [
                { fname: { $regex: '.*' + search + '.*' } },
                { lname: { $regex: '.*' + search + '.*' } },
                { email: { $regex: '.*' + search + '.*' } },
                 { mno: { $regex: '.*' + search + '.*' } },
                 
            ]
        });
  
        res.render('users', {
            user: usersData
        });
    } catch (error) {
        console.log(error.message);
    }
  }
  const unBlockUser = async(req,res)=>{
    try {
      const id = req.query.id
      await User.findByIdAndUpdate({_id:id},{$set:{is_Blocked:false}})
      res.redirect('/admin/users')
    } catch (error) {
      console.log(error.message)
    }
  }

  const blockUser=async(req,res)=>{
    try {
        const id=req.query.id
        await User.findByIdAndUpdate({_id:id},{$set:{is_Blocked:true}})
        res.redirect('/admin/users')
    } catch (error) {
        console.log(error.message)
    }
  }

  const orderList = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
  
    orderHelper
      .getOrderList(page, limit)
      .then(({ orders, totalPages, page: currentPage, limit: itemsPerPage }) => {
        res.render("orderList", {
          orders,
          totalPages,
          page: currentPage,
          limit: itemsPerPage,
        });
      })
      .catch((error) => {
        console.log(error.message);
      });
  };
  const orderDetails = async (req,res)=>{
    try {
      const id = req.query.id
      adminHelper.findOrder(id).then((orders) => {
        const address = orders[0].shippingAddress
        const products = orders[0].productDetails 
        const reason = orders[0].reason
        
        res.render('orderDetails',{orders,address,products,reason}) 
      });
        
    } catch (error) {
      console.log(error.message);
    }
  

  }

  const changeStatus = async(req,res)=>{
    const orderId = req.body.orderId
    const status = req.body.status
    adminHelper.changeOrderStatus(orderId, status).then((response) => {
      res.json(response);
    });
  
    
  }


  const cancelOrder = async(req,res)=>{
    const userId = req.body.userId
  
    const orderId = req.body.orderId
    const status = req.body.status
  
    adminHelper.cancelOrder(orderId,userId,status).then((response) => {
      res.send(response);
    });
  
  }
  
  const returnOrder = async(req,res)=>{
    const orderId = req.body.orderId
    const status = req.body.status
    const userId = req.body.userId
  
  
    adminHelper.returnOrder(orderId,userId,status).then((response) => {
      res.send(response);
    });
  
  }  


module.exports={
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    loadUsers,
    unBlockUser,
    blockUser,
    orderList,
    orderDetails,
    changeStatus,
    cancelOrder,
    returnOrder
}