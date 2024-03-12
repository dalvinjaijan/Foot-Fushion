const mongoose = require("mongoose");

const dbconnect = process.env.db;
const atlasDbConnect= process.env.atlasdb


const connection = () => {

  mongoose.connect(atlasDbConnect);

  mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => { 
    console.log("Error connecting to MongoDB");
  }); 

  mongoose.connection.on("disconnected", () => {
    console.log("Disconnected from MongoDB");
  }); 
};
 
module.exports = {
  connection
};
  