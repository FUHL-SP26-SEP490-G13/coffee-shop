const AdminDBRepository = require("../repositories/AdminDBRepository");

class AdminDBService {
  async getOverview() {
    const revenueToday = await AdminDBRepository.getRevenueToday();
    const ordersToday = await AdminDBRepository.getOrdersToday();
    const totalUsers = await AdminDBRepository.getTotalUsers();
    const activeDiscounts = await AdminDBRepository.getActiveDiscounts();

    return {
      revenueToday,
      ordersToday,
      totalUsers,
      activeDiscounts,
    };
  }

  async getRevenueSeries({ startDate, endDate }) {
    return AdminDBRepository.getRevenueSeries({ startDate, endDate });
  }

  async getTopProducts({ startDate, endDate, limit }) {
    return AdminDBRepository.getTopProducts({ startDate, endDate, limit });
  }

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  async getOrderTypeRevenue({ startDate, endDate }) {
    return AdminDBRepository.getOrderTypeRevenue({ startDate, endDate });
  }

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian
  async getComparison({ startDate, endDate, prevStartDate, prevEndDate }) {
    return AdminDBRepository.getComparison({
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
    });
  }


  async getPaymentMethodRevenue({ startDate, endDate }) {
    return AdminDBRepository.getPaymentMethodRevenue({ startDate, endDate });
  }

  async getOrdersSummary({ startDate, endDate }) {
    return AdminDBRepository.getOrdersSummary({ startDate, endDate });
  }

  async getDetailedOrdersReport({ startDate, endDate }) {
    return AdminDBRepository.getDetailedOrdersReport({ startDate, endDate });
  }

  async getShiftReport({ date }) {
    return AdminDBRepository.getShiftReport({ date });
  }

  async getProductReport({ startDate, endDate }) {
    return AdminDBRepository.getProductReport({ startDate, endDate });
  }
}

module.exports = new AdminDBService();
