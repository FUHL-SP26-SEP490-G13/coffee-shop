const AttendanceService = require("../services/AttendanceService");

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // Run every hour

function startAttendanceJob({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
  const run = async () => {
    try {
      const result = await AttendanceService.executeAutoCronLogic();

      if (result.absent > 0 || result.missing_checkout > 0) {
        console.log(
          `[Attendance Job] Đã xử lý: ${result.absent} lượt vắng mặt, ${result.missing_checkout} lượt quên check-out.`
        );
      }
    } catch (error) {
      console.error("[Attendance Job] Lỗi cập nhật điểm danh tự động:", error);
    }
  };

  // Run automatically periodically
  const timer = setInterval(run, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  // Also execute immediately once on start
  run();

  return () => clearInterval(timer);
}

module.exports = {
  startAttendanceJob,
};
