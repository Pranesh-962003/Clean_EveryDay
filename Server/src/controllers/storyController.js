import mongoose from "mongoose";
import { Story } from "../models/Story.js";
import { User } from "../models/User.js";
import { emitToAll } from "../socket/index.js";

/**
 * Fetch all approved stories added by users
 */
export const getStories = async (req, res) => {
    try {
        // Clean up legacy default sample stories if present
        await Story.deleteMany({
            author: { $in: ["Priya Mehta", "Rajan Tiwari", "Sneha Krishnan"] }
        });

        const stories = await Story.find({ isDeleted: false, approved: true }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            stories,
        });
    } catch (error) {
        console.error("[STORIES Error] getStories:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch stories.",
            error: error.message,
        });
    }
};

/**
 * Submit a new story
 */
export const createStory = async (req, res) => {
    try {
        const { rating, body, comment, authorName, role: customRole } = req.body;
        const storyBody = body || comment;

        if (!rating || !storyBody) {
            return res.status(400).json({
                success: false,
                message: "Rating and experience details are required.",
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5.",
            });
        }

        if (storyBody.trim().length > 250) {
            return res.status(400).json({
                success: false,
                message: "Story text exceeds the 250-letter limit. Please shorten your experience details.",
            });
        }

        let userObj = null;
        if (req.user?.uid) {
            userObj = await User.findOne({ uid: req.user.uid, isDeleted: false });
        }

        let author = authorName;
        if (!author && userObj) {
            author = userObj.fullName || userObj.name || (userObj.firstName ? `${userObj.firstName} ${userObj.lastName || ''}`.trim() : '');
        }
        if (!author) {
            author = "Customer One";
        }

        let ini = author
            .split(" ")
            .map((n) => n[0])
            .filter(Boolean)
            .join("")
            .substring(0, 2)
            .toUpperCase();
        if (!ini) ini = "CO";

        let role = customRole;
        if (!role && userObj) {
            const city = userObj.address?.city || userObj.city;
            role = city ? `${city}, Home User` : "Verified Customer";
        }
        if (!role) {
            role = "Home User";
        }

        const dateObj = new Date();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dateStr = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

        const newStory = new Story({
            user: userObj ? userObj._id : null,
            author,
            ini,
            role,
            rating: Number(rating),
            body: storyBody.trim(),
            date: dateStr,
            approved: true,
            status: "Approved",
            isVerified: true,
        });

        await newStory.save();

        // Broadcast real-time Socket.IO event to all clients
        emitToAll("story:created", { story: newStory });

        return res.status(201).json({
            success: true,
            message: "Story published successfully!",
            story: newStory,
        });
    } catch (error) {
        console.error("[STORIES Error] createStory:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to publish story.",
            error: error.message,
        });
    }
};

/**
 * Soft delete a story
 */
export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await Story.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!story) {
            return res.status(404).json({ success: false, message: "Story not found." });
        }
        emitToAll("story:deleted", { id });
        return res.status(200).json({ success: true, message: "Story deleted successfully." });
    } catch (error) {
        console.error("[STORIES Error] deleteStory:", error);
        return res.status(500).json({ success: false, message: "Failed to delete story." });
    }
};
