const OrderRepository = require("../repositories/OrderRepository");

const DEFAULT_TIMEOUT_MINUTES = 45;
const DEFAULT_INTERVAL_MS = 60 * 1000; // 1 minute

function startCashDeliveryAutoPaidJob({
  timeoutMinutes = DEFAULT_TIMEOUT_MINUTES,
  intervalMs = DEFAULT_INTERVAL_MS,
} = {}) {
  const run = async () => {
    try {
      const orderIds = await OrderRepository.autoPaidCashDeliveryOrders({
        timeoutMinutes,
      });

      if (orderIds && orderIds.length > 0) {
        // Sync loyalty and reputation for each auto-paid order
        const OrderOnlineService = require("../services/OrderOnlineService");
        for (const orderId of orderIds) {
          try {
            await OrderOnlineService.syncCompletionRewardsForDelivery(orderId);
          } catch (syncError) {
            console.error(`[Cash Delivery Auto-Paid Job] Failed to sync rewards for order ${orderId}:`, syncError);
          }
        }

        console.log(
          `[Cash Delivery Auto-Paid Job] Auto-paid ${orderIds.length} cash delivery order(s) older than ${timeoutMinutes} minute(s).`
        );
      }
    } catch (error) {
      console.error("[Cash Delivery Auto-Paid Job] Failed to process auto-paid orders:", error);
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
  startCashDeliveryAutoPaidJob,
};
