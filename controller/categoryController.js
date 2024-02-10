const Category=require("../model/categoryModel")
const categoryHelper=require('../helpers/categoryHelper')
const Product=require('../model/productModel')



const loadCategory=async(req,res)=>{
    try {
        const categories= await Category.find()
        res.render('category',{categories})
    } catch (error) {
        console.log(error.message)
    }
}

const loadAddCategory = async(req,res)=>{
    try {
      res.render('addCategory')
    } catch (error) {
      console.log(error.message);
    }
  }
  const createCategory = async(req, res)=>{
    try {
      const categoryName = req.body.name;
      const existingCategory = await Category.findOne({name:categoryName.toUpperCase()})
      if(existingCategory){
        return res.render("addCategory",{message:"Category already exists"})
      } 
      if (!req.body.name || req.body.name.trim().length === 0) {
        return res.render("addCategory", { message: "Name is required" });
    }
       await categoryHelper.createCategory(req.body)
      res.redirect('/admin/category')
    } catch (error) {
      console.log(error.message)
      res.status(500).json({ error: 'Failed to create category' });
    }
  }

  const loadUpdateCategory = async(req,res)=>{
    try {
      const id = req.query.id
      const Categorydata = await categoryHelper.loadUpdateCategory(id)
      
      res.render('updateCategory',{category:Categorydata})
  
    } catch (error) {
      console.log(error.message);
    }
  }


  const updateCategory= async(req,res)=>{
    try {
        console.log("hi")
        const existingCategory=await Category.findOne({name:req.body.category.toUpperCase()})
        if(existingCategory){
            return res.render('updateCategory',{message:"Category already exists"})
        }
        const categoryId=req.body.id
        console.log(categoryId)
        await categoryHelper.UpdateCategory(categoryId,req.body)
        res.redirect('/admin/category')
    } catch (error) {
        console.log(error.message)
    }
  }

  const unListCategory=async(req,res)=>{
    try {
        await categoryHelper.unListCategory(req.query.id)
        
        res.redirect('/admin/category')
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category' });

    }
  }


  const reListCategory= async(req,res)=>{
    try {
      await categoryHelper.reListCategory(req.query.id)
      res.redirect("/admin/category") 
    }
     catch (error) {
      console.log(error.message)
    }

  }

  const categoryPage = async (req,res) =>{

    try{
  
  
      const sortQuery = req.query.sort || 'default'; // Get the sort query from request query parameters (default value is 'default')
      const minPrice = parseFloat(req.query.minPrice); // Get the minimum price from request query parameters
      const maxPrice = parseFloat(req.query.maxPrice)
       
      let sortOption = {};
            if (sortQuery === 'price_asc' ||sortQuery === 'default' ) {
              sortOption = { price: 1 }; 
            } else if (sortQuery === 'price_desc') {
              sortOption = { price: -1 }; 
            }
  
  
             
        
  
  
      console.log('sortOption',sortOption);
        const  categoryId = req.query.id
        const category = await Category.find({ })
        const page = parseInt(req.query.page) || 1; 
        const limit = 6;
        const skip = (page - 1) * limit;
        const totalProducts = await Product.countDocuments({ category:categoryId,$and: [{ isListed: true }, { isProductListed: true }]}); // Get the total number of products
        const totalPages = Math.ceil(totalProducts / limit);
  
        const categories = await Category.find({ })
         
        const product = await Product.find({ category:categoryId,$and: [{ isListed: true }, { isProductListed: true }]})
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .populate('category')
        console.log("products",product);
        // console.log("categories",categories);
        res.render('categoryShop',{product,category, currentPage: page, totalPages })
    }
    catch(err){
        console.log('category page error',err);
      }
  }
  

  

module.exports={
    loadCategory,
    loadAddCategory,
    createCategory,
    loadUpdateCategory,
    updateCategory,
    unListCategory,
    reListCategory,
    categoryPage
}



