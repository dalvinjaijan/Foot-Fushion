const User = require('../model/userModel')
const Address = require("../model/addressModel");
const Cart = require('../model/cartModel');
const Coupon = require('../model/couponModel')
const orderHelper=require('../helpers/orderHelper')
const couponHelper=require('../helpers/couponHelper')
const { ObjectId } = require("mongodb");
const fs = require("fs");
const { Readable } = require('stream');
const Order=require('../model/orderModel');
const easyinvoice = require('easyinvoice')
const checkOut = async (req,res)=>{         
    try {
        const user = res.locals.user
       
        const userDetails=await User.findOne({_id:user.id})
    
        const total = await Cart.findOne({ user: user.id });
        
        const address = await Address.findOne({user:user._id}).lean().exec()
        const coupon= await Coupon.find({})
        const userData =  await user.wallet
        
        
        
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
        res.render('checkOut',{address:address.address,cart,total,userData,coupon:coupon,userDetails:userDetails}) 
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
      
      const couponCode = data.couponCode
      await couponHelper.addCouponToUser(couponCode, userId);
  
      req.session.wallet=data.wall1
     
      try { 
        
        const checkStock = await orderHelper.checkStock(userId)
       
  
  
        if(checkStock){
        if (data.paymentOption === "cod") { 
          const updatedStock = await orderHelper.updateStock(userId)
          const response = await orderHelper.placeOrder(data,userId);
          await Cart.deleteOne({ user:userId  })
          res.json({ codStatus: true });
        } 
          else if (data.paymentOption === "wallet") {
            const updatedStock = await orderHelper.updateStock(userId)
            const response = await orderHelper.placeOrder(data,userId);
            res.json({ orderStatus: true, message: "order placed successfully" });
            await Cart.deleteOne({ user:userId  })
        }else if (data.paymentOption === "razorpay") {
          const response = await orderHelper.placeOrder(data,userId);
          const order = await orderHelper.generateRazorpay(userId,data.total);
          res.json(order);
         
        }
      }else{
        await Cart.deleteOne({ user:userId  })  
        console.log("this");
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

const verifyPayment = async (req, res) => {
  const userId = res.locals.user._id;
  const data = req.session.wallet;
  console.log("razorwall"+data);
  
  if(data=="1"){
    const userData = await User.findById(userId);
    const wallet=userData.wallet
    const walletTransaction = {
      date: new Date(),
      type: 'Debit',
      amount: userData.wallet,
  };
    userData.wallet = 0;
        await userData.save();

       
        
        await User.updateOne(
            { _id: userId },
            { $push: { walletTransaction: walletTransaction } }
        );
  


  }
  const orderId = req.body.order.receipt

  orderHelper.verifyPayment(req.body).then(() => {
    orderHelper
      .changePaymentStatus(res.locals.user._id, req.body.order.receipt,req.body.payment.razorpay_payment_id)
      .then(() => {
        res.json({ status: true });
      })
      .catch((err) => {
        res.json({ status: false });
      });
  }).catch(async(err)=>{
    
    console.log(err);

  });
}

const paymentFailed = async(req,res)=>{
  try {
    const order = req.body
    const pending= await Order.updateOne(
      { "orders._id": new ObjectId(order.order.receipt) },
      { $set: { "orders.$.orderStatus": "Pending",
      "orders.$.paymentStatus": "Pending"} }

    )
    
    res.send({status:true})
  } catch (error) {
    
  }
  
}

const loadRetryPayment=async(req,res)=>{
  try {
    const user = res.locals.user
        const total = await Cart.findOne({ user: user.id });
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
          
         
          const orderId=req.query.id
          
      
        res.render('paymentPage',{cart,total,userData,orderId}) 
  } catch (error) {
    console.log(error.message)
  }
} 
const postRetryPayment=async(req,res)=>{
  try {
    const userId = res.locals.user._id;
    
    
    const data = req.body;
    console.log(data)
    const userData = await User.findById(userId);
    

    req.session.wallet=data.wall1
   
    try { 
      
      const checkStock = await orderHelper.checkStock(userId)
     


      if(checkStock){
      if (data.paymentOption === "cod") { 
         const updatedStock = await orderHelper.updateStock(userId)
        const response = await orderHelper.makePayment(data,userId);
        await Cart.deleteOne({ user:userId  })
        res.json({ codStatus: true });
      } 
        else if (data.paymentOption === "wallet") {
          const updatedStock = await orderHelper.updateStock(userId)
          const response = await orderHelper.makePayment(data,userId);
          res.json({ orderStatus: true, message: "order placed successfully" });
          await Cart.deleteOne({ user:userId  })
      }else if (data.paymentOption === "razorpay") {
        const response = await orderHelper.makePayment(data,userId);
        const order = await orderHelper.generateRazorpay(userId,data.total);
        res.json(order);
       
      }
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
const cancelPayment=async(req,res)=>{
  try {
    return new Promise(async(resolve,reject)=>{
    const orderId=req.body.orderId
    const userId=res.locals.user._id
    console.log(orderId);
    await Order.findOneAndUpdate({"orders._id":new ObjectId(orderId)},
    {$pull:{orders:{_id:new ObjectId(orderId)}}})
    .then((response) => {
      resolve(response); 
    })
    .catch((error)=>{
      reject(error)
    })
    }) 
  } catch (error) {
    console.log(error.message)
  }
  
}

const downloadInvoice=async(req,res)=>{
  try {
    const id=req.query.id
    const userId=res.locals.user._id
    const result= await orderHelper.findOrder(id,userId)
    
    const date=result[0].createdAt.toLocaleDateString()
    const product=result[0].productDetails 
    
    const order={
      id: id,
      orderNumber:result[0].orderNumber,
      total:parseInt( result[0].totalPrice),
      discountAmount: parseInt(result[0].discountAmount),
      date: date,
      payment: result[0].paymentMethod,
      name: result[0].shippingAddress.item.name,
      street: result[0].shippingAddress.item.address,
      locality: result[0].shippingAddress.item.locality,
      city: result[0].shippingAddress.item.city,
      state: result[0].shippingAddress.item.state,
      pincode: result[0].shippingAddress.item.pincode,
      product: result[0].productDetails,
    }
    const products=order.product.map((product)=>({
      "quantity":parseInt( product.quantity),
      "description": product.productName,
      "tax-rate":0,
      "price":  (product.catOfferPrice <= product.productOfferPrice && product.catOfferPrice !== 0) || (product.catOfferPrice >= product.productOfferPrice && product.productOfferPrice==0 && product.catOfferPrice!=0) ? 
      parseInt(product.catOfferPrice) : 
      (product.productOfferPrice > 0 ? parseInt(product.productOfferPrice) : parseInt(product.productPrice))
      
      
    }))
    const total = order.totalPrice - order.discountAmount
    var data = {
      customize: {},
      images: {
        // logo: "https://public.easyinvoice.cloud/img/logo_en_original.png",

        background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
      },


      sender: {
        company: "Foot Fushion",
        address: "Brototype",
        zip: "686633",
        city: "Maradu",
        country: "India",
      },

      client: {
        company: order.name,
        address: order.street,
        zip: order.pincode,
        city: order.city,
        state: order.state,
        country: "India",
      },
      information: {
        number: order.orderNumber,
       

        

        date: order.date,
        // Invoice due date
        "due-date": "Nil",
        total:total
      },
      

      products: products,
      // The message you would like to display on the bottom of your invoice
      "bottom-notice": "Thank you,Keep shopping.",
    };
    console.log(products);
    (data.information.number);
    (order);

    easyinvoice.createInvoice(data, async function (result) {
      //The response will contain a base64 encoded PDF file
      await fs.writeFileSync("invoice.pdf", result.pdf, "base64");


       // Set the response headers for downloading the file
       res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
       res.setHeader('Content-Type', 'application/pdf');
 
       // Create a readable stream from the PDF base64 string
       const pdfStream = new Readable();
       pdfStream.push(Buffer.from(result.pdf, 'base64'));
       pdfStream.push(null);
 
       // Pipe the stream to the response
       pdfStream.pipe(res);

      
    });
   
  } catch (error) {
    console.log(error.message)
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
    walletStatus,
    verifyPayment,
    paymentFailed,
    loadRetryPayment,
    postRetryPayment,
    downloadInvoice,
    cancelPayment
}