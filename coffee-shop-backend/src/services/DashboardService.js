const DashboardRepository = require("../repositories/DashboardRepository");

class DashboardService {
  async getOverview() {
    const revenueToday = await DashboardRepository.getRevenueToday();
    const ordersToday = await DashboardRepository.getOrdersToday();
    const totalUsers = await DashboardRepository.getTotalUsers();
    const activeDiscounts = await DashboardRepository.getActiveDiscounts();

    // Bạn có thể thêm vài số “hữu dụng” cho dashboard
    const revenueSeries7Days = await DashboardRepository.getRevenueSeries({
      days: 7,
    });
    const topProducts7Days = await DashboardRepository.getTopProducts({
      days: 7,
      limit: 5,
    });

    return {
      revenueToday,
      ordersToday,
      totalUsers,
      activeDiscounts,
      revenueSeries7Days, // để FE vẽ chart khỏi gọi thêm endpoint cũng được
      topProducts7Days, // để FE render top 5
    };
  }

  async getRevenueSeries({ days }) {
    return DashboardRepository.getRevenueSeries({ days });
  }

  async getTopProducts({ days, limit }) {
    return DashboardRepository.getTopProducts({ days, limit });
  }

  async getPaymentMethodBreakdown({ days }) {
    return DashboardRepository.getPaymentMethodBreakdown({ days });
  }
}

module.exports = new DashboardService();
