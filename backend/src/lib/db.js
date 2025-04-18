import mongoose from 'mongoose';

export const connectDb = async()=>{
    try{
       const conn =  await mongoose.connect(process.env.mongoURI)
            console.log("connected Db");
       
    }catch(error){
        console.log(`not connected ${error}`);
        process.exit(1);
    }
}

