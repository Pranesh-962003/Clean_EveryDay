import "dotenv/config";
import http from "http";
import app from "./app.js";
import { initSocket } from "./src/socket/index.js";

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.IO enabled 🚀`);
  });
}

export { httpServer };
export default app;