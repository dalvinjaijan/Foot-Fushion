const Banner=require('../model/bannerModel')
const bannerHelper=require('../helpers/bannerHelper')

const bannerList=async(req,res)=>{
    try{
        bannerHelper.bannerListHelper().then((response)=> {
            console.log(response);
            res.render('bannerList',{banners:response})

        })
        
    }
    catch(error){
        console.log(error);
    }
}
const addBannerGet=async(req,res)=>{
    try {
        res.render('addBanner')
        
    } catch (error) {
        console.log(error.message);
    }
}
const addBannerPost = async(req,res)=>{
    bannerHelper.addBannerHelper(req.body,req.file.filename).then((response)=>{
        if(response){
            res.redirect('/admin/bannerList')
        }
    })
}
const deleteBanner=async(req,res)=>{
    bannerHelper.deleteBannerHelper(req.query.id).then(()=>{
        res.redirect('/admin/bannerList')
    })

}
const unListBanner=async(req,res)=>{
 bannerHelper.unListBannerHelper(req.query.id).then(()=>{
    res.redirect('/admin/bannerList')
 })
}
const reListBanner=async(req,res)=>{
    bannerHelper.reListBannerHelper(req.query.id).then(()=>{
       res.redirect('/admin/bannerList')
    })
   }


module.exports={
    bannerList,
    addBannerGet,
    addBannerGet,
    addBannerPost,
    deleteBanner,
    unListBanner,
    reListBanner
}