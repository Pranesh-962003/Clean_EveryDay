import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        author: {
            type: String,
            required: true,
            trim: true,
        },

        ini: {
            type: String,
            required: true,
            trim: true,
        },

        role: {
            type: String,
            default: "Home User",
            trim: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        body: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        date: {
            type: String,
            default: "",
        },

        approved: {
            type: Boolean,
            default: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["Pending", "Approved", "Hidden", "Rejected"],
            default: "Approved",
            index: true,
        },

        isVerified: {
            type: Boolean,
            default: true,
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Story = mongoose.models.Story || mongoose.model("Story", storySchema);
export default Story;
