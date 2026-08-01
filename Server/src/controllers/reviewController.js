import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";

// Submit Review
export const submitReview = async (req, res) => {
    try {

        const { uid } = req.user;

        const {
            productId,
            rating,
            comment
        } = req.body;

        // =====================================
        // Validate Request
        // =====================================

        if (!productId || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5."
            });
        }

        // =====================================
        // Find User
        // =====================================

        const user = await User.findOne({
            uid,
            isDeleted: false
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // =====================================
        // Find Product
        // =====================================

        let product = null;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            product = await Product.findOne({
                _id: productId,
                isDeleted: false
            });
        }
        if (!product) {
            product = await Product.findOne({
                $or: [{ sku: productId }, { title: productId }],
                isDeleted: false
            });
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        // =====================================
        // Prevent Duplicate Review
        // =====================================

        const existingReview = await Review.findOne({
            user: user._id,
            product: product._id,
            isDeleted: false
        });

        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already reviewed this product."
            });
        }

        // =====================================
        // Check Verified Purchase
        // =====================================

        const purchasedOrder = await Order.findOne({
            customer: user._id,
            status: "Delivered",
            "items.product": product._id,
            isDeleted: false
        });

        // =====================================
        // Create Review
        // =====================================

        const review = await Review.create({

            user: user._id,

            product: product._id,

            order: purchasedOrder ? purchasedOrder._id : null,

            authorName:
                user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Customer",

            profileImage:
                user.photoURL || user.avatar || "",

            rating: Number(rating),

            comment,

            status: "Pending",

            isVerifiedPurchase: !!purchasedOrder

        });

        // =====================================
        // Response
        // =====================================

        return res.status(201).json({

            success: true,

            message: "Review submitted successfully. Waiting for admin approval.",

            review

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to submit review.",

            error: error.message

        });

    }
};

//get All review about the product
export const getProductReviews = async (req, res) => {
    try {

        const { productId } = req.params;

        // =====================================
        // Fetch Product if ObjectId or SKU or Title
        // =====================================

        let targetProduct = null;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            targetProduct = await Product.findById(productId);
        }
        if (!targetProduct) {
            targetProduct = await Product.findOne({
                $or: [{ sku: productId }, { title: productId }],
                isDeleted: false
            });
        }

        const productQueryId = targetProduct ? targetProduct._id : productId;

        // =====================================
        // Fetch Reviews
        // =====================================

        const reviews = await Review.find({

            product: productQueryId,

            status: "Approved",

            isDeleted: false

        })
            .sort({ createdAt: -1 })
            .select(
                "authorName profileImage rating comment isVerifiedPurchase likes dislikes createdAt"
            );

        // =====================================
        // Response Data
        // =====================================

        const data = reviews.map(review => ({

            _id: review._id,

            authorName: review.authorName,

            rating: review.rating,

            review: review.comment,

            verifiedPurchase: review.isVerifiedPurchase,

            likes: review.likes,

            dislikes: review.dislikes,

            date: review.createdAt

        }));

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            totalReviews: data.length,

            reviews: data

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to fetch product reviews.",

            error: error.message

        });

    }
};



// =====================================
// Approve Review Admin
// =====================================

// =====================================
// Get All Reviews (Admin)
// =====================================


export const getAllReviews = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            status,
            search = ""
        } = req.query;

        // =====================================
        // Filter
        // =====================================

        const filter = {
            isDeleted: false
        };

        if (status) {
            filter.status = status;
        }

        // =====================================
        // Fetch Reviews
        // =====================================

        const reviews = await Review.find(filter)
            .populate("product", "title sku")
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        // =====================================
        // Search
        // =====================================

        let filteredReviews = reviews;

        if (search) {

            const keyword = search.toLowerCase();

            filteredReviews = reviews.filter(review =>

                review.authorName?.toLowerCase().includes(keyword) ||

                review.product?.title?.toLowerCase().includes(keyword) ||

                review.comment?.toLowerCase().includes(keyword)

            );

        }

        // =====================================
        // Pagination
        // =====================================

        const currentPage = Number(page);

        const pageSize = Number(limit);

        const startIndex = (currentPage - 1) * pageSize;

        const paginatedReviews = filteredReviews.slice(
            startIndex,
            startIndex + pageSize
        );

        // =====================================
        // Response Data
        // =====================================

        const data = paginatedReviews.map(review => ({

            _id: review._id,

            customer: {

                name: review.authorName,

                profileImage: review.profileImage

            },

            product: {

                id: review.product?._id,

                name: review.product?.title || ""

            },

            rating: review.rating,

            review: review.comment,

            status: review.status,

            date: review.createdAt

        }));

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            currentPage,

            totalPages: Math.ceil(
                filteredReviews.length / pageSize
            ),

            totalReviews: filteredReviews.length,

            reviews: data

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to fetch reviews.",

            error: error.message

        });

    }
};


export const updateReviewStatus = async (req, res) => {
    try {

        const { id } = req.params;

        const { status } = req.body;

        // =====================================
        // Validate Status
        // =====================================

        if (!["Approved", "Hidden"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review status."
            });
        }

        // =====================================
        // Find Review
        // =====================================

        const review = await Review.findOne({
            _id: id,
            isDeleted: false
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found."
            });
        }

        // =====================================
        // Update Status
        // =====================================

        review.status = status;

        await review.save();

        // =====================================
        // Recalculate Product Rating
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
        // Update Product
        // =====================================

        await Product.findByIdAndUpdate(
            review.product,
            {
                averageRating,
                totalReviews
            }
        );

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            message:
                status === "Approved"
                    ? "Review approved successfully."
                    : "Review hidden successfully."

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to update review.",

            error: error.message

        });

    }
};

// =====================================
// Delete Review
// =====================================

export const deleteReview = async (req, res) => {
    try {

        const { id } = req.params;

        // =====================================
        // Find Review
        // =====================================

        const review = await Review.findOne({
            _id: id,
            isDeleted: false
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found."
            });
        }

        // =====================================
        // Soft Delete
        // =====================================

        review.isDeleted = true;

        await review.save();

        // =====================================
        // Recalculate Product Rating
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

        await Product.findByIdAndUpdate(
            review.product,
            {
                averageRating,
                totalReviews
            }
        );

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            message: "Review deleted successfully."

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to delete review.",

            error: error.message

        });

    }
};