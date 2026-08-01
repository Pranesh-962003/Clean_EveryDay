import express from 'express';
import { getProductReviews, submitReview } from '../controllers/reviewController.js';
import verifyToken from '../middlewares/auth.js';


const reviewRouter = express.Router();

reviewRouter.post("/submit",verifyToken,submitReview);
reviewRouter.get("/product/:productId", getProductReviews);

export default reviewRouter;
