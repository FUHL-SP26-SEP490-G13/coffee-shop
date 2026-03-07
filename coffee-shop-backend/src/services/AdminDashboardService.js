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

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  async getOrderTypeRevenue({ days }) {
    return AdminDashboardRepository.getOrderTypeRevenue({ days });
  }

  // Optional: tóm tắt tình trạng bàn (occupied, available) để dashboard có thêm vài số liệu hữu ích, hợp DB vì có status trong bảng tables rồi, khỏi phải đoán dựa vào order hay gì đó
  async getTableStatusSummary() {
    return AdminDashboardRepository.getTableStatusSummary();
  }

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian (ví dụ: tuần này vs tuần trước, tháng này vs tháng trước) để xem xu hướng tăng giảm
  async getComparison({ days }) {
    return AdminDashboardRepository.getComparison({ days });
  }

  // Optional: tóm tắt số lượng nhân viên theo vai trò (barista, phục vụ, quản lý) để dashboard có thêm vài số liệu hữu ích
  async getStaffSummary() {
    return AdminDashboardRepository.getStaffSummary();
  }

  // Optional: tóm tắt tình trạng bàn (occupied, available) để dashboard có thêm vài số liệu hữu ích, hợp DB vì có status trong bảng tables rồi, khỏi phải đoán dựa vào order hay gì đó
  async getTableStatus() {
    const result = await AdminDashboardRepository.getTableStatus();

    return {
      totalTables: result.totalTables,
      occupied: result.occupied,
      available: result.available,
    };
  }
}

module.exports = new AdminDashboardService();
