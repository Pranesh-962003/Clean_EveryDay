import { Server } from "socket.io";
import { getAuth } from "firebase-admin/auth";
import { User } from "../models/User.js";

let io = null;

/**
 * Initialize Socket.IO with HTTP Server
 * @param {import("http").Server} httpServer
 */
export const initSocket = (httpServer) => {
  if (io) return io;

  const parseOrigins = (val) => {
    if (!val) return [];
    return val
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
  };

  const allowedOrigins = [
    "https://clean-every-day.vercel.app",
    "https://clean-every-day-244d.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    ...parseOrigins(process.env.FRONTEND_URL),
    ...parseOrigins(process.env.ADMIN_FRONTEND_URL),
  ].filter(Boolean);

  io = new Server(httpServer, {
    path: "/socket.io/",
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, "");
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
    },
    transports: ["polling", "websocket"],
    allowUpgrades: true,
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Authentication Middleware for connection
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : null);

      if (token) {
        try {
          const decoded = await getAuth().verifyIdToken(token);
          const user = await User.findOne({
            uid: decoded.uid,
            isDeleted: false,
          });

          if (user) {
            socket.user = user;
            socket.userId = user._id.toString();
            socket.uid = decoded.uid;
            socket.isAdmin = !!(user.isAdmin && user.role === "Admin");
          }
        } catch (authErr) {
          console.warn("[Socket.IO] Invalid/expired token during handshake, proceeding as guest:", authErr.message);
        }
      }

      next();
    } catch (err) {
      console.error("[Socket.IO] Middleware Error:", err);
      next();
    }
  });

  io.on("connection", (socket) => {
    // Join authenticated rooms
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      socket.join(`user:${socket.uid}`);
    }

    if (socket.isAdmin) {
      socket.join("admin");
    }

    // Dynamic authentication listener
    socket.on("authenticate", async (data, callback) => {
      try {
        const token = data?.token;
        if (!token) {
          if (typeof callback === "function") callback({ success: false, message: "Token required" });
          return;
        }

        const decoded = await getAuth().verifyIdToken(token);
        const user = await User.findOne({
          uid: decoded.uid,
          isDeleted: false,
        });

        if (!user) {
          if (typeof callback === "function") callback({ success: false, message: "User not found" });
          return;
        }

        socket.user = user;
        socket.userId = user._id.toString();
        socket.uid = decoded.uid;
        socket.isAdmin = !!(user.isAdmin && user.role === "Admin");

        socket.join(`user:${socket.userId}`);
        socket.join(`user:${socket.uid}`);

        if (socket.isAdmin) {
          socket.join("admin");
        }

        if (typeof callback === "function") {
          callback({
            success: true,
            user: {
              id: user._id,
              email: user.email,
              isAdmin: socket.isAdmin,
            },
          });
        }
      } catch (err) {
        console.error("[Socket.IO] Authenticate event error:", err.message);
        if (typeof callback === "function") callback({ success: false, message: err.message });
      }
    });

    // Room subscription for product detail pages
    socket.on("join:product", (productId) => {
      if (productId) {
        socket.join(`product:${productId}`);
      }
    });

    socket.on("leave:product", (productId) => {
      if (productId) {
        socket.leave(`product:${productId}`);
      }
    });

    socket.on("disconnect", (reason) => {
      // Clean socket reference automatically managed by socket.io
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 * @returns {import("socket.io").Server}
 */
export const getIO = () => {
  return io;
};

/**
 * Broadcast event to all connected clients
 * @param {string} event
 * @param {any} data
 */
export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Broadcast event to a specific room
 * @param {string} room
 * @param {string} event
 * @param {any} data
 */
export const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

/**
 * Broadcast event to a specific user by database _id or Firebase uid
 * @param {string} userId
 * @param {string} event
 * @param {any} data
 */
export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

/**
 * Broadcast event to admin room
 * @param {string} event
 * @param {any} data
 */
export const emitToAdmin = (event, data) => {
  if (io) {
    io.to("admin").emit(event, data);
  }
};
