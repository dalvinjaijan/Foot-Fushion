
const jwt = require('jsonwebtoken')
const adminHelper=require('../helpers/adminHelper')
const User=require('../model/userModel')
const orderHelper=require('../helpers/orderHelper')
const Order=require('../model/orderModel')
const Category=require('../model/categoryModel')
const Product=require('../model/productModel')



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

const loadDashboard = async(req,res)=>{
  try {
    const orders = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $match: {
          "orders.orderStatus": "Delivered"  // Consider only completed orders
        }
      },
      {
        $group: {
          _id: null,
          totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
          count: { $sum: 1 }
        }
      }

    ])
    console.log(orders);


    const categorySales = await Order.aggregate([
      { $unwind: "$orders" },
      { $unwind: "$orders.productDetails" },
      {
        $match: {
          "orders.orderStatus": "Delivered",
        },
      },
      {
        $project: {
          CategoryId: "$orders.productDetails.category",
          totalPrice: {
            $multiply: [
              { $toDouble: "$orders.productDetails.productPrice" },
              { $toDouble: "$orders.productDetails.quantity" },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$CategoryId",
          PriceSum: { $sum: "$totalPrice" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      {
        $unwind: "$categoryDetails",
      },
      {
        $project: {
          categoryName: "$categoryDetails.name",
          PriceSum: 1,
          _id: 0,
        },
      },
    ]);


    const salesData = await Order.aggregate([ 
      { $unwind: "$orders" }, 
      {
        $match: {
          "orders.orderStatus": "Delivered"  // Consider only completed orders
        }
      },
      {  
        $group: {
          _id: {
            $dateToString: {  // Group by the date part of createdAt field
              format: "%Y-%m-%d",
              date: "$orders.createdAt"
            }
          },
          dailySales: { $sum: { $toInt: "$orders.totalPrice" } }  // Calculate the daily sales
        } 
      }, 
      {
        $sort: {
          _id: 1  // Sort the results by date in ascending order
        }
      }
    ])

    const salesCount = await Order.aggregate([
      { $unwind: "$orders" },
      {
        $match: {
          "orders.orderStatus": "Delivered"  
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {  // Group by the date part of createdAt field
              format: "%Y-%m-%d",
              date: "$orders.createdAt"
            }
          },
          orderCount: { $sum: 1 }  // Calculate the count of orders per date
        }
      },
      {
        $sort: {
          _id: 1  // Sort the results by date in ascending order
        }
      }
    ])



    const categoryCount  = await Category.find({}).count()

    const productsCount  = await Product.find({}).count()

    const onlinePay = await adminHelper.getOnlineCount()
    console.log('onlinepay',onlinePay)
    const walletPay = await adminHelper.getWalletCount()
    const codPay = await adminHelper.getCodCount()
    const RazorpayandWallet = await adminHelper.RazorpayandWalletCount() 


    const latestorders = await Order.aggregate([
      {$unwind:"$orders"},
      {$sort:{
        'orders.createdAt' :-1
      }},
      {$limit:10}
    ]) 


      res.render('dashboard',{orders,productsCount,categoryCount,
        onlinePay,salesData,order:latestorders,salesCount,
        walletPay,codPay,categorySales,RazorpayandWallet})
  } catch (error) {
      console.log(error)
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
  const getSalesReport=async(req,res)=>{
    const report= await adminHelper.getSalesReport()
    let details = [];
    const getDate = (date) => {
      const orderDate = new Date(date);
      const day = orderDate.getDate();
      const month = orderDate.getMonth() + 1;
      const year = orderDate.getFullYear();
      return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
        isNaN(year) ? "0000" : year
      }`;
    };
  
    report.forEach((orders) => {
      details.push(orders.orders);
    });
   
    const totalSum = details.reduce((sum, detail) => sum + parseFloat(detail.totalPrice), 0);
   
  
    res.render('salesReport',{details,getDate,totalSum})
  }
  const postSalesReport =  (req, res) => {
    let details = [];
    const getDate = (date) => {
      const orderDate = new Date(date);
      const day = orderDate.getDate();
      const month = orderDate.getMonth() + 1;
      const year = orderDate.getFullYear();
      return `${isNaN(day) ? "00" : day} - ${isNaN(month) ? "00" : month} - ${
        isNaN(year) ? "0000" : year
      }`;
    };
  
    adminHelper.postReport(req.body).then((orderData) => {
      orderData.forEach((orders) => {
        details.push(orders.orders);
      });
      const totalSum = details.reduce((sum, detail) => sum + parseFloat(detail.totalPrice), 0);
      res.render("salesReport", {details,getDate,totalSum});
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
    returnOrder,
    getSalesReport,
    postSalesReport  
}