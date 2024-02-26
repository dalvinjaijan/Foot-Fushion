const User=require('../model/userModel')
const bcrypt= require('bcrypt')
const jwt = require('jsonwebtoken')
const Order=require('../model/orderModel')
const Product=require('../model/productModel')
const { ObjectId } = require("mongodb");

require('dotenv').config();
const maxAge = 3*24*60*60;
const createToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET_KEY,{
        expiresIn: maxAge
    })
}
const getOnlineCount =  () => {
  return new Promise(async (resolve, reject) => {
    const response = await Order.aggregate([
      {
        $unwind: "$orders",
      },
      {
        $match: {
          "orders.paymentMethod": "razorpay",
          "orders.orderStatus": "Delivered" 

        },
      },
      {
        $group:{
          _id: null,
        totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
        count: { $sum: 1 }

        }

      }

    ]);
    resolve(response);
  });
}
const getWalletCount =  () => {
  return new Promise(async (resolve, reject) => {
    const response = await Order.aggregate([
      {
        $unwind: "$orders",
      },
      {
        $match: {
          "orders.paymentMethod": "wallet",
          "orders.orderStatus": "Delivered" 

        },
      },
      {
        $group:{
          _id: null,
        totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
        count: { $sum: 1 }

        }

      }

    ]);
    resolve(response);
  });
}

const getCodCount =  () => {
  return new Promise(async (resolve, reject) => {
    const response = await Order.aggregate([
      {
        $unwind: "$orders",
      },
      {
        $match: {
          "orders.paymentMethod": "cod",
          "orders.orderStatus": "Delivered" 

        },
      },
      {
        $group:{
          _id: null,
        totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
        count: { $sum: 1 }

        }

      }

    ]);
    resolve(response);
  });
}

const RazorpayandWalletCount =  () => {
  return new Promise(async (resolve, reject) => {
    const response = await Order.aggregate([
      {
        $unwind: "$orders",
      },
      {
        $match: {
          "orders.paymentMethod": "razorpayandwallet",
          "orders.orderStatus": "Delivered" 

        },
      },
      {
        $group:{
          _id: null,
        totalPriceSum: { $sum: { $toInt: "$orders.totalPrice" } },
        count: { $sum: 1 }

        }

      }

    ]);
    resolve(response);
  });
}


const verifyLogin= (data)=>{
    return new Promise((resolve,reject)=>{
        User.findOne({email:data.email}) 
         .then((userData)=>{
            if (userData){
                if(userData.is_admin==1){
                    bcrypt.compare(data.password,userData.password)
              .then((passwordMatch)=>{
                if(passwordMatch){
                    
                        const token = createToken(userData._id)
                        resolve({token})
                    
                    
                }else{
                    resolve({ error: "Email and Password are Incorrect" });
                }
            })
            .catch((error)=>{
                reject(error);
            })
                }else{
                    resolve({ error: "Email and Password are Incorrect" }); 

                }
        }
            else{
                resolve({ error: "Email and Password are Incorrect" });
            }
        })
        .catch((error)=>{
            reject(error);
        })
     
    })
}

const findOrder  = (orderId) => {
    try {
      return new Promise((resolve, reject) => {
        Order.aggregate([
          {
            $match: {
              "orders._id": new ObjectId(orderId)
            },
          },
          { $unwind: "$orders" },
        ]).then((response) => {
          let orders = response
            .filter((element) => {
              if (element.orders._id == orderId) {
                return true;
              }
              return false;
            })
            .map((element) => element.orders);
  
          resolve(orders);
        });
      });
    } catch (error) {
      console.log(error.message);
    }
  }
  const changeOrderStatus = (orderId, status) => {
    try {
      return new Promise((resolve, reject) => {
        Order.updateOne(
          { "orders._id": new ObjectId(orderId) },
          {
            $set: { "orders.$.orderStatus": status },
          }
        ).then((response) => {
          resolve({status:true,orderStatus:status});
        });
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  const cancelOrder = (orderId, userId, status) => {
    try {
      
      return new Promise(async (resolve, reject) => {
        Order.findOne({ "orders._id": new ObjectId(orderId) }).then(async (orders) => {
          const order = orders.orders.find((order) => order._id == orderId);
          
          if (order.paymentMethod == 'cod') {
            if (status == 'Cancel Accepted') {
              Order.updateOne(
                { "orders._id": new ObjectId(orderId) },
                {
                  $set: {
                    "orders.$.cancelStatus": status,
                    "orders.$.orderStatus": status,
                    "orders.$.paymentStatus": "No Refund"
                  }
                }
              ).then(async (response) => {

                await addToStock(orderId, userId);
                resolve(response);
              });
            } else if (status == 'Cancel Declined') {
              Order.updateOne(
                { "orders._id": new ObjectId(orderId) },
                {
                  $set: {
                    "orders.$.cancelStatus": status,
                    "orders.$.orderStatus": status,
                    "orders.$.paymentStatus": "No Refund"
                  }
                }
              ).then(async (response) => {
                resolve(response);
              });
            }
          }else if(order.paymentMethod=='wallet'||order.paymentMethod=='razorpay'||order.paymentMethod=='razorpayandwallet'){
            
            if(status=='Cancel Declined'){
              Order.updateOne({"orders._id":new ObjectId(orderId)},
              {
                $set:{ "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "No Refund"
                }
              }).then((response)=>{
                resolve(response)
              })
            }else if(status=='Cancel Accepted'){
              Order.updateOne({"orders._id":new ObjectId(orderId)},
              {
                $set:{ "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "Refund Credited to Wallet"
                }
              }).then(async(response)=>{
                const user=await User.findOne({_id:userId})
                user.wallet +=parseInt(order.totalPrice)
                await user.save()
                const walletTransaction={
                  date:new Date(),
                  type:'Credit',
                  amount:order.totalPrice
                }
                const walletupdated= await User.updateOne(
                  {_id:userId},
                  {$push:{walletTransaction:walletTransaction}}
                  )
                  addToStock(orderId,userId)
                resolve(response)
              })
            }
          }
          
        });
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  const addToStock = async(orderId,userId)=>{
  
    Order.findOne({ "orders._id": new ObjectId(orderId) }).then(async(orders) => {
      const order = orders.orders.find((order) => order._id == orderId);
      const cartProducts = order.productDetails
      for(const cartProduct of cartProducts ){
        const productId = cartProduct.productId;
        const quantity = cartProduct.quantity;
      
        const product = await Product.findOne({_id:productId})
      
      
      
        await Product.updateOne({_id:productId},
          {$inc:{stock:quantity}}
          )
      
      }
      
    })



  }

  const returnOrder=async(orderId,userId,status)=>{
    try {
      return new Promise((resolve,reject)=>{
        Order.findOne({"orders._id":new ObjectId(orderId)}).then((orders)=>{
          const order=orders.orders.find((order)=>order._id==orderId)
          if(order.paymentMethod=='cod'){
            if(status=='Return Declined'){
              Order.updateOne({"orders._id":new ObjectId(orderId)},
              {
                $set:{ "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "No Refund"
                }
              }).then((response)=>{
                resolve(response)
              })
            }else if(status=='Return Accepted'){
              Order.updateOne({"orders._id":new ObjectId(orderId)},
              {
                $set:{ "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "Refund Credited to Wallet"
                }
              }).then(async(response)=>{
                const user=await User.findOne({_id:userId})
                user.wallet +=parseInt(order.totalPrice)
                await user.save()
                const walletTransaction={
                  date:new Date(),
                  type:'Credit',
                  amount:order.totalPrice
                }
                const walletupdated= await User.updateOne(
                  {_id:userId},
                  {$push:{walletTransaction:walletTransaction}}
                  )
                  addToStock(orderId,userId)
                resolve(response)
              })
            }
          }
          else if(order.paymentMethod=='wallet'||order.paymentMethod=='razorpay'||order.paymentMethod=='razorpayandwallet'){
            if(status=='Return Declined'){
              Order.updateOne({"orders._id":new ObjectId(orderId)},
              {
                $set:{ "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "No Refund"
                }
              }).then((response)=>{
                resolve(response)
              })
            }else if(status=='Return Accepted'){
              Order.updateOne({"orders._id":new ObjectId(orderId)},
              {
                $set:{ "orders.$.cancelStatus": status,
                "orders.$.orderStatus": status,
                "orders.$.paymentStatus": "Refund Credited to Wallet"
                }
              }).then(async(response)=>{
                const user=await User.findOne({_id:userId})
                user.wallet +=parseInt(order.totalPrice)
                await user.save()
                const walletTransaction={
                  date:new Date(),
                  type:'Credit',
                  amount:order.totalPrice
                }
                const walletupdated= await User.updateOne(
                  {_id:userId},
                  {$push:{walletTransaction:walletTransaction}}
                  )
                  addToStock(orderId,userId)
                resolve(response)
              })
            }
          }
        })
      })
    } catch (error) {
      console.log(error.message);
      
    }
  }

  const getSalesReport=()=>{
    try {
      return new Promise((resolve,reject)=>{
        Order.aggregate([
          {$unwind:"$orders"},
          {$match:{"orders.orderStatus":'Delivered'}}
        ]).then((response)=>{
          resolve(response)
        })
      }) 
    } catch (error) {
      console.log(error.message)
    }
  
  }

  const postReport = (date) => {
    try {
      const start = new Date(date.startdate);
      const end = new Date(date.enddate);
      return new Promise((resolve, reject) => {
        Order.aggregate([
          {
            $unwind: "$orders",
          },
          {
            $match: {
              $and: [
                { "orders.orderStatus": "Delivered" },
                {
                  "orders.createdAt": {
                    $gte: start,
                    $lte: new Date(end.getTime() + 86400000),
                  },
                },
              ],
            },
          },
        ])
          .exec()
          .then((response) => {
            resolve(response);
          });
      });
    } catch (error) {
      console.log(error.message);
    }
  }

module.exports={
    verifyLogin,
    findOrder,
    changeOrderStatus,
    cancelOrder,
    returnOrder,
    getSalesReport,
    postReport,
    getCodCount,
    getOnlineCount,
    getWalletCount,
    RazorpayandWalletCount
}