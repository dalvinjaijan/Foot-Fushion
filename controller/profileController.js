const Address=require('../model/addressModel')
const profileHelper=require('../helpers/profileHelper')
const User=require('../model/userModel')
const bcrypt= require('bcrypt')

const profile = async (req, res) => {
    try {
      let arr = []
      const user = res.locals.user;
      
      res.render("profileDetails", { user, arr });
    } catch (error) {
      console.log(error.message);
    }
  };

  const profileAddress = async (req, res) => {
    try {
      let arr = []
      const user = res.locals.user;
      const address = await Address.find({user:user._id.toString()});
      if(address){
        const ad = address.forEach((x) => {
          return (arr = x.address);
        });
        
        res.render("profileAddress", { user, arr });
      }
      
    } catch (error) {
      console.log(error.message);
    }
  };
  const submitAddress = async (req, res) => {
    try {
      const userId = res.locals.user._id;
      const name = req.body.name;
      const mobileNumber = req.body.mobileNumber;
      const address = req.body.address;
      const locality = req.body.locality;
      const city = req.body.city;
      const pincode = req.body.pincode;
      const state = req.body.state;
      const addressId=req.body.addressId
      
  
      // Create a new address object
      const newAddress = {
        name: name,
        mobileNumber: mobileNumber,
        address: address,
        locality: locality,
        city: city,
        pincode: pincode,
        state: state,
      };
  
      const updatedUser = await profileHelper.updateAddress(userId, newAddress,addressId);
       console.log(`this is updated user${updatedUser}`)
      if (!updatedUser) {
        // No matching document found, create a new one
        await profileHelper.createAddress(userId, newAddress);
      }
  
      res.json({ message: "Address saved successfully!" });
  
      //res.redirect("/profile"); // Redirect to the profile page after saving the address
    } catch (error) {
      console.log(error.message);
    }
  };

  const checkOutAddress = async (req, res) => {
    try {
      const userId = res.locals.user._id;
      const name = req.body.name;
      const mobileNumber = req.body.mno;
      const address = req.body.address;
      const locality = req.body.locality;
      const city = req.body.city;
      const pincode = req.body.pincode;
      const state = req.body.state;
      const addressId=req.body.addressId

  
      const newAddress = {
        name: name,
        mobileNumber: mobileNumber,
        address: address,
        locality: locality,
        city: city,
        pincode: pincode,
        state: state,
      };
  
      const updatedUser = await profileHelper.updateAddress(userId, newAddress,addressId);
      if (!updatedUser) {
        await profileHelper.createAddress(userId, newAddress);
      }
  
  
      res.redirect("/checkOut"); 
    } catch (error) {
      console.log(error.message);
    }
  };

  const updateProfile = async (req, res) => {
    try {
        const { fname, lname, email, mobile } = req.body;
        const userId = res.locals.user._id; // Assuming you have user information stored in req.user after authentication

        // Update the user information
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fname, lname, email, mobile },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User info updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user info:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const updatePassword = async (req, res) => {
  try {
      const newPassword = req.body.newPassword;
      const curPassword=req.body.curPassword
      const userId = res.locals.user._id 
      
      
    
      


      // Find the user by ID
      const user = await User.findById(userId);
      console.log(user,"user")

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Check if the provided old password matches the stored password
      const passwordMatch = await bcrypt.compare(curPassword, user.password);
      


      if (!passwordMatch) {
          return res.status(401).json({ message: 'Incorrect old password' });
      }
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
      console.error('Error updating password: Enter correct password');
      res.status(500).json({ message: 'Internal Server Error' });
  }
};

const deleteAddress = async (req, res) => {
  const userId = res.locals.user._id;
  const addressId = req.query.id; // Access addressId from query parameters
  console.log(addressId);
  try {
      // Update the document by pulling the address with the specified _id
      const updatedUser = await Address.findOneAndUpdate(
          { "address._id": addressId },
          { $pull: { address: { _id: addressId } } },
          { new: true }
      );
      if (updatedUser) {
          console.log('Address deleted successfully:', updatedUser);
          return res.redirect('/profileDetails'); // Return here to prevent further execution
      } else {
          console.log('Address not found or deletion failed.');
          return res.status(404).send("Address not found");
      }
  } catch (error) {
      console.error('Error deleting address:', error);
      return res.status(500).send("Error deleting address");
  }
};
const walletTransaction = async(req,res)=>{
  try {
    const user = res.locals.user
    // const userData= await User.findOne({_id:user._id})
    const wallet = await User.aggregate([
      {$match:{_id:user._id}},
      {$unwind:"$walletTransaction"},
      {$sort:{"walletTransaction.date":-1}},
      {$project:{walletTransaction:1,wallet:1}}
    ])

    res.render('walletTransaction',{wallet})
    
  } catch (error) {
    console.log(error.message);
  }


}
  module.exports={
    profile,
    profileAddress,
    submitAddress,
    checkOutAddress,
    updateProfile,
    updatePassword,
    deleteAddress,
    walletTransaction
  }