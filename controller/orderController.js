const User = require('../model/userModel')
const Address = require("../model/addressModel");
const Cart = require('../model/cartModel');
const orderHelper=require('../helpers/orderHelper')
const checkOut = async (req,res)=>{         
    try {
        const user = res.locals.user
        const total = await Cart.findOne({ user: user.id });
        const address = await Address.findOne({user:user._id}).lean().exec()
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
      
      
      req.session.wallet=data.wall1
     
      try { 
        
        const checkStock = await orderHelper.checkStock(userId)
        console.log(checkStock);
       
  
  
        if(checkStock){
        if (data.paymentOption === "cod") { 
          const updatedStock = await orderHelper.updateStock(userId)
        const response = await orderHelper.placeOrder(data,userId);
        console.log(response)

          await Cart.deleteOne({ user:userId  })
          res.json({ codStatus: true });
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
  
module.exports={
    checkOut,
    changePrimary,
    postCheckOut
}