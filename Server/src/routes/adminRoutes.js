import verifyToken from "../middlewares/auth.js";
import express from "express"
import verifyAdmin from "../middlewares/admin.js";
import { adminLogin, getAllBanners, getDashboard, getOrderRegistry, publishBanners } from "../controllers/adminController.js";
import { deleteReview, getAllReviews, updateReviewStatus } from "../controllers/reviewController.js";
import upload from "../middlewares/multer.js";

const adminRouter = express.Router()

adminRouter.post("/login",verifyToken, verifyAdmin, adminLogin);

adminRouter.put("/approve/:id", verifyToken,verifyAdmin,updateReviewStatus);
adminRouter.get("/admin-reviews",verifyToken,verifyAdmin,getAllReviews);
adminRouter.delete("/review-delete/:id",verifyToken,verifyAdmin,deleteReview);
adminRouter.get("/dashboard",verifyToken,verifyAdmin,getDashboard);
adminRouter.get("/orders",verifyToken,verifyAdmin,getOrderRegistry);
adminRouter.put("/banners-publish", verifyToken, verifyAdmin, upload.any(), publishBanners);
adminRouter.get("/banners-get",verifyToken,verifyAdmin,getAllBanners);

export default adminRouter;