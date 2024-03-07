const Cart=require('../model/cartModel')
const Product=require('../model/productModel')
const Order=require('../model/orderModel')
const { ObjectId } = require("mongodb");
const Address=require('../model/addressModel')
const User=require('../model/userModel')
const { v4: uuidv4 } = require('uuid');



const Razorpay = require("razorpay");

require('dotenv').config();

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const getOrderId = async (user)=>{
  try{
const randomUUID = uuidv4();
const randomNumber = randomUUID.replace(/\D/g, '')
const orderNumber=randomNumber.slice(0, 8)
const newNumber = orderNumber;
console.log(newNumber,"newNumber");
    return newNumber
            
  } catch (error) {
    console.log(error.message);
  }
}
const checkStock = async(userId)=>{

    const products = await Cart.findOne({user:userId})
    const cartProducts = products.cartItems
    for(const cartProduct of cartProducts ){
      const productId = cartProduct.productId;
    
      const product = await Product.findOne({_id:productId})
    
      if(product.stock < cartProduct.quantity ){
        return false
      }
    
    }
    return true
    }
    const updateStock = async(userId)=>{

        const products = await Cart.findOne({user:userId})
        const cartProducts = products.cartItems
        for(const cartProduct of cartProducts ){
          const productId = cartProduct.productId;
          const quantity = cartProduct.quantity;
        
          const product = await Product.findOne({_id:productId})
        
          if(product.stock < cartProduct.quantity ){
            return false
          }
        
          await Product.updateOne({_id:productId},
            {$inc:{stock:-quantity}}
            )
        
        }
        return true
        }

const placeOrder = async (data, user) => {
  return new Promise(async (resolve, reject) => {
  try {
    
        const productDetails = await Cart.aggregate([
          {
              $match: {
                  user: user.toString(),
              },
          },
          {
              $unwind: "$cartItems",
          },
          {
              $project: {
                  item: "$cartItems.productId",
                  quantity: "$cartItems.quantity",
              },
          },
          
          {
              $lookup: {
                  from: "products",
                  localField: "item",
                  foreignField: "_id",
                  as: "productDetails",
              },
          },
          {
              $unwind: "$productDetails",
          },
          {
              $project: {
                  productId: "$productDetails._id",
                  productName: "$productDetails.name",
                  productPrice: "$productDetails.price",
                  productOfferPrice:"$productDetails.offerPrice",
                  catOfferPrice:"$productDetails.catOfferPrice",
                  quantity: "$quantity",
                  category: "$productDetails.category",
                  image: "$productDetails.images",
              },
          },
      ]);
      const addressData = await Address.aggregate([
        {
            $match: { user: user.toString() },
        },
        {
            $unwind: "$address",
        },
        {
            $match: { "address._id": new ObjectId(data.address) },
        },
        {
            $project: { item: "$address" },
        },
      ]);
      
      let status, orderStatus;
      
      if (data.paymentOption === 'cod') {
        const userData = await User.findById(user);
        if(data.wall1=="1"){
          const walletTransaction = {
            date: new Date(),
            type: 'Debit',
            amount: userData.wallet,
        };
          userData.wallet = 0;
              await userData.save();
  
             
              
              await User.updateOne(
                  { _id: user },
                  { $push: { walletTransaction: walletTransaction } }
              );
        }
          status = 'Success';
          orderStatus = 'Placed';
      } else if (data.paymentOption === 'wallet') {
          const userData = await User.findById(user);
          
          if (userData.wallet < data.total) {

             
              throw new Error('Insufficient wallet balance!');
              
          } else {
              userData.wallet -= data.total;
              await userData.save();
              
              status = 'Success';
              orderStatus = 'Placed';
              
              const walletTransaction = {
                  date: new Date(),
                  type: 'Debit',
                  amount: data.total,
              };
              
              await User.updateOne(
                  { _id: user },
                  { $push: { walletTransaction: walletTransaction } }
              );
          }
      } else {
          status = 'Pending';
          orderStatus = 'Pending';
      }
      
      const orderId = await getOrderId(user);
      console.log(orderId,"orderNumber");

      
      
      const orderData = {
          _id: new ObjectId(),
          orderNumber: orderId,
          name: addressData[0].item.name,
          paymentStatus: status,
          paymentMethod: data.paymentOption,
          productDetails: productDetails,
          shippingAddress: addressData[0],
          orderStatus: orderStatus,
          totalPrice: data.total,
          discountPercentage: data.discountPercentage,
          discountAmount: data.discountAmount,
          couponCode: data.couponCode,
          cancelStatus: 'false',
          createdAt: new Date(),
      };
      // console.log(orderData);
      const order = await Order.findOne({ user: user });
      
      if (order) {
        await Order.updateOne(
          { user: user },
          { $push: { orders: orderData } }
        ).then((response) => {
          resolve(response);
        }).catch((error) => {
          reject(error);
        });
      } else {
        const newOrder = await Order({
          user: user,
          orders: orderData,
        });
  
        await newOrder.save().then((response) => {
          resolve(response);
        }).catch((error) => {
          reject(error);
        });
      }
  

      // return orderData; // Return the orderData on success
      
  } catch (error) {
      console.log(error.message);
      // throw error; // Re-throw the error to be caught by the caller
  }
})
};

        const getOrderList = (page, limit) => {
          return new Promise((resolve, reject) => {
            Order.aggregate([
              { $unwind: "$orders" },
              { $group: { _id: null, count: { $sum: 1 } } },
            ])
              .then((totalOrders) => {
                const count = totalOrders.length > 0 ? totalOrders[0].count : 0;
                const totalPages = Math.ceil(count / limit);
                const skip = (page - 1) * limit;
        
                Order.aggregate([
                  { $unwind: "$orders" },
                  { $sort: { "orders.createdAt": -1 } },
                  { $skip: skip },
                  { $limit: limit },
                ])
                  .then((orders) => {
                    resolve({ orders, totalPages, page, limit });
                  })
                  .catch((error) => reject(error));
              })
              .catch((error) => reject(error));
          });
        };
        const findOrder  = (orderId, userId) => {
          try {
            return new Promise((resolve, reject) => {
              Order.aggregate([
                {
                  $match: {
                    "orders._id": new ObjectId(orderId),
                    user: new ObjectId(userId),
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


        const cancelOrder=async(orderId,status,reason)=>{
          try {
            return new Promise((resolve,reject)=>{
              Order.updateOne(
                {"orders._id":new ObjectId(orderId)},
                {$set:{"orders.$.orderStatus":status,"orders.$.reason":reason}}
              ).then((response)=>{
                resolve(response)
              })
            })
          } catch (error) {
            console.log(error.message)
          }
          
        }

        const totalCheckOutAmount=(userId)=>{
          try {
                return new Promise(async(resolve,reject)=>{
                  await Cart.aggregate([
                    {$match:{user:userId.toString()}},
                    {$unwind:"$cartItems"},
                    {$project:{
                      item:"$cartItems.productId",
                      quantity:"$cartItems.quantity"
                    }},
                    {$lookup:{
                      from:"products",
                      localField:"item",
                      foreignField:"_id",
                      as:"carted"
                    }},
                    {$project:
                    {
                      item:1,
                      quantity:1,
                      product:{$arrayElemAt:["$carted",0]}
                    }},
                    {
                      $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
                      },
                    },
                  ])
                  .then((total) => {
                    resolve(total[0]?.total);
                  });
                });
                 
          } catch (error) {
          console.log(error.message);
          }
        }

        const generateRazorpay = (userId, total)=> {
          // console.log(userId,total)
          try {
            return new Promise(async (resolve, reject) => {
              let orders = await Order.find({ user: userId });
        
              let order = orders[0].orders.slice().reverse();
            
              let orderId = order[0]._id;
        
              var options = {
                amount: total * 100, 
                currency: "INR",
                receipt: "" + orderId,
              };
              instance.orders.create(options, function (err, order) {
                if (err) {
                  console.log(err);
                } else {
                  resolve(order);
                }
              });
            });
          } catch (error) { 
            console.log(error.message);
          }
        }

        const verifyPayment =  async(details) => {
          try {
            await Order.updateOne({})
        
            let key_secret = process.env.RAZORPAY_SECRET;
            return new Promise((resolve, reject) => {
              const crypto = require("crypto");
              let hmac = crypto.createHmac("sha256", key_secret);
        
        
              hmac.update(
                details.payment.razorpay_order_id +
                  "|" +
                  details.payment.razorpay_payment_id
              );
              hmac = hmac.digest("hex");
              if (hmac == details.payment.razorpay_signature) {
        
                resolve();
              } else {
                reject("not match");
              }
            });
          } catch (error) {
            console.log(error.message);
          }
        }
    
        const changePaymentStatus =  (userId, orderId,razorpayId) => {
          try {
            return new Promise(async (resolve, reject) => {
              await Order.updateOne(
                { "orders._id": new ObjectId(orderId) },
                {
                  $set: {
                    "orders.$.orderStatus": "Placed",
                    "orders.$.paymentStatus": "Success",
                    "orders.$.razorpayId": razorpayId
                  },
                }
              ),
                await updateStock(userId)
                Cart.deleteMany({ user: userId }).then(() => {
                  resolve();
                });
            });
          } catch (error) { 
            console.log(error.message);
          }
        }
        
    const makePayment=async(data,user)=>{
      try {
        let status, orderStatus;
      
      if (data.paymentOption === 'cod') {
        const userData = await User.findById(user);
        if(data.wall1=="1"){
          const walletTransaction = {
            date: new Date(),
            type: 'Debit',
            amount: userData.wallet,
        };
          userData.wallet = 0;
              await userData.save();
  
             
              
              await User.updateOne(
                  { _id: user },
                  { $push: { walletTransaction: walletTransaction } }
              );
        }
          status = 'Success';
          orderStatus = 'Placed';
      } else if (data.paymentOption === 'wallet') {
          const userData = await User.findById(user);
          
          if (userData.wallet < data.total) {

             
              throw new Error('Insufficient wallet balance!');
              
          } else {
              userData.wallet -= data.total;
              await userData.save();
              
              status = 'Success';
              orderStatus = 'Placed';
              
              const walletTransaction = {
                  date: new Date(),
                  type: 'Debit',
                  amount: data.total,
              };
              
              await User.updateOne(
                  { _id: user },
                  { $push: { walletTransaction: walletTransaction } }
              );
          }
      } else {
          status = 'Pending';
          orderStatus = 'Pending';
      }
      console.log(data.orderId);

      const order=await Order.findOneAndUpdate({'orders._id':new ObjectId(data.orderId)},
      {$set:{"orders.$.orderStatus":orderStatus,"orders.$.paymentStatus":status,"orders.$.paymentMethod":data.paymentOption}})
      .then((response) => {
        resolve(response);
      }).catch((error) => {
        reject(error);
      });
      } catch (error) {
        
      }
      
    }

    module.exports={checkStock,
        updateStock,
        getOrderList,
        placeOrder,
        findOrder,
        cancelOrder,
        totalCheckOutAmount,
        generateRazorpay,
        verifyPayment,
        changePaymentStatus,
        makePayment
    }