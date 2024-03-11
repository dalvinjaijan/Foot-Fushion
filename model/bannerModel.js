const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      link: {
        type: String,
        required: true,
      },
    
      created_at: {
        type: Date,
        default: Date.now,
      },
      updated_at: {
        type: Date,
        default: Date.now,
      },
      isBannerListed:{
        type:Boolean,
        default:true
      },
    
})

const Banner = mongoose.model('Banner',bannerSchema)
module.exports = Banner