// ⚠️ PHẢI đặt TRƯỚC tất cả require khác để đảm bảo toàn bộ app chạy ở UTC+7
// Fix lỗi lệch ngày khi deploy lên server Linux (Azure/Docker chạy UTC mặc định)
process.env.TZ = 'Asia/Ho_Chi_Minh';

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const env = require("./src/config/env");
const { payOS } = require("./src/config/payos");
const { startPayosPendingTimeoutJob } = require("./src/jobs/payosPendingTimeoutJob");
const { startAttendanceJob } = require("./src/jobs/attendanceJob");
const { startCashDeliveryAutoPaidJob } = require("./src/jobs/cashDeliveryAutoPaidJob");

const PORT = env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

app.set("io", io);

let stopPayosPendingTimeoutJob = null;
let stopAttendanceJob = null;
let stopCashDeliveryAutoPaidJob = null;

if (env.NODE_ENV !== "test") {
  stopPayosPendingTimeoutJob = startPayosPendingTimeoutJob({
    timeoutMinutes: 5,
    intervalMs: 60 * 1000,
  });

  stopAttendanceJob = startAttendanceJob({
    intervalMs: 30 * 60 * 1000, // Every 30 minutes
  });

  // Auto paid for cash delivery orders after 45 minutes of being completed
  stopCashDeliveryAutoPaidJob = startCashDeliveryAutoPaidJob({
    timeoutMinutes: 3,
    intervalMs: 10 * 1000,
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
  if (typeof stopAttendanceJob === "function") {
    stopAttendanceJob();
  }
  if (typeof stopCashDeliveryAutoPaidJob === "function") {
    stopCashDeliveryAutoPaidJob();
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
