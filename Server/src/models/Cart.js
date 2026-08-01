import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            default: 1,
            min: 1
        },

        priceAtAdded: {
            type: Number,
            required: true,
            min: 0
        },

        discountPriceAtAdded: {
            type: Number,
            default: 0,
            min: 0
        },

        selected: {
            type: Boolean,
            default: true
        },

        addedAt: {
            type: Date,
            default: Date.now
        }

    },
    {
        _id: true
    }
);

const cartSchema = new mongoose.Schema(
    {

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        items: [cartItemSchema],

        totalItems: {
            type: Number,
            default: 0,
            min: 0
        },

        subtotal: {
            type: Number,
            default: 0,
            min: 0
        },

        totalDiscount: {
            type: Number,
            default: 0,
            min: 0
        },

        shippingCharge: {
            type: Number,
            default: 0,
            min: 0
        },

        tax: {
            type: Number,
            default: 0,
            min: 0
        },

        grandTotal: {
            type: Number,
            default: 0,
            min: 0
        },

        coupon: {
            code: {
                type: String,
                default: ""
            },

            discountAmount: {
                type: Number,
                default: 0,
                min: 0
            }
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }

    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const Cart = mongoose.model("Cart", cartSchema);