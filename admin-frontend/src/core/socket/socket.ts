import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const getSocketUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URI || "http://localhost:5002/api";
  return envUrl.replace(/\/api\/?$/, "");
};

/**
 * Initialize or get singleton Socket.IO client instance for admin
 * @param token Optional Firebase ID token
 */
export const getSocket = (token?: string | null): Socket => {
  if (!socketInstance) {
    const url = getSocketUrl();
    socketInstance = io(url, {
      auth: {
        token: token || undefined,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      if (import.meta.env.DEV) {
        console.log("[Admin Socket.IO] Connected successfully (id:", socketInstance?.id, ")");
      }
    });

    socketInstance.on("connect_error", (err) => {
      if (import.meta.env.DEV) {
        console.warn("[Admin Socket.IO] Connection error:", err.message);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      if (import.meta.env.DEV) {
        console.log("[Admin Socket.IO] Disconnected:", reason);
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
 * Disconnect socket on total app unmount
 */
export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
