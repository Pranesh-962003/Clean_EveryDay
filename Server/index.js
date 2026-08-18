import "dotenv/config";
import http from "http";
import app from "./app.js";
import { initSocket, getIO, RUNTIME_INSTANCE_ID } from "./src/socket/index.js";

const PORT = process.env.PORT || 5002;

const httpServer = http.createServer(app);
initSocket(httpServer);

if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.IO enabled (instance=${RUNTIME_INSTANCE_ID}) 🚀`);
  });
}

// Unified Vercel Serverless Entrypoint Handler
export default function handler(req, res) {
  if (req.url && (req.url.startsWith("/socket.io") || req.url.startsWith("/socket.io/"))) {
    const sidMatch = req.url.match(/[?&]sid=([^&]+)/);
    const transportMatch = req.url.match(/[?&]transport=([^&]+)/);
    const sid = sidMatch ? sidMatch[1] : "none";
    const transport = transportMatch ? transportMatch[1] : "unknown";

    console.log(
      `[SOCKET REQUEST] sid=${sid} transport=${transport} method=${req.method} instance=${RUNTIME_INSTANCE_ID} pid=${process.pid} timestamp=${new Date().toISOString()}`
    );

    const io = getIO();
    if (io && io.engine) {
      return io.engine.handleRequest(req, res);
    }
  }
  return app(req, res);
}

export { httpServer };
