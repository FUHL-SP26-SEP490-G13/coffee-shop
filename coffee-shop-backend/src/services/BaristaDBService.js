const repository = require("../repositories/BaristaDBRepository");

class BaristaDBService {
  async getOverview() {
    return repository.getOverview();
  }

  async getOrderTrends(hours) {
    return repository.getOrderTrends(hours);
  }

  async getActiveOrders(statuses, filters) {
    const orders = await repository.getActiveOrders(statuses, filters);

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const items = await repository.getOrderItems(order.id);

        return {
          ...order,
          id: Number(order.id),
          itemCount: Number(order.itemCount || 0),
          total_amount: Number(order.total_amount || 0),
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
