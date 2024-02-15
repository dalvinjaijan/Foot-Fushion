const User = require('../model/userModel')
const Address = require("../model/addressModel");
const Cart = require('../model/cartModel');
const orderHelper=require('../helpers/orderHelper')
const couponHelper=require('../helpers/couponHelper')
const Order=require('../model/orderModel');
const { response } = require('express');
const checkOut = async (req,res)=>{         
    try {
        const user = res.locals.user
        const total = await Cart.findOne({ user: user.id });
        const address = await Address.findOne({user:user._id}).lean().exec()
        const userData =  await user.wallet
        console.log(userData);
        
        
        const cart = await Cart.aggregate([
            {
              $match: { user: user.id }
            },
            {
              $unwind: "$cartItems"
            },
            {
              $lookup: {
                from: "products",
                localField: "cartItems.productId",
                foreignField: "_id",
                as: "carted"
              }
            },
            {
              $project: {
                item: "$cartItems.productId",
                quantity: "$cartItems.quantity",
                total: "$cartItems.total",
                carted: { $arrayElemAt: ["$carted", 0] }
              }
            }
          ]);
      if(address){
        res.render('checkOut',{address:address.address,cart,total,userData}) 
      }else{
        res.render('checkOut',{address:[],cart,total})
      }
    } catch (error) {
        console.log(error.message)
        
    }
}

const changePrimary = async (req, res) => {
    try {
      const userId = res.locals.user._id
      const result = req.body.addressRadio;
      const user = await Address.find({ user: userId.toString() });
  
      const addressIndex = user[0].address.findIndex((address) =>
        address._id.equals(result)
      );
      if (addressIndex === -1) {
        throw new Error("Address not found");
      }
  
      const removedAddress = user[0].address.splice(addressIndex, 1)[0];
      user[0].address.unshift(removedAddress);
  
      const final = await Address.updateOne(
        { user: userId },
        { $set: { address: user[0].address } }
      );
  
      res.redirect("/checkOut");
    } catch (error) {
      console.log(error.message);
    }
  };

  const postCheckOut  = async (req, res) => {
    try {
      const userId = res.locals.user._id;
      const data = req.body;
      const userData = await User.findById(userId);
      const couponCode=data.couponCode
      await couponHelper.addCouponToUser(couponCode, userId);
      
      
      req.session.wallet=data.wall1
      
     
      try { 
        
        const checkStock = await orderHelper.checkStock(userId)
        console.log(checkStock);
       
  
  
        if(checkStock){
        if (data.paymentOption === "cod") { 
          const updatedStock = await orderHelper.updateStock(userId)
        const response = await orderHelper.placeOrder(data,userId);
        

          await Cart.deleteOne({ user:userId  })
          res.json({ codStatus: true });
        } 
          
      }else if (data.paymentOption === "wallet") {
        console.log(data)
        const updatedStock = await orderHelper.updateStock(userId)
        const response = await orderHelper.placeOrder(data,userId);
        res.json({ orderStatus: true, message: "order placed successfully" });
        await Cart.deleteOne({ user:userId  })
    }else{
        await Cart.deleteOne({ user:userId  })  
        res.json({ status: 'OrderFailed' });
      }
  
      } catch (error) {
        console.log({ error: error.message }, "22");
        res.json({ status: false, error: error.message });
      } 
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }

  const orderList  = async(req,res)=>{
    try {
      const user  = res.locals.user
      const currentDate = new Date() 
  
      // const order = await Order.findOne({user:user._id})
      const orders = await Order.aggregate([
        {$match:{user:user._id}},
        { $unwind: "$orders" },
        { $sort: { "orders.createdAt": -1 } },
      ])
      const datess = currentDate-orders[0].orders.createdAt
      await(datess / (1000 * 3600 * 24))
      res.render('profileOrder',{orders,currentDate})
  
      
     
    } catch (error) {
      console.log(error.message);
      
    }
  
  
  }


  const orderDetails = async (req,res)=>{
    try {
      const user = res.locals.user
      const id = req.query.id
      orderHelper.findOrder(id, user._id).then((orders) => {
        const address = orders[0].shippingAddress
        const products = orders[0].productDetails 
        res.render('orderDetails',{orders,address,products})
      });      
    } catch (error) {
      console.log(error.message);
    }
  
  }

  const cancelOrder=async(req,res)=>{
    const orderId=req.body.orderId
    const status=req.body.status
    const reason=req.body.reason

    orderHelper.cancelOrder(orderId,status,reason).then((response)=>{
      res.send(response)
    })
  }
  

  const applyCoupon=async(req,res)=>{
    const userId=res.locals.user._id
    const couponCode=req.params.id
    const total=await orderHelper.totalCheckOutAmount(userId)
    console.log(total)
    couponHelper.applyCoupon(couponCode,total).then((response)=>{
      res.send(response)
    })
}

const verifyCoupon=async(req,res)=>{
  const userId=res.locals.user._id
  const couponCode=req.params.id
  couponHelper.verifyCoupon(userId,couponCode).then((response)=>{
    res.send(response)
  })
}

const walletStatus = async(req,res)=>{
  const id= res.locals.user._id;
  try {
    const user= await User.findOne({_id:id})
    const cart = await Cart.findOne({ user:id });
   const wallet=user.wallet
   const total=cart.total
     user.wallet=0;
     await user.save()



    if(checkBox.checked){
    const userData = await User.findById(user);
    userData.wallet = 0;
    }
    else{
      userData.wallet = user.wallet
    }
    

  } catch (error) {
    console.log(error.message);
  }

}

module.exports={
    checkOut,
    changePrimary,
    postCheckOut,
    orderDetails,
    orderList,
    cancelOrder,
    applyCoupon,
    verifyCoupon,
    walletStatus
}