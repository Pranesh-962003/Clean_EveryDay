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
import { getApp, getApps } from "firebase-admin/app";
import authRouter from "./src/routes/authRoutes.js";
import adminRouter from "./src/routes/adminRoutes.js";
import userRouter from "./src/routes/userRoutes.js";
import {productRouter,pubilcProductRouter} from "./src/routes/productRoutes.js";
import orderRouter from "./src/routes/orderRoutes.js";
import reviewRouter from "./src/routes/reviewRoutes.js";
import cartRouter from "./src/routes/cartRoutes.js";
import leadRouter from "./src/routes/leadRoutes.js";
import { startReminderScheduler } from "./src/utils/reminderScheduler.js";




const app = express();

// Trust proxy for Vercel deployment
app.set("trust proxy", 1);

// Ensure Database connection for serverless function invocations
app.use(async (req, res, next) => {
  await connectDb();
  startReminderScheduler();
  next();
});

// =========================
// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);



const allowedOrigins = [
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim().replace(/\/$/, '') : null,
  process.env.ADMIN_FRONTEND_URL ? process.env.ADMIN_FRONTEND_URL.trim().replace(/\/$/, '') : null,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        cleanOrigin.startsWith("http://localhost:") ||
        cleanOrigin.startsWith("http://127.0.0.1:") ||
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.length === 0
      ) {
        return callback(null, cleanOrigin);
      }
      return callback(null, cleanOrigin);
    },
    credentials: true,
  })
);



app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 500 : 5000,
    validate: { trustProxy: false },
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

// Routes (Supported with and without /api prefix for Vercel rewrites)
// =========================

app.use("/api/auth", authRouter);
app.use("/auth", authRouter);

app.use("/api/auth/admin", adminRouter);
app.use("/auth/admin", adminRouter);

app.use("/api/users", userRouter);
app.use("/users", userRouter);

app.use("/api/admin", productRouter);
app.use("/admin", productRouter);

app.use("/api/products", pubilcProductRouter);
app.use("/products", pubilcProductRouter);

app.use("/api/orders", orderRouter);
app.use("/orders", orderRouter);

app.use("/api/carts", cartRouter);
app.use("/carts", cartRouter);

app.use("/api/reviews", reviewRouter);
app.use("/reviews", reviewRouter);

app.use("/api/leads", leadRouter);
app.use("/leads", leadRouter);
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