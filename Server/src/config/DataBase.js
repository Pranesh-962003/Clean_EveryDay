import mongoose from "mongoose";
import { attachMongoAdapter } from "../socket/index.js";

export const connectDb = async () => {
    if (mongoose.connection.readyState >= 1) {
        await attachMongoAdapter();
        return;
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connection is successful");
        await attachMongoAdapter();
    } catch (error) {
        console.log("error while connecting DB = ", error);
    }
};