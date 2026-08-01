import express from "express";
import verifyToken from "../middlewares/auth.js";
import { cancelOrder, getMyOrders, placeCODOrder, updateOrderStatus } from "../controllers/orderController.js";
import verifyAdmin from "../middlewares/admin.js";


const orderRouter = express.Router();
orderRouter.post("/place-order", verifyToken, placeCODOrder);
orderRouter.get("/my-orders", verifyToken, getMyOrders);
orderRouter.delete("/cancel/:orderId", verifyToken, cancelOrder);
orderRouter.put("/:id/status", verifyToken, verifyAdmin, updateOrderStatus);


export default orderRouter;