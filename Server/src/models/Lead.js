import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
    {

        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            default: ""
        },

        company: {
            type: String,
            default: ""
        },

        service: {
            type: String,
            default: ""
        },

        subject: {
            type: String,
            required: true
        },

        message: {
            type: String,
            required: true
        },

        source: {
            type: String,
            enum: [
                "Website",
                "Product",
                "Wholesale",
                "Custom Quote",
                "Manual",
                "Other"
            ],
            default: "Website",
            index: true
        },

        status: {
            type: String,
            enum: [
                "New",
                "Contacted",
                "Qualified",
                "Won",
                "Lost"
            ],
            default: "New",
            index: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        notes: {
            type: String,
            default: ""
        },

        lastContactedAt: {
            type: Date,
            default: null
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }

    },
    {
        timestamps: true
    }
);

leadSchema.index({
    status: 1,
    createdAt: -1
});

leadSchema.index({
    email: 1
});

export const Lead = mongoose.model("Lead", leadSchema);