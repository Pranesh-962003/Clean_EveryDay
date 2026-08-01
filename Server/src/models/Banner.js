import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {

        label: {
            type: String,
            required: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        subtitle: {
            type: String,
            default: "",
            trim: true,
        },

        ctaText: {
            type: String,
            default: "",
            trim: true,
        },

        ctaLink: {
            type: String,
            default: "/",
            trim: true,
        },

        // =====================================
        // Desktop Banner
        // =====================================

        desktopImage: {
            type: String,
            default: "",
            trim: true,
        },

        desktopImagePublicId: {
            type: String,
            default: "",
        },

        // =====================================
        // Mobile Banner
        // =====================================

        mobileImage: {
            type: String,
            default: "",
            trim: true,
        },

        mobileImagePublicId: {
            type: String,
            default: "",
        },

        // =====================================
        // Banner Position
        // =====================================

        displayOrder: {
            type: Number,
            required: true,
            unique: true,
            min: 1,
            max: 4,
        },

        // =====================================
        // Scheduling
        // =====================================

        scheduleStart: {
            type: Date,
            default: null,
        },

        scheduleEnd: {
            type: Date,
            default: null,
        },

        // =====================================
        // Banner Status
        // =====================================

        isActive: {
            type: Boolean,
            default: true,
        },

        // =====================================
        // Analytics
        // =====================================

        totalClicks: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalViews: {
            type: Number,
            default: 0,
            min: 0,
        },

        // =====================================
        // Soft Delete
        // =====================================

        isDeleted: {
            type: Boolean,
            default: false,
        }

    },
    {
        timestamps: true,
    }
);

// =====================================
// Indexes
// =====================================

bannerSchema.index({
    isActive: 1,
    isDeleted: 1
});

bannerSchema.index({
    scheduleStart: 1,
    scheduleEnd: 1
});

export const Banner = mongoose.model("Banner", bannerSchema);