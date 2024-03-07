const cartHelper = require('../helpers/cartHelper')
const Cart = require('../model/cartModel')

const addToCart = (req, res) => {
  try {
    if(res.locals.user){
      cartHelper.addCart(req.params.id, res.locals.user._id)
      .then((response) => {
        console.log(response,"res")
        res.send(response)
      })
    }else{
      console.log("user is not logged in");
      res.redirect('/login')
    }
    
  } catch (error) {
    console.log(error.message);

  }
}

const loadCart = async (req, res) => {
  try {
    const user = res.locals.user;
    const count = await cartHelper.getCartCount(user.id);
    let cartTotal = 0;
    let cartTotalprice= 0

    const total = await Cart.findOne({ user: user.id }).populate('cartItems.productId');
    console.log('cart',total)
    if (total) {
      // console.log(total.cartItems[0].quantity);
      const numberOfProducts=total.cartItems.length
      
      for (let i = 0; i < numberOfProducts; i++) {
        let updateQuery = {};
        let totalPrice;
    
        if (total.cartItems[i].productId.categoryOffer >= total.cartItems[i].productId.productOffer && total.cartItems[i].productId.categoryOffer != 0) {
            totalPrice = total.cartItems[i].productId.catOfferPrice * total.cartItems[i].quantity;
        } else if (total.cartItems[i].productId.productOffer > 0) {
            totalPrice = total.cartItems[i].productId.offerPrice * total.cartItems[i].quantity;
        } else {
            totalPrice = total.cartItems[i].productId.price * total.cartItems[i].quantity;
        }
    
        // Construct the update query
        updateQuery[`cartItems.${i}.total`] = totalPrice;
    
        // Update the cart item total price
     const newTotal  = await Cart.findOneAndUpdate({ user: user.id }, { $set: updateQuery },{new:true});
        cartTotalprice += newTotal.cartItems[i].total;
      console.log("cartproducvt",i, cartTotalprice)
    } 

  console.log('carttotal',cartTotalprice);

  const newCartTotal=await Cart.findOneAndUpdate({ user: user.id }, { $set: {cartTotal:cartTotalprice}},{new:true});

      cartTotal = newCartTotal.cartTotal;
      console.log(cartTotal, "yo")

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


      res.render("cart", { cart, user, count, cartTotal });
    } else {
      res.render("cart", { user, count, cartTotal, cart: [] });
    }
  } catch (error) {
    console.log(error);
    res.send({ success: false, error: error.message });

  }
};
const updateQuantity = (req, res) => {
  const userId = res.locals.user._id
  cartHelper.updateQuantity(req.body).then(async (response) => {
    res.json(response)
  })

}

const deleteProduct = async (req, res) => {
  const userId = res.locals.user_id
  cartHelper.deleteProduct(req.body).then((response) => {
    res.send(response)
  })

}
module.exports = {
  addToCart,
  loadCart,
  updateQuantity,
  deleteProduct
}