import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";

import { calculateOrderPricing } from "../utils/pricingService.js";

import { generateOrderNumber } from "../utils/orderNumberGenerator.js";
import { generateTransactionId } from "../utils/transactionGenerator.js";


export const getUser = async (uid) => {

    const user = await User.findOne({

        uid,

        isDeleted: false

    });

    if (!user) {

        throw new Error("User not found.");

    }

    return user;

};

export const getShippingAddress = (

    user,

    shippingAddressId,

    reqPhone

) => {

    const address = user.addresses.id(

        shippingAddressId

    );

    if (!address) {

        throw new Error("Shipping address not found.");

    }

    const resolvedPhone = address.phoneNumber || address.phone || reqPhone || user.phoneNumber || user.phone || "";
    const resolvedPincode = address.postalCode || address.pincode || address.zip || address.zipCode || "";

    return {

        fullName: address.fullName,

        phoneNumber: resolvedPhone,

        phone: resolvedPhone,

        alternatePhone: address.alternatePhone || "",

        addressLine1: address.addressLine1,

        addressLine2: address.addressLine2,

        city: address.city,

        state: address.state,

        country: address.country,

        postalCode: resolvedPincode,

        pincode: resolvedPincode

    };

};

export const getProducts = async (items) => {

    if (!items || items.length === 0) {

        throw new Error("No products selected.");

    }

    const productIds = items.map(item => item.product);

    const products = await Product.find({

        _id: { $in: productIds },

        isDeleted: false,

        isActive: true

    });

    if (products.length !== items.length) {

        throw new Error("One or more products were not found.");

    }

    const productMap = new Map();

    products.forEach(product => {

        productMap.set(

            product._id.toString(),

            product

        );

    });

    return productMap;

};

export const validateStock = (items, productMap) => {

    const validatedItems = [];

    for (const item of items) {

        const product = productMap.get(item.product);

        if (!product) {

            throw new Error("Product not found.");

        }

        if (!item.quantity || item.quantity <= 0) {

            throw new Error(
                `Invalid quantity for ${product.title}.`
            );

        }

        if (product.stock < item.quantity) {

            throw new Error(
                `${product.title} has only ${product.stock} item(s) left.`
            );

        }

        validatedItems.push({

            product,

            quantity: item.quantity

        });

    }

    return validatedItems;

};

export const createOrder = async ({
    user,
    shippingAddress,
    validatedItems,
    deliveryOption,
    couponCode,
    customerNotes
}) => {

    // =====================================
    // Build Order Items
    // =====================================

    const orderItems = validatedItems.map(item => ({

        product: item.product._id,

        title: item.product.title,

        sku: item.product.sku,

        image:
            item.product.images?.length > 0
                ? item.product.images[0].url
                : "",

        quantity: item.quantity,

        retailPrice: item.product.retailPrice,

        sellingPrice: item.product.sellingPrice,

        unitPrice: item.product.sellingPrice,

        totalPrice:
            item.product.sellingPrice *
            item.quantity

    }));

    // =====================================
    // Calculate Pricing
    // =====================================

    const pricing = calculateOrderPricing({

        cartItems: validatedItems,

        deliveryOption,

        couponCode

    });

    // =====================================
    // Create Order
    // =====================================

    const order = await Order.create({

        orderNumber: generateOrderNumber(),

        transactionId: generateTransactionId(),

        customer: user._id,

        items: orderItems,

        billingAddress: shippingAddress,

        shippingAddress: shippingAddress,

        subtotal: pricing.subtotal,

        discount: pricing.discount,

        couponCode,

        couponDiscount: pricing.couponDiscount,

        delivery: pricing.delivery,

        tax: pricing.tax,

        grandTotal: pricing.grandTotal,

        payment: {

            method: "COD",

            status: "Pending",

        },

        customerNotes:
            customerNotes || ""

    });

    return {

        order,

        pricing

    };

};

export const updateInventory = async (validatedItems) => {

    for (const item of validatedItems) {

        await Product.findByIdAndUpdate(

            item.product._id,

            {

                $inc: {

                    stock: -item.quantity,

                    sold: item.quantity,

                    totalPurchased: item.quantity,

                    grossRevenue:
                        item.product.sellingPrice *
                        item.quantity

                }

            }

        );

    }

};

export const updateUserStatistics = async (

    user,

    grandTotal

) => {

    user.totalOrders += 1;

    user.totalSpent += grandTotal;

    await user.save();

};

export const removePurchasedItemsFromCart = async (

    user,

    purchasedItems

) => {

    const cart = await Cart.findOne({

        user: user._id,

        isDeleted: false

    });

    if (!cart) {

        return;

    }

    // Remove purchased products

    cart.items = cart.items.filter(cartItem => {

        return !purchasedItems.some(item =>

            item.product._id.toString() ===

            cartItem.product.toString()

        );

    });

    // Recalculate totals

    cart.totalItems = 0;

    cart.subtotal = 0;

    cart.totalDiscount = 0;

    cart.tax = 0;

    cart.shippingCharge = 0;

    cart.grandTotal = 0;

    cart.items.forEach(item => {

        cart.totalItems += item.quantity;

        cart.subtotal +=

            item.priceAtAdded *

            item.quantity;

        cart.totalDiscount +=

            (

                item.priceAtAdded -

                item.discountPriceAtAdded

            ) *

            item.quantity;

    });

    cart.tax = Math.round(

        cart.subtotal * 0.18

    );

    cart.grandTotal =

        cart.subtotal +

        cart.tax +

        cart.shippingCharge -

        cart.totalDiscount;

    await cart.save();

};

export const getOrder = async (

    orderId,

    userId

) => {

    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const query = {
        customer: userId,
        isDeleted: false,
        ...(isObjectId ? { $or: [{ _id: orderId }, { orderNumber: orderId }] } : { orderNumber: orderId })
    };

    const order = await Order.findOne(query)

    .populate("items.product")

    .populate("customer");

    if (!order) {

        throw new Error(

            "Order not found."

        );

    }

    return order;

};

export const validateOrderCancellation = (order) => {

    if (order.isCancelled) {

        throw new Error("Order is already cancelled.");

    }

    if (order.isReturned) {

        throw new Error("Returned orders cannot be cancelled.");

    }

    if (order.status === "Delivered") {

        throw new Error("Delivered orders cannot be cancelled.");

    }

    if (order.status === "Cancelled") {

        throw new Error("Order is already cancelled.");

    }

    if (order.status === "Refunded") {

        throw new Error("Refunded orders cannot be cancelled.");

    }

};

export const restoreInventory = async (order) => {

    for (const item of order.items) {

        await Product.findByIdAndUpdate(

            item.product._id,

            {

                $inc: {

                    stock: item.quantity,

                    sold: -item.quantity,

                    totalPurchased: -item.quantity,

                    grossRevenue:

                        -(item.sellingPrice * item.quantity)

                }

            }

        );

    }

};

export const updateCancelledOrder = async (

    order,

    cancelReason

) => {

    order.status = "Cancelled";

    order.isCancelled = true;

    order.cancelledAt = new Date();

    order.cancelReason = cancelReason || "";

    order.inventoryRestored = true;
    // COD
    if (order.payment.method === "COD") {

        order.payment.status = "Cancelled";

    }

    // Razorpay
    // We'll add refund logic here later.

    await order.save();

    return order;

};

export const placeCODOrderService = async (req) => {

    const { uid } = req.user;

    const {

        items,

        shippingAddressId,

        deliveryOption,

        couponCode,

        customerNotes,

        phoneNumber,

        phone

    } = req.body;

    // =====================================
    // USER
    // =====================================

    const user = await getUser(uid);

    // =====================================
    // ADDRESS
    // =====================================

    const shippingAddress = getShippingAddress(

        user,

        shippingAddressId,

        phoneNumber || phone

    );

    // =====================================
    // PRODUCTS
    // =====================================

    const productMap = await getProducts(items);

    // =====================================
    // STOCK VALIDATION
    // =====================================

    const validatedItems = validateStock(

        items,

        productMap

    );

    // =====================================
    // CREATE ORDER
    // =====================================

    const {

        order,

        pricing

    } = await createOrder({

        user,

        shippingAddress,

        validatedItems,

        deliveryOption,

        couponCode,

        customerNotes

    });

    // =====================================
    // UPDATE INVENTORY
    // =====================================

    await updateInventory(validatedItems);

    // =====================================
    // UPDATE USER
    // =====================================

    await updateUserStatistics(

        user,

        pricing.grandTotal

    );

    // =====================================
    // REMOVE ITEMS FROM CART
    // =====================================

    await removePurchasedItemsFromCart(

        user,

        validatedItems

    );

    // =====================================
    // RETURN ORDER
    // =====================================

    await order.populate("customer");

    await order.populate("items.product");

    return order;

};



export const cancelOrderService = async (req) => {

    const { uid } = req.user;

    const { orderId } = req.params;

    const cancelReason = req.body?.cancelReason || req.body?.reason || "";

    // =====================================
    // USER
    // =====================================

    const user = await getUser(uid);

    // =====================================
    // ORDER
    // =====================================

    const order = await getOrder(

        orderId,

        user._id

    );
    validateOrderCancellation(order);

    // =====================================
    // RESTORE INVENTORY
    // =====================================

    await restoreInventory(order);

    // =====================================
    // UPDATE ORDER
    // =====================================

    await updateCancelledOrder(

        order,

        cancelReason

    );

    // =====================================
    // RETURN ORDER
    // =====================================

    await order.populate("customer");

    await order.populate("items.product");

    return order;

};

export const validateOrderReturn = (order) => {
    if (order.isReturned || order.status === "Returned") {
        throw new Error("Order is already returned.");
    }

    if (order.isCancelled || order.status === "Cancelled") {
        throw new Error("Cancelled orders cannot be returned.");
    }

    if (order.status !== "Delivered") {
        throw new Error("Only delivered orders can be returned.");
    }

    // 7-day return window validation (from delivery timestamp)
    const deliveryTime = order.shipping?.deliveredAt
        ? new Date(order.shipping.deliveredAt).getTime()
        : order.updatedAt
        ? new Date(order.updatedAt).getTime()
        : new Date(order.createdAt).getTime();

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - deliveryTime > SEVEN_DAYS_MS) {
        throw new Error("Return window has expired. Orders can only be returned within 7 days of delivery.");
    }
};

export const updateReturnedOrder = async (
    order,
    returnReason
) => {
    order.status = "Returned";
    order.isReturned = true;
    order.returnedAt = new Date();
    order.returnReason = returnReason || "";
    order.inventoryRestored = true;

    await order.save();
    return order;
};

export const returnOrderService = async (req) => {
    const { uid } = req.user;
    const { orderId } = req.params;
    const returnReason = req.body?.returnReason || req.body?.reason || "";

    const user = await getUser(uid);

    const order = await getOrder(
        orderId,
        user._id
    );

    validateOrderReturn(order);

    if (!order.inventoryRestored) {
        await restoreInventory(order);
    }

    await updateReturnedOrder(
        order,
        returnReason
    );

    await order.populate("customer");
    await order.populate("items.product");

    return order;
};