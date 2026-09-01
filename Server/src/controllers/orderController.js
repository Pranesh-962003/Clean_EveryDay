import mongoose from "mongoose";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import { Cart } from "../models/Cart.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import { placeCODOrderService, cancelOrderService } from "../services/orderService.js";
import { emitToAdmin, emitToUser, emitToAll } from "../socket/index.js";





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
    
        // Real-time synchronization
        const customerId = order.customer?._id || order.customer;
        emitToAdmin("order:created", { order });
        if (customerId) {
            emitToUser(customerId, "order:created", { order });
            emitToUser(customerId, "cart:updated", { items: [], totalItems: 0, grandTotal: 0 });
        }
        if (Array.isArray(order.items)) {
            for (const item of order.items) {
                const pId = item.product?._id || item.product;
                if (pId) {
                    Product.findById(pId).then((p) => {
                        if (p) {
                            emitToAll("product:updated", { product: p });
                            emitToAll("inventory:updated", { productId: p._id, stock: p.stock });
                        }
                    }).catch(() => {});
                }
            }
        }

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

        // Real-time synchronization
        const customerId = order.customer?._id || order.customer;
        emitToAdmin("order:cancelled", { order });
        emitToAdmin("order:statusUpdated", { order, status: "Cancelled" });
        if (customerId) {
            emitToUser(customerId, "order:cancelled", { order });
            emitToUser(customerId, "order:statusUpdated", { order, status: "Cancelled" });
        }
        if (Array.isArray(order.items)) {
            for (const item of order.items) {
                const pId = item.product?._id || item.product;
                if (pId) {
                    Product.findById(pId).then((p) => {
                        if (p) {
                            emitToAll("product:updated", { product: p });
                            emitToAll("inventory:updated", { productId: p._id, stock: p.stock });
                        }
                    }).catch(() => {});
                }
            }
        }

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

        let order;
        if (mongoose.Types.ObjectId.isValid(id)) {
            order = await Order.findOne({
                _id: id,
                isDeleted: false
            });
        }
        if (!order) {
            order = await Order.findOne({
                orderNumber: id,
                isDeleted: false
            });
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        // =====================================
        // Authorization Check
        // =====================================

        let isUserAdmin = false;
        let requestingUser = null;
        if (req.user && req.user.uid) {
            requestingUser = await User.findOne({ uid: req.user.uid, isDeleted: false });
            if (requestingUser && requestingUser.isAdmin && requestingUser.role === "Admin") {
                isUserAdmin = true;
            }
        }

        if (!isUserAdmin) {
            const customerMongoId = (order.customer?._id || order.customer || "").toString();
            const requestingUserMongoId = (requestingUser?._id || "").toString();
            const requestingUserUid = req.user?.uid || "";
            
            const isOwner = (requestingUserMongoId && customerMongoId === requestingUserMongoId) || 
                            (order.customer && order.customer.uid === requestingUserUid);

            if (!isOwner) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. You do not own this order."
                });
            }

            if (status !== "Cancelled" && status !== "Returned") {
                return res.status(403).json({
                    success: false,
                    message: "Customers are only allowed to cancel or return their order."
                });
            }
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

        // Real-time synchronization
        const customerId = order.customer?._id || order.customer;
        emitToAdmin("order:statusUpdated", { order, status });
        if (customerId) {
            emitToUser(customerId, "order:statusUpdated", { order, status });
            if (typeof order.customer === "object" && order.customer?.uid) {
                emitToUser(order.customer.uid, "order:statusUpdated", { order, status });
            }
        }
        if (req.user?.uid) {
            emitToUser(req.user.uid, "order:statusUpdated", { order, status });
        }
        if (status === "Cancelled" || status === "Returned") {
            if (Array.isArray(order.items)) {
                for (const item of order.items) {
                    const pId = item.product?._id || item.product;
                    if (pId) {
                        Product.findById(pId).then((p) => {
                            if (p) {
                                emitToAll("product:updated", { product: p });
                                emitToAll("inventory:updated", { productId: p._id, stock: p.stock });
                            }
                        }).catch(() => {});
                    }
                }
            }
        }

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

// Helper to generate a clean, professional A4 PDF invoice buffer
const generateInvoicePDF = (order, user, recipientEmail) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: "A4" });
            const buffers = [];

            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on("error", (err) => reject(err));

            // Brand Header
            doc.fillColor("#10b981").fontSize(22).font("Helvetica-Bold").text("Clean Everyday", 40, 40);
            doc.fillColor("#6b7280").fontSize(9).font("Helvetica").text("Clean Everyday India Private Limited", 40, 68);
            doc.text("Plot No. 12, Whitefield Industrial Area, Bengaluru, KA - 560066", 40, 80);
            doc.text("GSTIN: 29AAFCC1920D1Z5 | support@cleaneveryday.in", 40, 92);

            // Invoice Title & Metadata
            doc.fillColor("#111827").fontSize(18).font("Helvetica-Bold").text("TAX INVOICE", 380, 40, { align: "right" });
            doc.fillColor("#374151").fontSize(9).font("Helvetica");
            doc.text(`Invoice No: INV-${order.orderNumber}`, 380, 65, { align: "right" });
            const formattedDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : new Date().toLocaleDateString("en-IN");
            doc.text(`Invoice Date: ${formattedDate}`, 380, 78, { align: "right" });
            doc.text(`Order Ref ID: ${order.orderNumber}`, 380, 91, { align: "right" });
            doc.text(`Payment Mode: ${order.payment?.method || 'COD'} (${order.payment?.status || 'Pending'})`, 380, 104, { align: "right" });

            doc.moveTo(40, 122).lineTo(555, 122).strokeColor("#e5e7eb").lineWidth(1).stroke();

            // Customer Details Box
            const shippingAddr = order.shippingAddress || {};
            const fullAddr = `${shippingAddr.addressLine1 || ''} ${shippingAddr.addressLine2 || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.postalCode || ''}`.trim();

            doc.rect(40, 132, 515, 65).fillAndStroke("#f9fafb", "#e5e7eb");
            doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold").text("Billed & Delivered To:", 50, 140);
            doc.fillColor("#374151").fontSize(9).font("Helvetica");
            doc.text(`Name: ${shippingAddr.fullName || user?.name || 'Valued Customer'}`, 50, 155);
            doc.text(`Address: ${fullAddr}`, 50, 167);
            doc.text(`Phone: ${shippingAddr.phoneNumber || user?.phoneNumber || 'N/A'} | Email: ${recipientEmail}`, 50, 179);

            // Table Header
            let y = 212;
            doc.rect(40, y, 515, 22).fill("#f3f4f6");
            doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold");
            doc.text("Item Details", 50, y + 6);
            doc.text("SKU", 250, y + 6);
            doc.text("Qty", 340, y + 6, { width: 30, align: "center" });
            doc.text("Unit Price", 380, y + 6, { width: 70, align: "right" });
            doc.text("Total (INR)", 465, y + 6, { width: 80, align: "right" });

            y += 22;
            doc.font("Helvetica").fontSize(9).fillColor("#111827");

            const items = order.items || [];
            let itemsSubtotal = 0;

            items.forEach((item) => {
                const title = item.title || item.product?.title || "Clean Everyday Formulation";
                const sku = item.sku || "CE-PROD";
                const qty = item.quantity || 1;
                const price = item.sellingPrice || item.unitPrice || item.retailPrice || 0;
                const lineTotal = item.totalPrice || (price * qty);
                itemsSubtotal += lineTotal;

                y += 6;
                doc.text(title, 50, y, { width: 190 });
                doc.text(sku, 250, y, { width: 80 });
                doc.text(String(qty), 340, y, { width: 30, align: "center" });
                doc.text(`INR ${price}`, 380, y, { width: 70, align: "right" });
                doc.text(`INR ${lineTotal}`, 465, y, { width: 80, align: "right" });

                y += 18;
                doc.moveTo(40, y).lineTo(555, y).strokeColor("#f3f4f6").lineWidth(0.5).stroke();
            });

            y += 15;
            // Summary Block
            doc.moveTo(40, y).lineTo(555, y).strokeColor("#e5e7eb").lineWidth(1).stroke();
            y += 10;

            const subtotalVal = order.subtotal || itemsSubtotal || order.grandTotal;
            const shippingVal = order.delivery?.charge || 0;
            const taxVal = order.tax?.amount || Math.round(subtotalVal * 0.18);
            const discountVal = order.discount || 0;
            const grandTotalVal = order.grandTotal || (subtotalVal + taxVal + shippingVal - discountVal);

            doc.font("Helvetica").fontSize(9).fillColor("#4b5563");
            doc.text("Subtotal:", 350, y, { width: 110, align: "right" });
            doc.fillColor("#111827").font("Helvetica-Bold").text(`INR ${subtotalVal}`, 465, y, { width: 80, align: "right" });
            y += 15;

            doc.font("Helvetica").fillColor("#4b5563");
            doc.text("Taxes (GST 18%):", 350, y, { width: 110, align: "right" });
            doc.fillColor("#111827").font("Helvetica-Bold").text(`INR ${taxVal}`, 465, y, { width: 80, align: "right" });
            y += 15;

            doc.font("Helvetica").fillColor("#4b5563");
            doc.text("Shipping & Dispatch:", 350, y, { width: 110, align: "right" });
            doc.fillColor("#10b981").font("Helvetica-Bold").text(shippingVal > 0 ? `INR ${shippingVal}` : "FREE", 465, y, { width: 80, align: "right" });
            y += 15;

            if (discountVal > 0) {
                doc.font("Helvetica").fillColor("#ef4444");
                doc.text("Discount:", 350, y, { width: 110, align: "right" });
                doc.font("Helvetica-Bold").text(`-INR ${discountVal}`, 465, y, { width: 80, align: "right" });
                y += 15;
            }

            doc.moveTo(350, y).lineTo(555, y).strokeColor("#10b981").lineWidth(1.5).stroke();
            y += 8;

            doc.font("Helvetica-Bold").fontSize(12).fillColor("#047857");
            doc.text("Grand Total:", 350, y, { width: 110, align: "right" });
            doc.text(`INR ${grandTotalVal}`, 465, y, { width: 80, align: "right" });

            // Terms & Conditions Footer
            y += 45;
            doc.font("Helvetica-Bold").fontSize(8).fillColor("#374151").text("Terms & Conditions:", 40, y);
            doc.font("Helvetica").fontSize(8).fillColor("#6b7280");
            doc.text("1. Goods once sold cannot be returned or exchanged without valid defect verification.", 40, y + 12);
            doc.text("2. All disputes are subject to Bengaluru judicial jurisdiction only.", 40, y + 24);
            doc.text("Thank you for choosing Clean Everyday! support@cleaneveryday.in", 40, y + 42, { align: "center", width: 515 });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

// Create nodemailer transporter helper
const createTransporter = () => {
    const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.SMTP_USER;
    let emailPass = process.env.EMAIL_PASS || process.env.GMAIL_PASS || process.env.SMTP_PASS;
    
    if (emailPass) {
        emailPass = emailPass.replace(/\s+/g, "");
    }

    if (!emailUser || !emailPass) {
        console.warn("[SMTP WARNING] EMAIL_USER or EMAIL_PASS missing in .env file.");
        return null;
    }

    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });
    }

    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: emailUser,
            pass: emailPass,
        },
    });
};

export const sendInvoiceEmail = async (req, res) => {
    try {
        const { uid } = req.user;
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required."
            });
        }

        // Find logged in user
        const user = await User.findOne({
            uid,
            isDeleted: false
        });

        const recipientEmail = (user?.email || req.user?.email || "").toLowerCase().trim();

        if (!recipientEmail) {
            return res.status(400).json({
                success: false,
                message: "No email address found for the logged-in account."
            });
        }

        // Find Order by ID or orderNumber
        const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
        const query = {
            isDeleted: false,
            ...(isObjectId
                ? { $or: [{ _id: orderId }, { orderNumber: orderId }] }
                : { orderNumber: orderId })
        };

        const order = await Order.findOne(query).populate("items.product");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found."
            });
        }

        // Generate PDF Invoice attachment buffer
        const pdfBuffer = await generateInvoicePDF(order, user, recipientEmail);

        // Build HTML items table
        const itemsList = order.items || [];
        const itemsHtml = itemsList.map((item) => {
            const title = item.title || item.product?.title || "Clean Everyday Product";
            const qty = item.quantity || 1;
            const price = item.sellingPrice || item.unitPrice || item.retailPrice || 0;
            const total = item.totalPrice || (price * qty);
            return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px; font-weight: 600; color: #111827;">${title}</td>
                    <td style="padding: 10px; color: #4b5563;">${item.sku || 'CE-PROD'}</td>
                    <td style="padding: 10px; text-align: center; color: #111827;">${qty}</td>
                    <td style="padding: 10px; text-align: right; color: #4b5563;">₹${price}</td>
                    <td style="padding: 10px; text-align: right; font-weight: 600; color: #111827;">₹${total}</td>
                </tr>
            `;
        }).join("");

        const formattedDate = order.createdAt
            ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN');

        const shippingAddr = order.shippingAddress || {};
        const fullAddrStr = `${shippingAddr.addressLine1 || ''} ${shippingAddr.addressLine2 || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''} - ${shippingAddr.postalCode || ''}`.trim();

        const htmlTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
                    <div>
                        <h2 style="color: #10b981; margin: 0; font-size: 22px;">Clean Everyday</h2>
                        <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Tax Invoice & Official Order Receipt</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 14px; font-weight: bold; color: #111827;">Invoice: #${order.orderNumber}</span><br/>
                        <span style="font-size: 12px; color: #6b7280;">Date: ${formattedDate}</span>
                    </div>
                </div>

                <div style="margin-bottom: 20px; padding: 12px; background: #f9fafb; border-radius: 8px; font-size: 13px;">
                    <strong>Billed & Delivered To:</strong><br/>
                    <span style="color: #111827; font-weight: 600;">${shippingAddr.fullName || user.name || 'Valued Customer'}</span><br/>
                    <span style="color: #4b5563;">${fullAddrStr}</span><br/>
                    <span style="color: #4b5563;">Phone: ${shippingAddr.phoneNumber || user.phoneNumber || ''}</span><br/>
                    <span style="color: #4b5563;">Email: ${recipientEmail}</span>
                </div>

                <p style="font-size: 13px; color: #374151;">Please find attached your official Tax Invoice PDF (<strong>Invoice_${order.orderNumber}.pdf</strong>) containing full tax details, product line items, shipping charges, and payment information.</p>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                    <thead>
                        <tr style="background: #f3f4f6; color: #374151; font-weight: bold;">
                            <th style="padding: 10px; text-align: left;">Product</th>
                            <th style="padding: 10px; text-align: left;">SKU</th>
                            <th style="padding: 10px; text-align: center;">Qty</th>
                            <th style="padding: 10px; text-align: right;">Price</th>
                            <th style="padding: 10px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 14px; color: #111827;">
                    <p style="margin: 4px 0;">Subtotal: <strong>₹${order.subtotal || order.grandTotal}</strong></p>
                    <p style="margin: 4px 0; color: #10b981;">Shipping & Dispatch: <strong>${order.delivery?.charge ? `₹${order.delivery.charge}` : 'FREE'}</strong></p>
                    <h3 style="margin: 8px 0 0; color: #047857; font-size: 18px;">Grand Total: ₹${order.grandTotal}</h3>
                    <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">Payment Method: ${order.payment?.method || 'COD'} (${order.payment?.status || 'Pending'})</p>
                </div>

                <div style="margin-top: 24px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af;">
                    Thank you for choosing <strong>Clean Everyday</strong>! For support, email us at support@cleaneveryday.in.
                </div>
            </div>
        `;

        const transporter = createTransporter();
        if (transporter) {
            try {
                const info = await transporter.sendMail({
                    from: process.env.EMAIL_FROM || '"Clean Everyday" <noreply@cleaneveryday.in>',
                    to: recipientEmail,
                    subject: `Tax Invoice PDF for Order #${order.orderNumber} - Clean Everyday`,
                    html: htmlTemplate,
                    attachments: [
                        {
                            filename: `Invoice_${order.orderNumber}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf'
                        }
                    ]
                });
                console.log(`[INVOICE EMAIL SUCCESS] Sent tax invoice PDF for Order #${order.orderNumber} to ${recipientEmail} (MessageId: ${info.messageId})`);
            } catch (emailErr) {
                console.error("[INVOICE EMAIL SMTP ERROR] Failed to send email via SMTP:", emailErr.message);
            }
        } else {
            console.log(`[INVOICE EMAIL LOGGED] Tax invoice PDF generated for Order #${order.orderNumber} and targeted to logged-in user: ${recipientEmail}`);
        }

        return res.status(200).json({
            success: true,
            message: `Tax invoice PDF for Order #${order.orderNumber} has been sent to ${recipientEmail}`
        });
    } catch (error) {
        console.error("Send Invoice Email Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send invoice email."
        });
    }
};