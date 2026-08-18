import "dotenv/config";
import http from "http";
import app from "./app.js";
import { initSocket, getIO } from "./src/socket/index.js";

const PORT = process.env.PORT || 5002;

const httpServer = http.createServer(app);
initSocket(httpServer);

if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.IO enabled 🚀`);
  });
}

// Unified Vercel Serverless Entrypoint Handler
export default function handler(req, res) {
  if (req.url && (req.url.startsWith("/socket.io") || req.url.startsWith("/socket.io/"))) {
    const io = getIO();
    if (io && io.engine) {
      return io.engine.handleRequest(req, res);
    }
  }
  return app(req, res);
}

export { httpServer };
