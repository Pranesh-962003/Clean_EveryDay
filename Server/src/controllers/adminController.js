import { getAuth } from "firebase-admin/auth";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { Lead } from "../models/Lead.js"; 
import { Banner } from "../models/Banner.js";
import { v2 as cloudinary } from "cloudinary";
import { uploadToCloudinary } from "../utils/cloudinaryUpload.js";
import { emitToAll } from "../socket/index.js";




export const adminLogin = async (req, res) => {
    try {

        const user = req.dbUser;

        user.lastLogin = new Date();
        await user.save();

        // Create Firebase Session Cookie
        const sessionCookie = await getAuth().createSessionCookie(
            req.token,
            {
                expiresIn: 1000 * 60 * 60 * 24 * 5 // 5 Days
            }
        );

        res.cookie("session", sessionCookie, {
            httpOnly: true,
            secure: false, // true in production with HTTPS
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 5
        });

        return res.status(200).json({
            success: true,
            message: "Admin Login Successful",
            user
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Admin Login Failed",
            error: error.message
        });

    }
};



// Admin Dashboard


export const getDashboard = async (req, res) => {
    try {

        // Time boundaries for weekly growth calculation
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const [
            revenue,
            currentWeekRevenueRes,
            previousWeekRevenueRes,
            totalOrders,
            deliveredOrders,
            pendingOrders,
            lowStockAlerts,
            totalProducts,
            totalReviews,
            pendingReviews,
            staffCount,
            activeLeads
        ] = await Promise.all([

            Order.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        status: {
                            $nin: ["Cancelled", "Returned", "Refunded"]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        grossRevenue: {
                            $sum: "$grandTotal"
                        }
                    }
                }
            ]),

            Order.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        status: {
                            $nin: ["Cancelled", "Returned", "Refunded"]
                        },
                        createdAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: "$grandTotal" }
                    }
                }
            ]),

            Order.aggregate([
                {
                    $match: {
                        isDeleted: false,
                        status: {
                            $nin: ["Cancelled", "Returned", "Refunded"]
                        },
                        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: "$grandTotal" }
                    }
                }
            ]),

            Order.countDocuments({
                isDeleted: false
            }),

            Order.countDocuments({
                status: "Delivered",
                isDeleted: false
            }),

            Order.countDocuments({
                status: "Pending",
                isDeleted: false
            }),

            Product.countDocuments({
                stock: {
                    $lte: 5
                },
                isDeleted: false,
                isActive: true
            }),

            Product.countDocuments({
                isDeleted: false,
                isActive: true
            }),

            Review.countDocuments({
                isDeleted: false
            }),

            Review.countDocuments({
                status: "Pending",
                isDeleted: false
            }),

            User.countDocuments({
                isAdmin: true,
                isDeleted: false
            }),

            Lead.countDocuments({
                status: {
                    $in: [
                        "New",
                        "Contacted",
                        "In Progress"
                    ]
                }
            })

        ]);

        const currRev = currentWeekRevenueRes.length > 0 ? currentWeekRevenueRes[0].revenue : 0;
        const prevRev = previousWeekRevenueRes.length > 0 ? previousWeekRevenueRes[0].revenue : 0;

        let grossRevenueGrowth = 0;
        if (prevRev > 0) {
            grossRevenueGrowth = Number((((currRev - prevRev) / prevRev) * 100).toFixed(1));
        } else if (currRev > 0) {
            grossRevenueGrowth = 100.0;
        } else {
            grossRevenueGrowth = 0.0;
        }

        // =====================================
        // Recent Orders
        // =====================================

        const recentOrders = await Order.find({
            isDeleted: false
        })
            .populate(
                "customer",
                "firstName lastName email"
            )
            .sort({
                createdAt: -1
            })
            .limit(5);

        // =====================================
        // Recent Leads
        // =====================================

        const recentLeads = await Lead.find()
            .sort({
                createdAt: -1
            })
            .limit(5);

        // =====================================
        // Recent Customers
        // =====================================

        const recentCustomers = await Order.find({
            isDeleted: false
        })
            .populate(
                "customer",
                "firstName lastName email photoURL"
            )
            .sort({
                createdAt: -1
            })
            .limit(5);

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            stats: {

                grossRevenue:
                    revenue.length > 0
                        ? revenue[0].grossRevenue
                        : 0,

                grossRevenueGrowth,

                totalOrders,

                deliveredOrders,

                pendingOrders,

                lowStockAlerts,

                activeLeads,

                totalProducts,

                totalReviews,

                pendingReviews,

                staffCount

            },

            recentOrders,

            recentLeads,

            recentCustomers

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to load dashboard.",

            error: error.message

        });

    }
};


// Order Registry


export const getOrderRegistry = async (req, res) => {
    try {

        const {
            page = 1,
            limit = 10,
            status,
            paymentStatus,
            search
        } = req.query;

        const filter = {
            isDeleted: false
        };

        if (status && status !== "All") {
            filter.status = status;
        }

        if (paymentStatus && paymentStatus !== "All") {
            filter["payment.status"] = paymentStatus;
        }

        if (search) {
            filter.$or = [
                {
                    orderNumber: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    "shippingAddress.fullName": {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    "shippingAddress.phone": {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        const totalOrders = await Order.countDocuments(filter);

        const orders = await Order.find(filter)
            .populate(
                "customer",
                "email"
            )
            .sort({
                createdAt: -1
            })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const registry = orders.map(order => ({

            id: order.orderNumber,

            _id: order._id,

            date: order.createdAt,

            total: order.grandTotal,

            customerEmail:
                order.customer?.email || "",

            paymentStatus:
                order.payment.status,

            status:
                order.status,

            address: {

                name:
                    order.shippingAddress.fullName,

                phone:
                    order.shippingAddress.phone,

                city:
                    order.shippingAddress.city,

                street:
                    order.shippingAddress.addressLine1,

                addressLine1:
                    order.shippingAddress.addressLine1,

                addressLine2:
                    order.shippingAddress.addressLine2,

                state:
                    order.shippingAddress.state,

                pincode:
                    order.shippingAddress.pincode

            },

            billingAddress: {

                name:
                    order.billingAddress.fullName,

                city:
                    order.billingAddress.city,

                state:
                    order.billingAddress.state,

                street:
                    order.billingAddress.addressLine1,

                addressLine1:
                    order.billingAddress.addressLine1,

                addressLine2:
                    order.billingAddress.addressLine2,

                pincode:
                    order.billingAddress.pincode

            },

            paymentMethod:
                order.payment.method,

            shippingMethod:
                "Standard Delivery",

            taxes:
                order.tax,

            discount:
                order.discount,

            courierCompany:
                order.shipping?.courier || "",

            trackingId:
                order.shipping?.trackingId || "",

            trackingUrl:
                order.shipping?.trackingUrl || "",

            estimatedDelivery:
                order.shipping?.estimatedDelivery || null,

            adminNotes:
                order.adminNotes,

            items:
                order.items.map(item => ({

                    quantity:
                        item.quantity,

                    product: {

                        name:
                            item.title,

                        sku:
                            item.sku,

                        price:
                            item.unitPrice

                    }

                })),

            timeline: [

                {
                    date:
                        order.createdAt,

                    status:
                        "Pending",

                    notes:
                        "Order placed successfully."
                },

                ...(order.shipping?.shippedAt
                    ? [{
                        date:
                            order.shipping.shippedAt,

                        status:
                            "Shipped",

                        notes:
                            "Package handed over to courier."
                    }]
                    : []),

                ...(order.shipping?.deliveredAt
                    ? [{
                        date:
                            order.shipping.deliveredAt,

                        status:
                            "Delivered",

                        notes:
                            "Order delivered successfully."
                    }]
                    : [])

            ]

        }));

        return res.status(200).json({

            success: true,

            currentPage:
                Number(page),

            totalPages:
                Math.ceil(
                    totalOrders / limit
                ),

            totalOrders,

            orders:
                registry

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch order registry.",

            error:
                error.message

        });

    }
};



//Banner Adding by the Admin


export const publishBanners = async (req, res) => {
    try {

        const banners = JSON.parse(req.body.banners || "[]");

        // Helper to extract uploaded file for slot index i
        const getUploadedFile = (prefix, index) => {
            if (!req.files) return null;
            if (Array.isArray(req.files)) {
                // Find by slot-specific fieldname (e.g. desktopImage_0)
                const exact = req.files.find(f => f.fieldname === `${prefix}_${index}`);
                if (exact) return exact;
                // Fallback to array fieldname (e.g. desktopImages)
                const arrayMatches = req.files.filter(f => f.fieldname === `${prefix}s`);
                return arrayMatches[index] || null;
            } else if (typeof req.files === "object") {
                if (req.files[`${prefix}_${index}`]?.[0]) {
                    return req.files[`${prefix}_${index}`][0];
                }
                if (req.files[`${prefix}s`]?.[index]) {
                    return req.files[`${prefix}s`][index];
                }
            }
            return null;
        };

        if (!Array.isArray(banners) || banners.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Banner list is required."
            });
        }

        if (banners.length > 4) {
            return res.status(400).json({
                success: false,
                message: "Maximum 4 banners are allowed."
            });
        }

        const updated = [];

        for (let i = 0; i < banners.length; i++) {

            const banner = banners[i];

            let desktopImage = (banner.desktopImage && banner.desktopImage.startsWith("http")) ? banner.desktopImage : "";
            let desktopImagePublicId = banner.desktopImagePublicId || "";

            let mobileImage = (banner.mobileImage && banner.mobileImage.startsWith("http")) ? banner.mobileImage : "";
            let mobileImagePublicId = banner.mobileImagePublicId || "";

            const desktopFile = getUploadedFile("desktopImage", i);
            const mobileFile = getUploadedFile("mobileImage", i);

            // Upload Desktop Image if new buffer provided
            if (desktopFile && desktopFile.buffer) {

                const result = await uploadToCloudinary(
                    desktopFile.buffer,
                    "banners/desktop"
                );

                desktopImage = result.secure_url;
                desktopImagePublicId = result.public_id;
            }

            // Upload Mobile Image if new buffer provided
            if (mobileFile && mobileFile.buffer) {

                const result = await uploadToCloudinary(
                    mobileFile.buffer,
                    "banners/mobile"
                );

                mobileImage = result.secure_url;
                mobileImagePublicId = result.public_id;
            }

            const slotOrder = banner.displayOrder || (i + 1);

            const savedBanner = await Banner.findOneAndUpdate(
                {
                    displayOrder: slotOrder
                },
                {
                    label: banner.label || `Banner ${slotOrder}`,
                    title: banner.title || "Organic Clean Solutions",
                    subtitle: banner.subtitle || "",
                    ctaText: banner.ctaText || "",
                    ctaLink: banner.ctaLink || "products",

                    desktopImage,
                    desktopImagePublicId,

                    mobileImage,
                    mobileImagePublicId,

                    displayOrder: slotOrder,

                    scheduleStart: banner.scheduleStart || null,
                    scheduleEnd: banner.scheduleEnd || null,

                    isActive: banner.isActive !== undefined ? banner.isActive : true,
                    isDeleted: false
                },
                {
                    upsert: true,
                    returnDocument: "after",
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

            updated.push(savedBanner);
        }

        // Real-time synchronization: Broadcast to all connected customer and admin clients
        emitToAll("banners:updated", { banners: updated, total: updated.length });

        return res.status(200).json({
            success: true,
            message: "Homepage banners published successfully.",
            total: updated.length,
            banners: updated
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to publish banners.",
            error: error.message
        });

    }
};
//Get all the Banners details

export const getAllBanners = async (req, res) => {
    try {

        const banners = await Banner.find({
            isDeleted: false
        })
            .sort({
                displayOrder: 1
            });

        return res.status(200).json({

            success: true,

            total: banners.length,

            banners

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to fetch banners.",

            error: error.message

        });

    }
};