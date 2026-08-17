import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";

export const getMyReviewsService = async (req) => {
    const { uid } = req.user;

    const user = await User.findOne({
        uid,
        isDeleted: false
    });

    if (!user) {
        throw new Error("User not found.");
    }

    const reviews = await Review.find({
        user: user._id,
        isDeleted: false
    })
        .populate({
            path: "product",
            select: "title images"
        })
        .sort({ createdAt: -1 });

    return reviews;
};


export const deleteReviewService = async (req) => {

    const { reviewId } = req.params;

    const { uid } = req.user;

    // =====================================
    // USER
    // =====================================

    const user = await User.findOne({

        uid,
        isDeleted: false

    });

    if (!user) {

        throw new Error("User not found.");

    }

    // =====================================
    // REVIEW
    // =====================================

    const review = await Review.findById(reviewId);

    if (!review) {

        throw new Error("Review not found.");

    }

    // =====================================
    // CHECK OWNER
    // =====================================

    if (review.user.toString() !== user._id.toString()) {

        throw new Error("You are not authorized to delete this review.");

    }

    // =====================================
    // REMOVE REVIEW FROM USER
    // =====================================

    await User.findByIdAndUpdate(

        user._id,

        {

            $pull: {

                reviews: review._id

            }

        }

    );

    // =====================================
    // REMOVE REVIEW FROM PRODUCT
    // =====================================

    await Product.findByIdAndUpdate(

        review.product,

        {

            $pull: {

                reviews: review._id

            }

        }

    );

    // =====================================
    // DELETE REVIEW
    // =====================================

    await Review.findByIdAndDelete(reviewId);

    // =====================================
    // RECALCULATE PRODUCT RATING
    // =====================================

    const approvedReviews = await Review.find({

        product: review.product,

        status: "Approved",

        isDeleted: false

    });

    const totalReviews = approvedReviews.length;

    const totalRating = approvedReviews.reduce(

        (sum, item) => sum + item.rating,

        0

    );

    const averageRating =

        totalReviews === 0

            ? 0

            : Number(

                (

                    totalRating /

                    totalReviews

                ).toFixed(1)

            );

    // =====================================
    // UPDATE PRODUCT
    // =====================================

    await Product.findByIdAndUpdate(

        review.product,

        {

            averageRating,

            totalReviews

        }

    );

    return review;

};