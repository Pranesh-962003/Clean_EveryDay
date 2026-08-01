import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { connectDb } from "./src/config/DataBase.js";
import admin from "./src/config/firebase.js";
import { getApp } from "firebase-admin/app";
import authRouter from "./src/routes/authRoutes.js";
import adminRouter from "./src/routes/adminRoutes.js";
import userRouter from "./src/routes/userRoutes.js";
import {productRouter,pubilcProductRouter} from "./src/routes/productRoutes.js";
import orderRouter from "./src/routes/orderRoutes.js";
import reviewRouter from "./src/routes/reviewRoutes.js";
import cartRouter from "./src/routes/cartRoutes.js";




const app = express();

// Ensure Database connection for serverless function invocations
app.use(async (req, res, next) => {
  await connectDb();
  next();
});

// =========================
// Security Middleware
// =========================
app.use(helmet());

const allowedOrigins = [
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim().replace(/\/$/, '') : null,
  process.env.ADMIN_FRONTEND_URL ? process.env.ADMIN_FRONTEND_URL.trim().replace(/\/$/, '') : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  })
);

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// =========================
// Body Parser
// =========================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true ,   limit: "50mb"}));

// =========================
// Other Middleware
// =========================
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// =========================
// Health Check
// =========================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is running 🚀",
  });
});

try {
  if (getApps().length > 0) {
    console.log("Firebase App Name:", getApp().name);
  }
} catch (err) {
  console.warn("Firebase not initialized:", err.message);
}

// Routes
// =========================

app.use("/api/auth", authRouter);
app.use('/api/auth/admin',adminRouter)
app.use("/api/users", userRouter);
app.use("/api/admin",productRouter);
app.use("/api/products", pubilcProductRouter);


//Order routes
app.use("/api/orders",orderRouter)


//cart Routes
app.use("/api/carts",cartRouter)

//Review Router
app.use("/api/reviews",reviewRouter)
// console.log(Cloudinary.api);

// =========================
// =========================
// 404 Handler
// =========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;