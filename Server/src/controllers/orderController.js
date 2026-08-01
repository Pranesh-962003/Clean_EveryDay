import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import {  placeCODOrderService, cancelOrderService } from "../services/orderService.js";





export const placeCODOrder = async (req, res) => {

    try {

        console.log(req.body);
        
        const order = await placeCODOrderService(req);
        const response = {

        orderIdReference: order.orderNumber,

        // transactionId: order.transactionId,

        grandTotalPaid: order.grandTotal,

        paymentMode: order.payment.method,

        expectedArrival: `${order.delivery.estimatedDays}-${Number(order.delivery.estimatedDays) + 1} business days`,

        order

    };
    
        return res.status(201).json({

            success: true,

            message: "Order placed successfully.",

            order:response

        });
        
        

    } catch (error) {

        console.error("Place COD Order Error:", error);

        return res.status(500).json({

            success: false,

            message: error.message || "Failed to place order."

        });

    }

};
// Get all orders of the logged-in user
export const getMyOrders = async (req, res) => {
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
        // Fetch Orders
        // =====================================

        const orders = await Order.find({
            customer: user._id,
            isDeleted: false
        })
            .sort({ createdAt: -1 })
            .select(
                "orderNumber items grandTotal status payment shipping shippingAddress billingAddress createdAt"
            );

        // =====================================
        // Format Response
        // =====================================

        // const formattedOrders = orders.map(order => ({

        //     _id: order._id,

        //     orderNumber: order.orderNumber,

        //     items: order.items,

        //     totalItems: order.items.reduce(
        //         (total, item) => total + item.quantity,
        //         0
        //     ),

        //     grandTotal: order.grandTotal,

        //     status: order.status,

        //     paymentStatus: order.payment.status,

        //     paymentMethod: order.payment.method,

        //     courier: order.shipping?.courier || "",

        //     trackingId: order.shipping?.trackingId || "",

        //     estimatedDelivery:
        //         order.shipping?.estimatedDelivery || null,

        //     createdAt: order.createdAt,

        //     firstProductImage:
        //         order.items.length > 0
        //             ? order.items[0].image
        //             : "",

        //     firstProductName:
        //         order.items.length > 0
        //             ? order.items[0].title
        //             : "",

        //     shippingAddress: order.shippingAddress,

        //     billingAddress: order.billingAddress

        // }));

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            totalOrders: orders.length,

            orders: orders

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to fetch orders.",

            error: error.message

        });

    }
};


//Cancel The order
export const cancelOrder = async (req, res) => {

    try {
        console.log("Request Body: ", req.body);

        const order = await cancelOrderService(req);

        return res.status(200).json({

            success: true,

            message: "Order cancelled successfully.",

            order

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};

// export const cancelOrder = async (req, res) => {
//     try {

//         const { uid } = req.user;
//         const { orderId } = req.params;
//         const { reason } = req.body;

//         // =====================================
//         // Find User
//         // =====================================

//         const user = await User.findOne({
//             uid,
//             isDeleted: false
//         });

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found."
//             });
//         }

//         // =====================================
//         // Find Order
//         // =====================================

//         const order = await Order.findOne({
//             _id: orderId,
//             customer: user._id,
//             isDeleted: false
//         });

//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Order not found."
//             });
//         }

//         // =====================================
//         // Already Cancelled
//         // =====================================

//         if (order.isCancelled) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Order is already cancelled."
//             });
//         }

//         // =====================================
//         // Check Order Status
//         // =====================================

//         const cancellableStatus = [
//             "Pending",
//             "Confirmed"
//         ];

//         if (!cancellableStatus.includes(order.status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Order cannot be cancelled once it is ${order.status}.`
//             });
//         }

//         // =====================================
//         // Restore Inventory
//         // =====================================

//         for (const item of order.items) {

//             const product = await Product.findOne({
//                 _id: item.product,
//                 isDeleted: false
//             });

//             if (!product) continue;

//             product.stock += item.quantity;

//             product.sold = Math.max(
//                 0,
//                 product.sold - item.quantity
//             );

//             product.grossRevenue = Math.max(
//                 0,
//                 product.grossRevenue - item.totalPrice
//             );

//             await product.save();

//         }

//         // =====================================
//         // Update User Statistics
//         // =====================================

//         user.totalOrders = Math.max(
//             0,
//             user.totalOrders - 1
//         );

//         user.totalSpent = Math.max(
//             0,
//             user.totalSpent - order.grandTotal
//         );

//         await user.save();

//         // =====================================
//         // Update Order
//         // =====================================

//         order.status = "Cancelled";

//         order.isCancelled = true;

//         order.cancelledAt = new Date();

//         order.cancelReason = reason || "Cancelled by customer";

//         await order.save();

//         // =====================================
//         // Response
//         // =====================================

//         return res.status(200).json({

//             success: true,

//             message: "Order cancelled successfully.",

//             order

//         });

//     } catch (error) {

//         console.error(error);

//         return res.status(500).json({

//             success: false,

//             message: "Failed to cancel order.",

//             error: error.message

//         });

//     }
// };


export const updateOrderStatus = async (req, res) => {
    try {

        const { id } = req.params;
        const { status } = req.body;

        const allowedStatus = [
            "Pending",
            "Confirmed",
            "Packed",
            "Ready for Dispatch",
            "Shipped",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
            "Returned",
            "Refunded"
        ];

        // =====================================
        // Validate Status
        // =====================================

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status."
            });
        }

        // =====================================
        // Find Order
        // =====================================

        const order = await Order.findOne({
            _id: id,
            isDeleted: false
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        // =====================================
        // Ensure Shipping Exists
        // =====================================

        if (!order.shipping) {
            order.shipping = {
                courier: "",
                trackingId: "",
                trackingUrl: "",
                shippedAt: null,
                deliveredAt: null,
                estimatedDelivery: null
            };
        }

        // =====================================
        // Prevent Updating Delivered Orders
        // =====================================

        if (
            order.status === "Delivered" &&
            status !== "Refunded"
        ) {
            return res.status(400).json({
                success: false,
                message: "Delivered orders cannot be modified."
            });
        }

        // =====================================
        // Shipping Dates
        // =====================================

        if (
            status === "Shipped" &&
            !order.shipping.shippedAt
        ) {
            order.shipping.shippedAt = new Date();
        }

        if (
            status === "Delivered" &&
            !order.shipping.deliveredAt
        ) {

            order.shipping.deliveredAt = new Date();

            if (
                order.payment &&
                order.payment.method === "COD" &&
                order.payment.status !== "Paid"
            ) {
                order.payment.status = "Paid";
                order.payment.paidAt = new Date();
            }

        }

        // =====================================
        // Restore Inventory (Only Once)
        // =====================================

        if (
            (status === "Cancelled" ||
                status === "Returned") &&
            !order.inventoryRestored
        ) {

            for (const item of order.items) {

                const product = await Product.findById(item.product);

                if (!product) continue;

                product.stock += item.quantity;

                product.sold = Math.max(
                    0,
                    product.sold - item.quantity
                );

                product.grossRevenue = Math.max(
                    0,
                    product.grossRevenue - item.totalPrice
                );

                await product.save();

            }

            order.inventoryRestored = true;

        }

        // =====================================
        // Refund
        // =====================================

        if (
            status === "Refunded" &&
            order.payment
        ) {

            order.payment.status = "Refunded";
            order.payment.refundAmount = order.grandTotal;

        }

        // =====================================
        // Cancel Information
        // =====================================

        if (
            status === "Cancelled" &&
            !order.isCancelled
        ) {

            order.isCancelled = true;
            order.cancelledAt = new Date();

        }

        // =====================================
        // Return Information
        // =====================================

        if (
            status === "Returned" &&
            !order.isReturned
        ) {

            order.isReturned = true;
            order.returnedAt = new Date();

        }

        // =====================================
        // Update Status
        // =====================================

        order.status = status;

        await order.save();

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            message: "Order status updated successfully.",

            order

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to update order status.",

            error: error.message

        });

    }
};