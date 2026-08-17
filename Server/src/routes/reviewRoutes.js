import express from 'express';
import { getMyReviews, getProductReviews, submitReview, userDeleteReview } from '../controllers/reviewController.js';
import verifyToken from '../middlewares/auth.js';


const reviewRouter = express.Router();

reviewRouter.post("/submit",verifyToken,submitReview);
reviewRouter.get("/product/:productId", getProductReviews);
reviewRouter.get("/my-reviews",verifyToken, getMyReviews);
reviewRouter.delete("/review-delete/:reviewId", verifyToken, userDeleteReview);


export default reviewRouter;
