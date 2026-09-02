import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { emitToUser } from "../socket/index.js";

//add cart
export const addToCart = async (req, res) => {
    try {

        const { uid } = req.user;

        const { productId, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product is required."
            });
        }

        const qty = Number(quantity) || 1;

        if (qty <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than zero."
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
        // Find Product (Safely check ObjectId or SKU)
        // =====================================

        let product = null;
        if (mongoose.Types.ObjectId.isValid(productId)) {
            product = await Product.findOne({
                _id: productId,
                isDeleted: false,
                isActive: true
            });
        }
        if (!product) {
            product = await Product.findOne({
                $or: [{ sku: productId }, { name: productId }, { title: productId }],
                isDeleted: false,
                isActive: true
            });
        }

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const availableStock = (typeof product.stock === 'number' && product.stock > 0) ? product.stock : 100;

        if (availableStock < qty) {
            return res.status(400).json({
                success: false,
                message: "Insufficient stock available."
            });
        }

        // =====================================
        // Find Cart
        // =====================================

        let cart = await Cart.findOne({
            user: user._id,
            isDeleted: false
        });

        if (!cart) {

            cart = new Cart({
                user: user._id,
                items: []
            });

        }

        // =====================================
        // Existing Item?
        // =====================================

        const existingItem = cart.items.find(

            item =>
                item.product.toString() === product._id.toString()

        );

        if (existingItem) {

            const updatedQty = existingItem.quantity + qty;

            if (updatedQty > availableStock) {

                return res.status(400).json({
                    success: false,
                    message: "Requested quantity exceeds stock."
                });

            }

            existingItem.quantity = updatedQty;

            // Refresh latest pricing
            existingItem.priceAtAdded = product.retailPrice;
            existingItem.discountPriceAtAdded = product.sellingPrice;

        } else {

            cart.items.push({

                product: product._id,

                quantity: qty,

                priceAtAdded: product.retailPrice,

                discountPriceAtAdded: product.sellingPrice,

                selected: true

            });

        }

        // =====================================
        // Recalculate Cart
        // =====================================

        cart.totalItems = 0;
        cart.subtotal = 0;
        cart.totalDiscount = 0;

        for (const item of cart.items) {

            cart.totalItems += item.quantity;

            cart.subtotal +=
                item.priceAtAdded * item.quantity;

            cart.totalDiscount +=
                (item.priceAtAdded - item.discountPriceAtAdded) *
                item.quantity;

        }

        cart.tax = 0;

        cart.shippingCharge = 0;

        if (cart.coupon?.discountAmount) {

            cart.grandTotal =
                cart.subtotal -
                cart.totalDiscount -
                cart.coupon.discountAmount +
                cart.shippingCharge +
                cart.tax;

        } else {

            cart.grandTotal =
                cart.subtotal -
                cart.totalDiscount +
                cart.shippingCharge +
                cart.tax;

        }

        if (cart.grandTotal < 0) {
            cart.grandTotal = 0;
        }

        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: "items.product"
            });

        // Real-time synchronization
        emitToUser(user._id, "cart:updated", { cart: updatedCart });

        return res.status(200).json({

            success: true,

            message: "Product added to cart successfully.",

            cart: updatedCart

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to add product to cart.",

            error: error.message

        });

    }
};

//Get all the cart

export const getCart = async (req, res) => {
    try {

        const { uid } = req.user;

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
        // Find Cart
        // =====================================

        const cart = await Cart.findOne({
            user: user._id,
            isDeleted: false
        })
            .populate({
                path: "items.product",
                match: {
                    isDeleted: false,
                    isActive: true
                }
            });

        // =====================================
        // Empty Cart
        // =====================================

        if (!cart) {

            return res.status(200).json({

                success: true,

                totalItems: 0,

                cart: {
                    items: [],
                    subtotal: 0,
                    totalDiscount: 0,
                    shippingCharge: 0,
                    tax: 0,
                    grandTotal: 0
                }

            });

        }

        // =====================================
        // Remove Deleted Products
        // =====================================

        cart.items = cart.items.filter(item => item.product);

        // =====================================
        // Recalculate Totals
        // =====================================

        cart.totalItems = 0;
        cart.subtotal = 0;
        cart.totalDiscount = 0;

        for (const item of cart.items) {

            cart.totalItems += item.quantity;

            cart.subtotal +=
                item.priceAtAdded * item.quantity;

            cart.totalDiscount +=
                (item.priceAtAdded - item.discountPriceAtAdded) *
                item.quantity;

        }

        cart.grandTotal =
            cart.subtotal -
            cart.totalDiscount +
            cart.shippingCharge +
            cart.tax;

        if (cart.coupon?.discountAmount) {

            cart.grandTotal -= cart.coupon.discountAmount;

        }

        if (cart.grandTotal < 0) {
            cart.grandTotal = 0;
        }

        await cart.save();

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            totalItems: cart.totalItems,

            cart

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to fetch cart.",

            error: error.message

        });

    }
};


//delete cart details softdelete

export const removeCartItem = async (req, res) => {
    try {

        const { uid } = req.user;
        const { productId } = req.params;

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
        // Find Cart
        // =====================================

        const cart = await Cart.findOne({
            user: user._id,
            isDeleted: false
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found."
            });
        }

        // =====================================
        // Find Item
        // =====================================

        const itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart."
            });
        }

        // =====================================
        // Remove Item
        // =====================================

        cart.items.splice(itemIndex, 1);

        // =====================================
        // Recalculate Totals
        // =====================================

        cart.totalItems = 0;
        cart.subtotal = 0;
        cart.totalDiscount = 0;

        for (const item of cart.items) {

            cart.totalItems += item.quantity;

            cart.subtotal +=
                item.priceAtAdded * item.quantity;

            cart.totalDiscount +=
                (item.priceAtAdded - item.discountPriceAtAdded) *
                item.quantity;

        }

        cart.grandTotal =
            cart.subtotal -
            cart.totalDiscount +
            cart.shippingCharge +
            cart.tax;

        if (cart.coupon?.discountAmount) {
            cart.grandTotal -= cart.coupon.discountAmount;
        }

        if (cart.grandTotal < 0) {
            cart.grandTotal = 0;
        }

        await cart.save();

        // Real-time synchronization
        emitToUser(user._id, "cart:updated", { cart });

        return res.status(200).json({

            success: true,

            message: "Product removed from cart successfully.",

            cart

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to remove product from cart.",

            error: error.message

        });

    }
};


// update quantity

export const updateCartQuantity = async (req, res) => {
    try {

        const { uid } = req.user;
        const { itemId } = req.params;
        const { quantity } = req.body;

        // =====================================
        // Validate Quantity
        // =====================================

        if (
            quantity === undefined ||
            isNaN(quantity) ||
            Number(quantity) < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid quantity."
            });
        }

        const newQuantity = Number(quantity);

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
        // Find Cart
        // =====================================

        const cart = await Cart.findOne({
            user: user._id,
            isDeleted: false
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found."
            });
        }

        // =====================================
        // Find Cart Item
        // =====================================

        const item = cart.items.id(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Cart item not found."
            });
        }

        // =====================================
        // Find Product
        // =====================================

        const product = await Product.findOne({
            _id: item.product,
            isDeleted: false,
            isActive: true
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        // =====================================
        // Stock Validation
        // =====================================

        if (newQuantity > product.stock) {

            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items available in stock.`
            });

        }

        // =====================================
        // Remove Item if Quantity = 0
        // =====================================

        if (newQuantity === 0) {

            item.deleteOne();

        } else {

            item.quantity = newQuantity;

            // Update latest prices
            item.priceAtAdded = product.retailPrice;
            item.discountPriceAtAdded = product.sellingPrice;

        }

        // =====================================
        // Recalculate Cart
        // =====================================

        cart.totalItems = 0;
        cart.subtotal = 0;
        cart.totalDiscount = 0;

        cart.items.forEach(cartItem => {

            cart.totalItems += cartItem.quantity;

            cart.subtotal +=
                cartItem.priceAtAdded *
                cartItem.quantity;

            cart.totalDiscount +=
                (
                    cartItem.priceAtAdded -
                    cartItem.discountPriceAtAdded
                ) * cartItem.quantity;

        });

        cart.grandTotal =
            cart.subtotal -
            cart.totalDiscount +
            cart.shippingCharge +
            cart.tax;

        if (cart.coupon?.discountAmount) {

            cart.grandTotal -= cart.coupon.discountAmount;

        }

        if (cart.grandTotal < 0) {
            cart.grandTotal = 0;
        }

        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate({
                path: "items.product",
                select: `
                    title
                    sellingPrice
                    retailPrice
                    stock
                    images
                    badge
                    sku
                    category
                `
            });

        // Real-time synchronization
        emitToUser(user._id, "cart:updated", { cart: updatedCart });

        return res.status(200).json({

            success: true,

            message: "Cart updated successfully.",

            cart: updatedCart

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to update cart.",

            error: error.message

        });

    }
};