import express from "express";
import { addToCart, getCart, removeCartItem, updateCartQuantity } from "../controllers/cartController.js";
import verifyToken from "../middlewares/auth.js";

const cartRouter = express.Router();

cartRouter.post("/add",verifyToken,addToCart);
cartRouter.get("/get-cart",verifyToken, getCart);
cartRouter.delete("/item-remove/:productId",verifyToken,removeCartItem);
cartRouter.patch("/item-update/:itemId",verifyToken,updateCartQuantity);

export default cartRouter;