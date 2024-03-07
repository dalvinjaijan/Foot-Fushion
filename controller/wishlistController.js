const wishListHelper = require('../helpers/wishlistHelper')
const Cart=require('../model/cartModel')

const getWishList = async (req, res) => {
    let user = res.locals.user;
    let userId=user._id
    
    const wishlistCount = await wishListHelper.getWishListCount(user._id);
    wishListHelper.getWishListProducts(user._id).then(async(wishlistProducts) => {
      const cart=await Cart.findOne({user:userId})
      if(cart){
      res.render("wishList", {
        user,
        cart:cart,
        wishlistProducts,
        wishlistCount,
      });
    }else{
      res.render("wishList", {
        user,
        cart:{cartItems:[]},
        wishlistProducts,
        wishlistCount,
      });
    }
    });
  }

  const addWishList = async (req, res) => {

    let proId = req.body.proId;
    let userId = res.locals.user._id;
    wishListHelper.addWishList(userId, proId).then((response) => {
    res.send(response);
    });
  }

  const removeProductWishlist = async (req, res) => {


    const userId=res.locals.user._id

    const proId = req.body.proId;

    wishListHelper
      .removeProductWishlist(proId, userId)
      .then((response) => {
        res.send(response);
      });
  }
  module.exports = {
    getWishList,
    addWishList,
    removeProductWishlist


  }