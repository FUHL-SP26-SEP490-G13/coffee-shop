const AdminDashboardRepository = require("../repositories/AdminDashboardRepository");

class AdminDashboardService {
  async getOverview() {
    const revenueToday = await AdminDashboardRepository.getRevenueToday();
    const ordersToday = await AdminDashboardRepository.getOrdersToday();
    const totalUsers = await AdminDashboardRepository.getTotalUsers();
    const activeDiscounts = await AdminDashboardRepository.getActiveDiscounts();
    const totalNewsletterSubscribers =
      await AdminDashboardRepository.getTotalNewsletterSubscribers();

    // Bạn có thể thêm vài số “hữu dụng” cho dashboard
    const revenueSeries7Days = await AdminDashboardRepository.getRevenueSeries({
      days: 7,
    });
    const topProducts7Days = await AdminDashboardRepository.getTopProducts({
      days: 7,
      limit: 5,
    });

    return {
      revenueToday,
      ordersToday,
      totalUsers,
      activeDiscounts,
      totalNewsletterSubscribers,
      revenueSeries7Days, // để FE vẽ chart khỏi gọi thêm endpoint cũng được
      topProducts7Days, // để FE render top 5
    };
  }

  async getRevenueSeries({ days }) {
    return AdminDashboardRepository.getRevenueSeries({ days });
  }

  async getTopProducts({ days, limit }) {
    return AdminDashboardRepository.getTopProducts({ days, limit });
  }

  async getPaymentMethodBreakdown({ days }) {
    return AdminDashboardRepository.getPaymentMethodBreakdown({ days });
  }
}

module.exports = new AdminDashboardService();
