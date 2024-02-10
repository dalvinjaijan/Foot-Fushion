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

module.exports={
    verifyLogin,
    findOrder,
    changeOrderStatus,
    cancelOrder
}