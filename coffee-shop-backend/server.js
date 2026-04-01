const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const env = require("./src/config/env");
const { payOS } = require("./src/config/payos");
const { startPayosPendingTimeoutJob } = require("./src/jobs/payosPendingTimeoutJob");

const PORT = env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

let stopPayosPendingTimeoutJob = null;
if (env.NODE_ENV !== "test") {
  stopPayosPendingTimeoutJob = startPayosPendingTimeoutJob({
    timeoutMinutes: 5,
    intervalMs: 60 * 1000,
  });
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-user-room", (userId) => {
    if (!userId) {
      console.log("join-user-room failed: missing userId");
      return;
    }
    socket.join(`user-${userId}`);
    console.log(`${socket.id} joined user-${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
  if (payOS) {
    console.log("💳 PayOS: configured");
  } else {
    console.log("💳 PayOS: missing credentials");
  }
});

const gracefulShutdown = (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);

  if (typeof stopPayosPendingTimeoutJob === "function") {
    stopPayosPendingTimeoutJob();
  }

  server.close(() => {
    console.log("Server closed. Exiting process...");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

module.exports = server;
