const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        require: true,
    },
    description: {
        type: String,
        require: true,
    },
    image:{
        type: Array,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Category',
        required: true,
    },
    price:{
        type:Number,
        required:true
      },
      isListed:{
        type:Boolean,
        default:true
      },
      isProductListed:{
        type:Boolean,
        default:true
      },
      stock:{
        type:Number
      }
    });
    
    const Product = mongoose.model('Product',productSchema);
    module.exports = Product;