const pool = require("../src/config/database");
const LoyaltyService = require("../src/services/LoyaltyService");

async function run() {
  const orderIds = process.argv
    .slice(2)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (orderIds.length === 0) {
    console.error("Usage: node scripts/backfill-loyalty-orders.js <order_id...>");
    process.exitCode = 1;
    return;
  }

  for (const orderId of orderIds) {
    try {
      const result = await LoyaltyService.syncOrderLoyaltyByOrderId(orderId);
      console.log(`Order ${orderId}:`, result);
    } catch (error) {
      console.error(`Order ${orderId}: failed`, error);
      process.exitCode = 1;
    }
  }
}

run()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
