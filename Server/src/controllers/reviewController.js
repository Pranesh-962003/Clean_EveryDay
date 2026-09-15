import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Story } from "../models/Story.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { getMyReviewsService, deleteReviewService } from "../services/reviewService.js";
import { emitToAdmin, emitToAll } from "../socket/index.js";
import cloudinary from "../config/cloudinary.js";

// Submit Review
export const submitReview = async (req, res) => {
    try {

        const { uid } = req.user;

        const {
            productId,
            rating,
            comment,
            image,
            images,
            img
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
        // Limit Reviews (Max 5 per product per customer)
        // =====================================

        const existingReviewCount = await Review.countDocuments({
            user: user._id,
            product: product._id,
            isDeleted: false
        });

        if (existingReviewCount >= 5) {
            return res.status(409).json({
                success: false,
                message: "You have reached the maximum limit of 5 reviews for this product."
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
        // Handle Review Image Attachment
        // =====================================

        let reviewImage = image || img || (Array.isArray(images) && images.length > 0 ? images[0] : "");
        if (reviewImage && typeof reviewImage === "string" && reviewImage.startsWith("data:image")) {
            try {
                const uploadRes = await cloudinary.uploader.upload(reviewImage, {
                    folder: "reviews",
                    resource_type: "image"
                });
                if (uploadRes && uploadRes.secure_url) {
                    reviewImage = uploadRes.secure_url;
                }
            } catch (uploadErr) {
                console.warn("Cloudinary review image upload note (saving directly):", uploadErr.message);
            }
        }
        const reviewImages = Array.isArray(images) && images.length > 0 ? images : (reviewImage ? [reviewImage] : []);

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
            image: reviewImage || "",
            images: reviewImages,
            status: "Approved",
            isVerifiedPurchase: !!purchasedOrder
        });

        // Recalculate Product Rating immediately
        const approvedReviews = await Review.find({
            product: product._id,
            status: "Approved",
            isDeleted: false
        });

        const totalReviews = approvedReviews.length;
        const totalRating = approvedReviews.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = totalReviews === 0 ? 0 : Number((totalRating / totalReviews).toFixed(1));

        await Product.findByIdAndUpdate(product._id, {
            averageRating,
            totalReviews
        });

        // Real-time synchronization
        emitToAdmin("review:created", { review });
        emitToAll("review:created", { review });
        emitToAll("review:statusUpdated", { review, status: review.status });
        emitToAll("product:updated", { productId: product._id, averageRating, totalReviews });

        // =====================================
        // Response
        // =====================================

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully!",
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
                "authorName profileImage rating comment image images isVerifiedPurchase likes dislikes createdAt"
            );

        // =====================================
        // Response Data
        // =====================================

        const data = reviews.map(review => ({

            _id: review._id,

            authorName: review.authorName,

            rating: review.rating,

            review: review.comment,

            comment: review.comment,

            image: review.image || (Array.isArray(review.images) && review.images.length > 0 ? review.images[0] : ""),

            images: Array.isArray(review.images) && review.images.length > 0 ? review.images : (review.image ? [review.image] : []),

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
        const { page = 1, limit = 1000, status, search = "" } = req.query;

        const filter = { isDeleted: false };
        if (status && status !== "All") {
            filter.status = status;
        }

        // Fetch Stories for admin moderation (product reviews are auto-approved and do not require admin moderation)
        const stories = await Story.find(filter).sort({ createdAt: -1 });

        // Map stories to review format expected by admin moderation interface
        const mappedStories = stories.map(story => ({
            _id: story._id,
            customer: {
                name: story.author || "Customer One",
                profileImage: ""
            },
            product: {
                id: story._id,
                name: story.role || "Botanical Solutions Experience"
            },
            authorName: story.author,
            role: story.role,
            rating: story.rating,
            review: story.body,
            comment: story.body,
            image: story.image || story.img || (Array.isArray(story.images) && story.images.length > 0 ? story.images[0] : ""),
            images: story.images || (story.image ? [story.image] : []),
            status: story.status || (story.approved ? "Approved" : "Pending"),
            approved: story.approved !== false,
            date: story.createdAt || story.date,
            adminReply: story.adminReply || "",
            reply: story.adminReply || ""
        }));

        let data = [...mappedStories];

        if (search) {
            const keyword = search.toLowerCase();
            data = data.filter(item =>
                item.customer.name.toLowerCase().includes(keyword) ||
                item.review.toLowerCase().includes(keyword) ||
                item.product.name.toLowerCase().includes(keyword)
            );
        }

        const currentPage = Number(page);
        const pageSize = Number(limit);
        const startIndex = (currentPage - 1) * pageSize;
        const paginatedReviews = data.slice(startIndex, startIndex + pageSize);

        return res.status(200).json({
            success: true,
            currentPage,
            totalPages: Math.ceil(data.length / pageSize) || 1,
            totalReviews: data.length,
            reviews: paginatedReviews
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

        if (!["Approved", "Hidden", "Rejected", "Pending"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status."
            });
        }

        // Check if ID belongs to a Story
        const story = await Story.findOne({ _id: id, isDeleted: false });
        if (story) {
            story.status = status;
            story.approved = status === "Approved";
            await story.save();

            emitToAdmin("story:updated", { story, status });
            emitToAll("story:updated", { story, status });
            emitToAll("story:statusUpdated", { story, status });
            emitToAll("review:statusUpdated", { review: story, status });

            return res.status(200).json({
                success: true,
                message: status === "Approved" ? "Story approved successfully." : `Story status updated to ${status}.`,
                story
            });
        }

        // Fallback to Product Review
        const review = await Review.findOne({
            _id: id,
            isDeleted: false
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review/Story not found."
            });
        }

        review.status = status;
        await review.save();

        // Recalculate Product Rating
        const approvedReviews = await Review.find({
            product: review.product,
            status: "Approved",
            isDeleted: false
        });

        const totalReviews = approvedReviews.length;
        const totalRating = approvedReviews.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = totalReviews === 0 ? 0 : Number((totalRating / totalReviews).toFixed(1));

        await Product.findByIdAndUpdate(review.product, {
            averageRating,
            totalReviews
        });

        emitToAdmin("review:updated", { review, status });
        emitToAll("review:statusUpdated", { review, status });
        emitToAll("product:updated", { productId: review.product, averageRating, totalReviews });

        return res.status(200).json({
            success: true,
            message: status === "Approved" ? "Review approved successfully." : "Review status updated."
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

export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if ID belongs to a Story
        const story = await Story.findOne({ _id: id, isDeleted: false });
        if (story) {
            story.isDeleted = true;
            await story.save();

            emitToAdmin("story:deleted", { id: story._id, _id: story._id });
            emitToAll("story:deleted", { id: story._id, _id: story._id });
            emitToAll("review:deleted", { id: story._id, _id: story._id });

            return res.status(200).json({
                success: true,
                message: "Story deleted successfully."
            });
        }

        // Fallback to Product Review
        const review = await Review.findOne({
            _id: id,
            isDeleted: false
        });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review/Story not found."
            });
        }

        review.isDeleted = true;
        await review.save();

        const approvedReviews = await Review.find({
            product: review.product,
            status: "Approved",
            isDeleted: false
        });

        const totalReviews = approvedReviews.length;
        const totalRating = approvedReviews.reduce((sum, item) => sum + item.rating, 0);
        const averageRating = totalReviews === 0 ? 0 : Number((totalRating / totalReviews).toFixed(1));

        await Product.findByIdAndUpdate(review.product, {
            averageRating,
            totalReviews
        });

        emitToAdmin("review:deleted", { id: review._id, _id: review._id, productId: review.product });
        emitToAll("review:deleted", { id: review._id, _id: review._id, productId: review.product });
        emitToAll("product:updated", { productId: review.product, averageRating, totalReviews });

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


export const getMyReviews = async (req, res) => {
    try {
        const result = await getMyReviewsService(req);

        if (Array.isArray(result)) {
            return res.status(200).json({
                success: true,
                reviews: result,
                stories: []
            });
        }

        return res.status(200).json({
            success: true,
            reviews: result.reviews || [],
            stories: result.stories || []
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const userDeleteReview = async (req, res) => {
    try {
        const review = await deleteReviewService(req);

        // Real-time synchronization for stories and product reviews
        emitToAdmin("story:deleted", { id: review._id, _id: review._id });
        emitToAll("story:deleted", { id: review._id, _id: review._id });
        emitToAdmin("review:deleted", { id: review._id, _id: review._id, productId: review.product });
        emitToAll("review:deleted", { id: review._id, _id: review._id, productId: review.product });

        if (review.product) {
            Product.findById(review.product).then((p) => {
                if (p) {
                    emitToAll("product:updated", { product: p, productId: p._id, averageRating: p.averageRating, totalReviews: p.totalReviews });
                }
            }).catch(() => {});
        }

        return res.status(200).json({
            success: true,
            message: "Deleted successfully.",
            review
        });
    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};

export const replyToReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { responseStatement, reply } = req.body;
        const replyText = (responseStatement || reply || "").trim();

        if (!replyText) {
            return res.status(400).json({
                success: false,
                message: "Reply message is required."
            });
        }

        // Check if ID belongs to a Story
        const story = await Story.findOne({ _id: id, isDeleted: false });
        if (story) {
            story.adminReply = replyText;
            story.repliedAt = new Date();
            await story.save();

            emitToAdmin("story:updated", { story });
            emitToAll("story:updated", { story });
            emitToAll("story:replied", { story });
            emitToAll("review:replied", { story, review: story });

            return res.status(200).json({
                success: true,
                message: "Reply statement saved successfully.",
                story
            });
        }

        // Fallback to Product Review
        const review = await Review.findOne({ _id: id, isDeleted: false });
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review/Story not found."
            });
        }

        review.adminReply = replyText;
        review.repliedAt = new Date();
        await review.save();

        emitToAdmin("review:updated", { review });
        emitToAll("review:updated", { review });
        emitToAll("review:replied", { review });

        return res.status(200).json({
            success: true,
            message: "Reply statement saved successfully.",
            review
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Failed to save reply statement.",
            error: error.message
        });
    }
};