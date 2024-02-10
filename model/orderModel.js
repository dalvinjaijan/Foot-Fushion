const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({


    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    orders:{
      type:Array
    },
    reason:{
      type:String
    }
    
  });

  const Order = mongoose.model('Order', orderSchema);
  module.exports = Order;
