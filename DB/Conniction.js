import mongoose from "mongoose";
const connectDB = async()=>{
    const DBURI = process.env.DBURI
    return await mongoose.connect(DBURI)
    .then(res=>console.log(`DB connected successfully on.....${DBURI}`))
    .catch(err=>console.log(`Fail to connect DB..........${err}`))
}
export default connectDB