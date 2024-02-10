const Product=require('../model/productModel')

const createProduct=async(data,images)=>{
    return new Promise((resolve,reject)=>{
        const newProduct= new Product({
            name:data.name,
            description:data.description,
            image:images,
            category:data.category,
            price:data.price,
            stock:data.stock
        })
        newProduct.save()
        .then(() =>{ 
            resolve() 
          })
          .catch((err) => {
            console.error('Error adding product:', err);
            reject(err)
          });
    
    })
}

const unListProduct=async(query)=>{
    return new Promise((resolve,reject)=>{
        const id=query
        Product.updateOne({_id:id},{isProductListed:false})
        .then(()=>{
            resolve()
        })
        .catch((error)=>{
            console.log(error.message)
            reject(error)
        })
    })
}

const reListProduct=async(query)=>{
    return new Promise((resolve,reject)=>{
        const id=query
        Product.updateOne({_id:id},{isProductListed:true})
        .then(()=>{
            resolve()
        })
        .catch((error)=>{
            console.log(error.message)
            reject(error)
        })
    })
}

const updateProduct = async (data, images) => {
    try {
     
        const productData = await Product.updateOne(
          { _id: data.id },
          {
            $set: {
              name: data.name,
              description: data.description,
              category: data.category,
              image: images,
              price: data.price,
              stock: data.stock
            }
          }
        );
  
    } catch (error) {
      console.log(error.message);
    }
  }; 


module.exports={
    createProduct,
    unListProduct,
    reListProduct,
    updateProduct
}