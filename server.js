import { app } from "./app.js";
import {config} from "dotenv"
import mongoose from "mongoose";
import cloudinary from "cloudinary"


mongoose.set('strictQuery', false)
config({
    path:"./config/config.env"
})
cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET
})

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, (err) => {
    if (!err) {
        console.log('MongoDB Connection Succeeded.')
    } else {
        console.log('Error in DB connection: ' + err)
    }
});


app.listen(process.env.PORT,()=>{
    console.log("Server listening on port "+ process.env.PORT);
})