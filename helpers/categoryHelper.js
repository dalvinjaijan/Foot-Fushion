const Product = require('../model/productModel')
const Category = require('../model/categoryModel');


const createCategory = (data) => {
    return new Promise(async(resolve, reject) => {
     
      const category = new Category({ name: data.name, description: data.description });
      category.save()
        .then(savedCategory => {
          resolve(savedCategory);
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  const loadUpdateCategory = (id)=>{
    return new Promise((resolve, reject)=>{
      Category.findById({_id:id}) 
      .then((Categorydata)=>{
        resolve(Categorydata);
      })
      .catch((error)=>{
        console.log(error.message);
        reject(error);
      })
    })
  }

  const UpdateCategory=async(categoryId,data)=>{
    try {
      await Category.findByIdAndUpdate({_id:categoryId},{$set:{name:data.category,description:data.description}})
    } catch (error) {
      console.log(error.message)
    }
  }

  const unListCategory=async(categoryId)=>{
    try {
      await Category.findByIdAndUpdate({_id:categoryId},{$set:{isListed:false}})
    await Product.updateMany({ category: categoryId }, {$set:{ isListed: false }})
    } catch (error) {
      console.log(error.message)
    }
    
  }

  const reListCategory=async(categoryId)=>{
    try {
      await Category.findByIdAndUpdate({_id:categoryId},{$set:{isListed:true}})
    await Product.updateMany({ category: categoryId }, {$set:{ isListed: true }})
    } catch (error) {
      console.log(error.message)
    }
    
  }

  module.exports={
    createCategory,
    loadUpdateCategory,
    UpdateCategory,
    unListCategory,
    reListCategory
  }