import express from "express";
import { addProduct, deleteProduct, getAllProducts, updateProduct } from "../controllers/productController.js";
import verifyAdmin from "../middlewares/admin.js";
import verifyToken from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";

const productRouter = express.Router();
const pubilcProductRouter = express.Router()
productRouter.post("/add-product", verifyToken,verifyAdmin,upload.array("images", 5),addProduct);
productRouter.put("/update-product/:id",verifyToken,verifyAdmin, upload.array("images", 5),updateProduct);
productRouter.delete("/delete-product/:id",verifyToken,verifyAdmin,deleteProduct);

//pubilc route for product
pubilcProductRouter.get("/", getAllProducts);


export  {productRouter, pubilcProductRouter};