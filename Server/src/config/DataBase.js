import mongoose from "mongoose";

export const connectDb = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connection is successful");
    } catch (error) {
        console.log("error while connecting DB = ", error);
    }
};