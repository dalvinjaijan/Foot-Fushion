const Address = require("../model/addressModel")
// Helper function to update the user's address
const   updateAddress = async (userId, newAddress,specificId) => {

    const updatedAddress = await Address.findOneAndUpdate({user:userId,'address._id':specificId},{$set:{'address.$':newAddress}},{new:true})
 // console.log("popped"+updatedAddress)
 console.log("hi")
     return updatedAddress;
  }
  
  // Helper function to create a new user address
  const createAddress = async (userId, newAddress) => {
   const existing= await Address.findOne({user:userId.toString()})
    if(existing){
      const updated=await Address.findOneAndUpdate({user:userId.toString()},{$push:{address:newAddress}})
      console.log(updated)
    }else{
      const userAddress = new Address({
        user: userId,
        address: [newAddress],
      });
      await userAddress.save();
    

    }
    
  };
  // const deleteAddress=async(data,userId)=>{
  //   const addressId=data
  //   const address=Address.findOne({'address._id':addressId,user:userId})
   
  //   return new Promise((resolve,reject)=>{
  //       try {
  //          Address.updateOne(
  //           { 'address._id': addressId, user: userId },
  //           { $pull: { address: { '_id': addressId } } }
  //         )
  //       .then(()=>{
  //         resolve()
  //       })
          
  //   } catch (error) {
  //    throw error
  //   }
  // }) 
  // }



  module.exports={
    updateAddress,
    createAddress,
    // deleteAddress

  }