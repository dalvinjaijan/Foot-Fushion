const Cart=require('../model/cartModel')
const Product=require('../model/productModel')
const {ObjectId}=require('mongodb')

const 
addCart=async(productId,userId)=>{
  const product= await Product.findOne({_id:productId})
  if(product.categoryOffer>=product.productOffer && product.categoryOffer!=0){
    var productObj={
      productId:productId,
      quantity:1,
      total:product.catOfferPrice
    }
  }else if(product.productOffer>0){
    var productObj={
      productId:productId,
      quantity:1,
      total:product.offerPrice
    }
  }
else{
    var productObj={
      productId:productId,
      quantity:1,
      total:product.price
    }
  }
  
try {
    return new Promise(async(resolve,reject)=>{
        const quantity= await Cart.aggregate([
            {$match:{user: userId.toString()}},
            {$unwind:'$cartItems'},
            {$match:{'cartItems.productId':new ObjectId(productId)}},
            {$project:{'cartItems.quantity':1}}
        ])
    
        Cart.findOne({user:userId}).then(async(cart)=>{
            if(cart){
              


                const productExist= await Cart.findOne({user:userId,'cartItems.productId':productId})
                if(productExist){
                    if(product.stock-quantity[0].cartItems.quantity>0){
                    if(product.categoryOffer>=product.productOffer && product.categoryOffer!=0){
                      Cart.updateOne({user:userId,'cartItems.productId':productId},
                      {$inc:{'cartItems.$.quantity':1,
                  'cartItems.$.total':product.catOfferPrice},
                  
                      $set:{cartTotal:cart.cartTotal+product.catOfferPrice}
                  }).then((response)=>{
                      resolve({response,status:true})
                  })
                    }else if(product.productOffer>0){
                        Cart.updateOne({user:userId,'cartItems.productId':productId},
                        {$inc:{'cartItems.$.quantity':1,
                    'cartItems.$.total':product.offerPrice},
                    
                        $set:{cartTotal:cart.cartTotal+product.offerPrice}
                    }).then((response)=>{
                        resolve({response,status:true})
                    })
                      }
                      else{
                        Cart.updateOne({user:userId,'cartItems.productId':productId},
                        {$inc:{'cartItems.$.quantity':1,
                    'cartItems.$.total':product.price},
                    
                        $set:{cartTotal:cart.cartTotal+product.price}
                    }).then((response)=>{
                        resolve({response,status:true})
                    })
                      }
                        
                    }
                    else{
                        resolve({status:'outOfStock'})
                    }
                }
                else{
                    if(product.stock>0){
                      if(product.categoryOffer>=product.productOffer && product.categoryOffer!=0){
                        Cart.updateOne({user:userId},{$push:{cartItems:productObj},
                          $inc:{cartTotal:product.catOfferPrice}})
                          .then((response)=>{
                              resolve({status:true})
                          })
                      }else if(product.productOffer>0){
                        Cart.updateOne({user:userId},{$push:{cartItems:productObj},
                          $inc:{cartTotal:product.offerPrice}})
                          .then((response)=>{
                              resolve({status:true})
                          })
                      }else{
                        console.log("should not work")
                        Cart.updateOne({user:userId},{$push:{cartItems:productObj},
                          $inc:{cartTotal:product.price}})
                          .then((response)=>{
                            
                              resolve({status:true})
                          })
                      }
                        
    
                    }
                    else{
                        resolve({status:'outOfStock'})
                    }
                }
            }
            else{
                if(product.stock>0){
                  if(product.categoryOffer>=product.productOffer && product.categoryOffer!=0){
                    const newCart=await Cart({
                      user:userId,
                      cartItems:productObj,
                      cartTotal:product.catOfferPrice
                  }) 
                  await newCart.save().then((response)=>{
                      resolve({status:true})
                  })
                  }else if(product.productOffer>0){
                    const newCart=await Cart({
                      user:userId,
                      cartItems:productObj,
                      cartTotal:product.offerPrice
                  }) 
                  await newCart.save().then((response)=>{
                      resolve({status:true})
                  })
                  }
                  else{
                    const newCart=await Cart({
                      user:userId,
                      cartItems:productObj,
                      cartTotal:product.price
                  }) 
                  console.log(newCart.cartTotal,"newCart")
                  await newCart.save().then((response)=>{
                      resolve({status:true})
                  })
                  }
                    
                }
                else{
                    resolve({status:'outOfStock'})
                }
            }
        })
      })
    
} catch (error) {
    console.log(error.message)
}


}

const getCartCount=async(userId)=>{
    return new Promise((resolve,reject)=>{
        let count=0
        Cart.findOne({user:userId}).then((cart)=>{
            if(cart){
                count=cart.cartItems.length
            }
            resolve(count)
        })
    })

}

const updateQuantity = async(data) => {
    const cartId = data.cartId;
    const proId = data.proId;
    const userId = data.userId;
    const count = data.count;
    const quantity = data.quantity;
    const product = await Product.findOne({_id:proId})
  
    const quantitySingle = await Cart.aggregate([
      { $match: { user: userId.toString() } },
      { $unwind: "$cartItems" },
      { $match: { 'cartItems.productId': new ObjectId(proId) } },
      {$project:{'cartItems.quantity':1}}
  
    ]);
  
  
  
    try {
      return new Promise(async (resolve, reject) => {
        if (count == -1 && quantity == 1) {
          if(product.categoryOffer>=product.productOffer && product.categoryOffer!=0){
            Cart.findOneAndUpdate(
              { _id: cartId, "cartItems.productId": proId },
              {
                $pull: { cartItems: { productId: proId } },
                $inc: {cartTotal:product.catOfferPrice * count } 
              },
              { new: true }
            )
            .then(() => { 
              resolve({ status: true });
            });
          }else if(product.productOffer>0){
            Cart.findOneAndUpdate(
              { _id: cartId, "cartItems.productId": proId },
              {
                $pull: { cartItems: { productId: proId } },
                $inc: {cartTotal:product.offerPrice * count } 
              },
              { new: true }
            )
            .then(() => { 
              resolve({ status: true });
            });
          }
          else{
            Cart.findOneAndUpdate(
              { _id: cartId, "cartItems.productId": proId },
              {
                $pull: { cartItems: { productId: proId } },
                $inc: {cartTotal:product.price * count } 
              },
              { new: true }
            )
            .then(() => { 
              resolve({ status: true });
            });
          }
        
          
          
          
        } else {
          if(product.stock-quantity < 1 && count==1){
            resolve({ status: 'outOfStock' });
  
  
          }else if(product.categoryOffer>=product.productOffer && product.categoryOffer!=0){ 
            Cart.updateOne(
              { _id: cartId, "cartItems.productId": proId },
              {
                $inc: { "cartItems.$.quantity": count ,
                "cartItems.$.total":product.catOfferPrice*count,
                cartTotal:product.catOfferPrice * count
              },
              }
  
            )
        
            
          .then(() => {
              Cart.findOne(
                { _id: cartId, "cartItems.productId": proId },
                { "cartItems.$": 1,cartTotal:1 }
              ).then((cart) => { 
                const newQuantity = cart.cartItems[0].quantity;
                const newSubTotal = cart.cartItems[0].total;
                const cartTotal = cart.cartTotal
                resolve({ status: true, newQuantity: newQuantity,newSubTotal:newSubTotal,cartTotal:cartTotal});
              });
            }); 
        }else if(product.productOffer>0){
            Cart.updateOne(
              { _id: cartId, "cartItems.productId": proId },
              {
                $inc: { "cartItems.$.quantity": count ,
                "cartItems.$.total":product.offerPrice*count,
                cartTotal:product.offerPrice * count
              },
              }
  
            )
        
            
          .then(() => {
              Cart.findOne(
                { _id: cartId, "cartItems.productId": proId },
                { "cartItems.$": 1,cartTotal:1 }
              ).then((cart) => { 
                const newQuantity = cart.cartItems[0].quantity;
                const newSubTotal = cart.cartItems[0].total;
                const cartTotal = cart.cartTotal
                resolve({ status: true, newQuantity: newQuantity,newSubTotal:newSubTotal,cartTotal:cartTotal});
              });
            }); 
          }
          else{
            
            Cart.updateOne(
              { _id: cartId, "cartItems.productId": proId },
              {
                $inc: { "cartItems.$.quantity": count ,
                "cartItems.$.total":product.price*count,
                cartTotal:product.price * count
              },
              }
  
            )
        
            
          .then(() => {
              Cart.findOne(
                { _id: cartId, "cartItems.productId": proId },
                { "cartItems.$": 1,cartTotal:1 }
              ).then((cart) => { 
                const newQuantity = cart.cartItems[0].quantity;
                const newSubTotal = cart.cartItems[0].total;
                const cartTotal = cart.cartTotal
                resolve({ status: true, newQuantity: newQuantity,newSubTotal:newSubTotal,cartTotal:cartTotal});
              });
            }); 
  
          }
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  }
  

  const deleteProduct=async(data)=>{
    const cartId=data.cartId
    const proId=data.proId
    const product=await Product.findOne({_id:proId})
    const cart=await Cart.findOne({_id:cartId,'cartItems.productId':proId})
    
      return new Promise((resolve,reject)=>{
        try {
        const cartItem=cart.cartItems.find(item=>item.productId.equals(proId))
          const quantityToRemove=cartItem.quantity
          if(product.categoryOffer>=product.productOffer && product.categoryOffer!=0){ 
            Cart.updateOne({_id:cartId,'cartItems.productId':proId},
            {$inc:{cartTotal:product.catOfferPrice*quantityToRemove*-1},
          $pull:{cartItems:{productId:proId}}})
          .then(()=>{
            resolve({status:true})
          })
          }else if(product.productOffer>0){
            const cartotal=product.offerPrice*quantityToRemove*-1
            console.log(cartotal,"delete pro offer");
            Cart.updateOne({_id:cartId,'cartItems.productId':proId},
            {$inc:{cartTotal:product.offerPrice*quantityToRemove*-1},
          $pull:{cartItems:{productId:proId}}})
          .then(()=>{
            resolve({status:true})
          })
          }else{
            Cart.updateOne({_id:cartId,'cartItems.productId':proId},
            {$inc:{cartTotal:product.price*quantityToRemove*-1},
          $pull:{cartItems:{productId:proId}}})
          .then(()=>{
            resolve({status:true})
          })
          }
          
          
    } catch (error) {
     throw error
    }
  }) 
  }

module.exports={
    addCart,
    getCartCount,
    updateQuantity,
    deleteProduct
}