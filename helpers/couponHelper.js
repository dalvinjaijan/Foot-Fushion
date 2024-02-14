const Coupon=require('../model/couponModel')
const voucherCode=require('voucher-code-generator')
const User=require('../model/userModel')
const { ObjectId } = require("mongodb");



const addCoupon=async(data)=>{
try {
    return new Promise((resolve,reject)=>{
        Coupon.findOne({couponCode:data.couponCode}).then((coupon)=>{
           if(coupon){
            console.log(coupon)
               resolve({status:false})
           }else{
               Coupon(data).save().then((response)=>{
                   resolve({status:true})
               })
           }
        })
       })
} catch (error) {
    console.log(error.messagse)
}
}


const generatorCouponCode =  () => {
    return new Promise(async (resolve, reject) => {
      try {
        let couponCode = voucherCode.generate({
          length: 4,
          count: 1,
          charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
          prefix: "FOOTFUSHION-",
        });
      
        resolve({ status: true, couponCode: couponCode[0] });
      } catch (err) {
        console.log(err.message);
  
      }
    });
  }

  const removeCoupon=async(couponId)=>{
    try {
        return new Promise(async(resolve,reject)=>{
            await Coupon.deleteOne({_id:couponId}).then((response)=>{
                resolve({status:true})
            })

        })
    } catch (error) {
        console.log(error.message)
    }
  }
  

  const applyCoupon=(couponCode,total)=>{
    try {
      return new Promise((resolve,reject)=>{
        Coupon.findOne({couponCode:couponCode}).then((couponExist)=>{
          if(couponExist){
            if(new Date(couponExist.validity)-new Date()>0){
              if(total>=couponExist.minPurchase){
                let discountAmount=(total*couponExist.minDiscountPercentage)/100
                if(discountAmount>couponExist.maxDiscountValue){
                  discountAmount=couponExist.maxDiscountValue
                  resolve({
                    status:true,
                    discountAmount:discountAmount,
                    discount:couponExist.minDiscountPercentage,
                    couponCode:couponCode
                  })
                }else{
                  resolve({
                    status:true,
                    discountAmount:discountAmount,
                    discount:couponExist.minDiscountPercentage,
                    couponCode:couponCode
                  })
                }
              }else{
                console.log(total);
                resolve({
                  status:false,
                  message:`minimum purchase amount is ${couponExist.minPurchase}`
                })
              }
            }else{
              resolve({
                status:false,
                message:"coupon expired"
              })
            }
          }else{
            resolve({
              status:false,
              message:"coupon doesn't exist"
            })
          }
        })
      })
    } catch (error) {
      console.log(error.message)
    }
  }

  const verifyCoupon=(userId,couponCode)=>{
    try {
     return new Promise((resolve,reject)=>{
      Coupon.find({couponCode:couponCode}).then(async(couponExist)=>{
        if(couponExist.length>0){
          if(new Date(couponExist[0].validity)-new Date()>0){
            const usersCoupon= await User.findOne({
              _id:userId,
              coupons:{$in:[couponCode]}
            })
            if(usersCoupon){
              resolve({
                status: false,
                message: "Coupon already used by the user",
              }); 
            }else{
              resolve({
                status: true,
                message: "Coupon added successfully",
              });
            }
          }else{
            resolve({
              status: false,
              message: "Coupon have expired",
            });
          }
        }else{
          resolve({
            status: false,
            message: "Coupon doesn't Exist",
          });
        }
      })
     }) 
    } catch (error) {
      console.log(error.message)
    }
  }

  const addCouponToUser=(couponCode,userId)=>{
    try {
      return new Promise(async(resolve,reject)=>{
        await User.updateOne(
          {_id:new ObjectId(userId)},
          {$push:{coupons:couponCode}})
      .then((couponAdded)=>{
        resolve(couponAdded)
      })
    })
    } catch (error) {
      console.log(error.message)
    }
  }

module.exports={
    addCoupon,
    generatorCouponCode,
    removeCoupon,
    applyCoupon,
    verifyCoupon,
    addCouponToUser
}