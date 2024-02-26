const Product=require('../model/productModel')
const Category=require('../model/categoryModel')
const productHelper=require('../helpers/productHelper')
const Cart=require('../model/cartModel')

const loadProduct=async(req,res)=>{
    try {
        const categories=await Category.find()
        res.render('addProduct',{category:categories})
    } catch (error) {
        console.log(error.message)
    }
}

const createProduct=async(req,res)=>{
    try {
    const categories = await Category.find({})
    if(!req.body.name||req.body.name.trim().length === 0){
      return res.render("addProduct",{ message: "Name is required",category:categories})
    }
    if(req.body.price<=0){
      return res.render("addProduct",{message:"Product price should be greater than 0",category:categories})
    }
   images= req.files.map(file=>file.filename)
    await productHelper.createProduct(req.body,images)
    res.redirect('/admin/displayProduct');
    } catch (error) {
        console.log(error.message)
    }
}

const displayProduct=async(req,res)=>{
    try {
        const product= await Product.find({})
        res.render('displayProduct',{product:product})

    } catch (error) {
        console.log(error.message)
    }
}


const unListProduct=async(req,res)=>{
    try {
        await productHelper.unListProduct(req.query.id)
        res.redirect('/admin/displayProduct')
    } catch (error) {
        console.log(error.message)
    }
}

const reListProduct=async(req,res)=>{
    try {
        await productHelper.reListProduct(req.query.id)
        res.redirect('/admin/displayProduct')
    } catch (error) {
        console.log(error.message)
    }
}


const loadUpdateProduct=async(req,res)=>{
    try {
        const categories=await Category.find({})
        const id=req.query.id
        const productData=await Product.findById({_id:id}).populate('category')
        res.render('updateProduct',{product:productData,category:categories})

    } catch (error) {
        console.log(error.message)
    }
}

const updateProduct = async (req, res) => {
    try {
        
  
      const productData = await Product.findById(req.body.id);
   
  
      const categories = await Category.find({})
      if (!req.body.name || req.body.name.trim().length === 0) {
        return res.render("updateProduct", { message: "Name is required",product:productData,category:categories });
    }
    if (!req.body.description || req.body.description.trim().length === 0) {
      return res.render("updateProduct", { message: "Description is required",product:productData,category:categories });
  }
    if(req.body.price<=0){
      return res.render("updateProduct", { message: "Product Price Should be greater than 0",product:productData,category:categories });
    }
        let pdata
        if(req.files && Object.keys(req.files).length > 0){
            console.log(req.files)
            pdata = {
                name: req.body.name,
                description: req.body.description,
                category: req.body.category,
                ...(req.files['file1'] && {'image.0':req.files['file1'][0].filename}),
                ...(req.files['file2'] && {'image.1':req.files['file2'][0].filename}),
                ...(req.files['file3'] && {'image.2':req.files['file3'][0].filename}),
                price: req.body.price,
                stock: req.body.stock
            }
        }else{
            pdata = {
                name: req.body.name,
                description: req.body.description,
                category: req.body.category,
                price: req.body.price,
                stock: req.body.stock
            }
        }

        const productDat = await Product.updateOne(
            { _id: req.body.id },
            {
              $set:pdata
            }
          );
        res.redirect('/admin/displayProduct');
    } catch (error) {
      console.log(error.message);
    }
  };

  const productPage = async ( req, res ) => {
    try{
        const id = req.query.id
        const userId=res.locals.user._id
        const product = await Product.findOne({ _id : id }).populate('category')
        const cart= await Cart.findOne({user:userId})
        if(product.isProductListed == true && product.isListed == true){
            if(cart){
                res.render('product',{product : product,cart:cart})
            }
            else{
                res.render('product',{product : product})
            }
        
        }else{
          res.redirect('/error-404')
        }
    }
    catch(error){
        console.log(error);
        res.redirect('/error-404');
  }
  
  }

  const addProductOffer = async (req, res) => {
    const { productId, productOffer } = req.body;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.productOffer = productOffer;
        
        if (productOffer > 0) {
            const originalPrice = product.price;
            const discountedPrice = originalPrice - Math.floor((originalPrice * (productOffer / 100)));
            product.offerPrice = discountedPrice;
        }
        

        await product.save();

        return res.status(200).json({ success: true, message: 'Product offer updated successfully', product: product });
    } catch (error) {
        console.error('Error updating product offer:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const removeProductOffer=async(req,res)=>{
    const { productId } = req.body;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.productOffer = 0;
        product.offerPrice=0
        

        await product.save();

        return res.status(200).json({ success: true, message: 'Product offer removed successfully', product: product });
    } catch (error) {
        console.error('Error updating product offer:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports={
    loadProduct,
    createProduct,
    displayProduct,
    unListProduct,
    reListProduct,
    loadUpdateProduct,
    updateProduct,
    productPage,
    addProductOffer,
    removeProductOffer
}