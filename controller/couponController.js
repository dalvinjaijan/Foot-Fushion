const Coupon=require('../model/couponModel')
const couponHelper=require('../helpers/couponHelper')

const loadAddCoupon=async(req,res)=>{
    try {
        res.render('addCoupon')
    } catch (error) {
    console.log(error.message)        
    }
}

const addCoupon=async(req,res)=>{
    try {
        const data={
            couponCode:req.body.coupon,
            validity: req.body.validity,
            minPurchase: req.body.minPurchase,
            minDiscountPercentage: req.body.minDiscountPercentage,
            maxDiscountValue: req.body.maxDiscount,
            description: req.body.description,
        }
        couponHelper.addCoupon(data).then((response) => {
            res.json(response);
          });


    } catch (error) {
        console.log(error.message)
    }
}

const generateCouponCode = (req,res)=>{

    couponHelper.generatorCouponCode().then((couponCode) => { 
        res.send(couponCode);
      });
}


const listCoupon=async(req,res)=>{
try {
    const couponList=await Coupon.find()
    res.render('coupon',{couponList})
} catch (error) {
    console.log(error.message)
}
}

const removeCoupon=async(req,res)=>{
    const couponId=req.body.couponId
    console.log(couponId)
    couponHelper.removeCoupon(couponId).then((response)=>{
        res.send(response)
    })
}




module.exports={
    loadAddCoupon,
    addCoupon,
    generateCouponCode,
    listCoupon,
    removeCoupon
}