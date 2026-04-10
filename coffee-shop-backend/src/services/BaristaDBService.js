const repository = require("../repositories/BaristaDBRepository");

const MONEY_PER_POINT = 100;
const MONEY_ROUNDING_UNIT = 100;
const LEGACY_DELIVERY_SHIPPING_FEE = 20000;
const DYNAMIC_SHIPPING_ROLLOUT_AT = new Date("2026-04-07T00:00:00.000Z").getTime();

const calculateItemsSubtotal = (items = []) => {
  if (!Array.isArray(items)) return 0;

  return items.reduce((sum, item) => {
    const itemQuantity = Math.max(1, Number(item?.quantity) || 1);
    const unitPrice = Number(item?.price ?? item?.unit_price ?? 0);
    return sum + Math.max(0, unitPrice * itemQuantity);
  }, 0);
};

const shouldUseLegacyShippingFallback = (order) => {
  const createdAtMs = new Date(order?.created_at || 0).getTime();
  return Number.isFinite(createdAtMs) && createdAtMs < DYNAMIC_SHIPPING_ROLLOUT_AT;
};

const getDerivedShippingFee = (order, items = []) => {
  if (String(order?.order_type || "").toLowerCase() !== "delivery") {
    return 0;
  }

  const feeFromOrder = Number(order?.delivery_fee ?? order?.shipping_fee);
  if (Number.isFinite(feeFromOrder) && feeFromOrder > 0) {
    return Math.round(feeFromOrder / MONEY_ROUNDING_UNIT) * MONEY_ROUNDING_UNIT;
  }

  const loyaltyDiscountAmount =
    Math.max(0, Number(order?.used_points || 0)) * MONEY_PER_POINT;
  const orderTotal = Math.max(0, Number(order?.total_amount || 0));
  const itemsSubtotal = calculateItemsSubtotal(items);

  const derived =
    Math.round((orderTotal + loyaltyDiscountAmount - itemsSubtotal) / MONEY_ROUNDING_UNIT) *
    MONEY_ROUNDING_UNIT;
  if (Number.isFinite(derived) && derived > 0) {
    return derived;
  }

  if (shouldUseLegacyShippingFallback(order)) {
    return LEGACY_DELIVERY_SHIPPING_FEE;
  }

  return 0;
};

class BaristaDBService {
  async getOverview() {
    return repository.getOverview();
  }

  async getOrderTrends(hours) {
    return repository.getOrderTrends(hours);
  }

  async getActiveOrders(statuses) {
    const orders = await repository.getActiveOrders(statuses);

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = await repository.getOrderItems(order.id);

        return {
          ...order,
          id: Number(order.id),
          itemCount: Number(order.itemCount || 0),
          total_amount: Number(order.total_amount || 0),
          amount: Number(order.amount || 0),
          discount_amount: Number(order.discount_amount || 0),
          delivery_fee: Number(order.delivery_fee || 0),
          used_points: Number(order.used_points || 0),
          shipping_fee: getDerivedShippingFee(order, items),
          items,
        };
      })
    );

    return enrichedOrders;
  }

  async getDelayedOrders(minutes) {
    const orders = await repository.getDelayedOrders(minutes);
    return orders.map((order) => ({
      ...order,
      id: Number(order.id),
      total_amount: Number(order.total_amount || 0),
    }));
  }

  async getTopProductsToday(limit) {
    return repository.getTopProductsToday(limit);
  }
}

module.exports = new BaristaDBService();
