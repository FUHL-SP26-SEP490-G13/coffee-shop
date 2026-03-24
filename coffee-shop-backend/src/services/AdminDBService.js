const AdminDBRepository = require("../repositories/AdminDBRepository");

class AdminDBService {
  async getOverview() {
    const revenueToday = await AdminDBRepository.getRevenueToday();
    const ordersToday = await AdminDBRepository.getOrdersToday();
    const totalUsers = await AdminDBRepository.getTotalUsers();
    const activeDiscounts = await AdminDBRepository.getActiveDiscounts();
    const totalNewsletterSubscribers =
      await AdminDBRepository.getTotalNewsletterSubscribers();

    // Bạn có thể thêm vài số “hữu dụng” cho dashboard
    const revenueSeries7Days = await AdminDBRepository.getRevenueSeries({
      days: 7,
    });
    const topProducts7Days = await AdminDBRepository.getTopProducts({
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
    return AdminDBRepository.getRevenueSeries({ days });
  }

  async getTopProducts({ days, limit }) {
    return AdminDBRepository.getTopProducts({ days, limit });
  }

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  async getOrderTypeRevenue({ days }) {
    return AdminDBRepository.getOrderTypeRevenue({ days });
  }

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian (ví dụ: tuần này vs tuần trước, tháng này vs tháng trước) để xem xu hướng tăng giảm
  async getComparison({ days }) {
    return AdminDBRepository.getComparison({ days });
  }


}

module.exports = new AdminDBService();
