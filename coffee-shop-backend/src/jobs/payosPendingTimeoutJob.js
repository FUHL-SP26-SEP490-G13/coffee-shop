const OrderRepository = require("../repositories/OrderRepository");

const DEFAULT_TIMEOUT_MINUTES = 5;
const DEFAULT_INTERVAL_MS = 60 * 1000;

function startPayosPendingTimeoutJob({
  timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
  intervalMs = DEFAULT_INTERVAL_MS,
} = {}) {
  const run = async () => {
    try {
      const affectedRows = await OrderRepository.cancelExpiredPendingPayosOrders({
        timeoutMinutes,
      });

      if (affectedRows > 0) {
        console.log(
          `[PayOS Timeout Job] Auto-cancelled ${affectedRows} pending PayOS order(s) older than ${timeoutMinutes} minute(s).`
        );
      }
    } catch (error) {
      console.error("[PayOS Timeout Job] Failed to process expired pending orders:", error);
    }
  };

  // Run once immediately, then continue periodically.
  run();
  const timer = setInterval(run, intervalMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => clearInterval(timer);
}

module.exports = {
  startPayosPendingTimeoutJob,
};
