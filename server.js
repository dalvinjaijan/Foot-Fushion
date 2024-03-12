const express=require("express")
const app=express()
const nocache=require('nocache')


const userRoute=require('./route/userRoute')
const adminRoute=require('./route/adminRoute')
require('dotenv').config
const dbConnection=require("./config/config")

dbConnection.connection()
app.set('view engine','ejs')


app.use(express.urlencoded({extended:true}))
app.use(nocache())      

app.use(express.static(__dirname+'/public'));

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Internal Server Error')
    
    
  });


  app.use("/admin",adminRoute)

//userRoute
app.use("/",userRoute)

//adminRoute    

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Internal Server Error')
    
    
  });

app.use('*',(req,res,next)=>{
    res.render('users/errorPages/error-404')
    
})



const port=process.env.PORT ||3000
app.listen(port,()=>console.log(`server is running on http://localhost:${port}`))