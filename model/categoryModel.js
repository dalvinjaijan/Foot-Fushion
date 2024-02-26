const mongoose=require("mongoose")

const categorySchema=new mongoose.Schema({
name:{
        type:String,
        required:true
    },
    description:{
        type:String,
    },
    isListed:{
        type:Boolean,
        default:true
    },
    catOfferPrice:{
        type:Number,
        default:0
      
    },
    categoryOffer:{
        type:Number,
        default:0
    }
    
})

module.exports=mongoose.model("Category",categorySchema)
