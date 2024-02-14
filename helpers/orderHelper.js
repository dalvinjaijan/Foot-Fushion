const Cart=require('../model/cartModel')
const Product=require('../model/productModel')
const Order=require('../model/orderModel')
const { ObjectId } = require("mongodb");
const Address=require('../model/addressModel')
const User=require('../model/userModel')

const getOrderId = async (user)=>{
  try {
    const latestOrder = await Order.aggregate([
      { $unwind: "$orders" }, // Unwind the orders array
      { $sort: { "orders.createdAt": -1 } }, // Sort by createdAt in descending order
      { $limit: 1 }, // Limit to the first document (latest order)
  ]).exec();
  // console.log(latestOrder);

    const newNumber =  parseInt(latestOrder[0].orders.orderNumber+1)
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
                  status = 'Success';
                  orderStatus = 'Placed';
              }else {
                  status = 'Pending';
                  orderStatus = 'Pending';
              }
              
              const orderId = await getOrderId(user);
        
              
              
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
    

    module.exports={checkStock,
        updateStock,
        getOrderList,
        placeOrder,
        findOrder,
        cancelOrder,
        totalCheckOutAmount
    }