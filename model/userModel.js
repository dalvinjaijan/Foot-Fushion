const mongoose=require("mongoose")

const userSchema=mongoose.Schema({
    fname:{
        type:String,
        required:true
    },
    lname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    is_Blocked:{
        type:Boolean,
        required:true,
        default:false
    },
    is_admin:{
        type:Number,
        default:0
    },
    wallet:{
        type:Number,
        default:0
    },
    walletTransaction:{
        type:Array
    },
    coupons:{
        type:Array,
    }
})

module.exports=mongoose.model("User",userSchema)
