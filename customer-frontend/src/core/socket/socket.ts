import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const getSocketUrl = (): string => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.trim().replace(/\/+$/, "");
  }
  const envUrl = (import.meta.env.VITE_BACKEND_URI || "http://localhost:5002/api").trim();
  return envUrl.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
};

/**
 * Initialize or get singleton Socket.IO client instance
 * @param token Optional Firebase ID token
 */
export const getSocket = (token?: string | null): Socket => {
  if (!socketInstance) {
    const url = getSocketUrl();
    socketInstance = io(url, {
      path: "/socket.io/",
      auth: {
        token: token || undefined,
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      // Quiet background log
      if (import.meta.env.DEV) {
        console.log("[Socket.IO] Connected successfully (id:", socketInstance?.id, ")");
      }
    });

    socketInstance.on("connect_error", (err) => {
      if (import.meta.env.DEV) {
        console.warn("[Socket.IO] Connection error:", err.message);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      if (import.meta.env.DEV) {
        console.log("[Socket.IO] Disconnected:", reason);
      }
    });
  } else if (token && socketInstance.auth && (socketInstance.auth as any).token !== token) {
    (socketInstance.auth as any).token = token;
    if (socketInstance.connected) {
      socketInstance.emit("authenticate", { token });
    }
  }

  return socketInstance;
};

/**
 * Authenticate existing socket connection with a fresh token
 * @param token Firebase ID token
 */
export const updateSocketAuth = (token: string | null): void => {
  if (!socketInstance) {
    if (token) getSocket(token);
    return;
  }

  (socketInstance.auth as any).token = token || undefined;

  if (token) {
    if (socketInstance.connected) {
      socketInstance.emit("authenticate", { token });
    } else {
      socketInstance.connect();
    }
  }
};

/**
 * Join active product room for real-time review updates
 */
export const joinProductRoom = (productId: string): void => {
  if (socketInstance && productId) {
    socketInstance.emit("join:product", productId);
  }
};

/**
 * Leave active product room
 */
export const leaveProductRoom = (productId: string): void => {
  if (socketInstance && productId) {
    socketInstance.emit("leave:product", productId);
  }
};

/**
 * Disconnect socket on total app unmount
 */
export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
