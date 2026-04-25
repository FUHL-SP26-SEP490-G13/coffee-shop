const AdminDBRepository = require("../repositories/AdminDBRepository");
const ErrorResponse = require("../utils/ErrorResponse");

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

  validateDates(startDate, endDate) {
    if (!startDate || !endDate) {
      throw new ErrorResponse(400, "Vui lòng cung cấp cả ngày bắt đầu và ngày kết thúc");
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new ErrorResponse(400, "Định dạng ngày không hợp lệ");
    }
    if (start > end) {
      throw new ErrorResponse(400, "Ngày bắt đầu không thể lớn hơn ngày kết thúc");
    }
  }

  async getRevenueSeries({ startDate, endDate }) {
    this.validateDates(startDate, endDate);
    return AdminDBRepository.getRevenueSeries({ startDate, endDate });
  }

  async getTopProducts({ startDate, endDate, limit }) {
    this.validateDates(startDate, endDate);
    const parsedLimit = Number(limit);
    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new ErrorResponse(400, "Limit phải là một số nguyên dương");
    }
    return AdminDBRepository.getTopProducts({ startDate, endDate, limit: parsedLimit });
  }

  // Optional: doanh thu theo loại đơn hàng (tại quán, mang về, giao hàng)
  async getOrderTypeRevenue({ startDate, endDate }) {
    this.validateDates(startDate, endDate);
    return AdminDBRepository.getOrderTypeRevenue({ startDate, endDate });
  }

  // Optional: so sánh doanh thu, số đơn hàng, khách hàng mới,... giữa 2 khoảng thời gian
  async getComparison({ startDate, endDate, prevStartDate, prevEndDate }) {
    this.validateDates(startDate, endDate);
    this.validateDates(prevStartDate, prevEndDate);
    return AdminDBRepository.getComparison({
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
    });
  }


  async getPaymentMethodRevenue({ startDate, endDate }) {
    this.validateDates(startDate, endDate);
    return AdminDBRepository.getPaymentMethodRevenue({ startDate, endDate });
  }

  async getOrdersSummary({ startDate, endDate }) {
    this.validateDates(startDate, endDate);
    return AdminDBRepository.getOrdersSummary({ startDate, endDate });
  }

  async getDetailedOrdersReport({ startDate, endDate }) {
    this.validateDates(startDate, endDate);
    return AdminDBRepository.getDetailedOrdersReport({ startDate, endDate });
  }

  async getShiftReport({ date }) {
    if (!date) {
      throw new ErrorResponse(400, "Vui lòng cung cấp ngày xem báo cáo ca");
    }
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new ErrorResponse(400, "Định dạng ngày không hợp lệ");
    }
    return AdminDBRepository.getShiftReport({ date });
  }

  async getProductReport({ startDate, endDate }) {
    this.validateDates(startDate, endDate);
    return AdminDBRepository.getProductReport({ startDate, endDate });
  }

  async getTimeReport({ startDate, endDate }) {
    this.validateDates(startDate, endDate);
    return AdminDBRepository.getTimeReport({ startDate, endDate });
  }

  async getStaffReport({ startDate, endDate }) {
    return AdminDBRepository.getStaffReport({ startDate, endDate });
  }
}

module.exports = new AdminDBService();
