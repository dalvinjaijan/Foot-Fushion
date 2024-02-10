const express=require("express")
const app=express()
const nocache=require('nocache')


const userRoute=require('./route/userRoute')
const adminRoute=require('./route/adminRoute')

const dbConnection=require("./config/config")

dbConnection.connection()


app.use(express.urlencoded({extended:true}))
app.use(nocache())

app.use(express.static(__dirname+'/public'));







//userRoute
app.use("/",userRoute)

//adminRoute
app.use("/admin",adminRoute)



const port=process.env.PORT ||3000
app.listen(port,()=>console.log(`server is running on http://localhost:${port}`))