const bcrypt = require('bcrypt')
const User = require('../model/userModel')
const jwt = require('jsonwebtoken')
require('dotenv').config();
const maxAge = 3*24*60*60;
const createToken = (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET_KEY,{
        expiresIn: maxAge
    })
}

const verifyLogin = (data)=>{
    return new Promise((resolve,reject)=>{
        User.findOne({email:data.email}) 
         .then((userData)=>{
            if (userData){
                if(userData.is_admin==0){
                    bcrypt.compare(data.password,userData.password)
              .then((passwordMatch)=>{
                if(passwordMatch){
                    if(userData.is_Blocked==true){
                        resolve({error:"User is Blocked"})
                    }
                    else{
                        const token = createToken(userData._id)
                        resolve({token})
                    }
                        
                    
                    
                }else{
                    resolve({ error: "Email and Password are Incorrect" });
                }
            })
            .catch((error)=>{
                reject(error);
            })
                }else{
                    resolve({ error: "You are admin" });
                }
              
        }
            else{
                resolve({ error: "Email and Password are Incorrect" });
            }
        })
        .catch((error)=>{
            reject(error);
        })
     
    })
}
module.exports={
    verifyLogin
}

