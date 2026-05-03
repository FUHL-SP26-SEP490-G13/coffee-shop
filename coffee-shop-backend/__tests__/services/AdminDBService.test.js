jest.mock("../../src/repositories/AdminDBRepository");

const AdminDBService = require("../../src/services/AdminDBService");
const AdminDBRepository = require("../../src/repositories/AdminDBRepository");
const { logTestCase } = require("../utils/logger");

let pendingLogCase = null;
const logCase = (payload = {}) => {
  pendingLogCase = payload;
};
const logReality = (actual) => {
  const payload = pendingLogCase || {};
  logTestCase({
    name: `${payload.tcid} - ${payload.scenario}`,
    input: payload.input,
    expected: payload.expected,
    actual: actual,
  });
  pendingLogCase = null;
};

describe("AdminDBService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOverview", () => {
    it("ADM-SVC-001: Lấy tổng quan dashboard thành công", async () => {
      logCase({
        tcid: "ADM-SVC-001",
        scenario: "Lấy overview với dữ liệu mock",
        expected: "revenue: 5tr, orders: 25",
      });

      AdminDBRepository.getRevenueToday.mockResolvedValue(5000000);
      AdminDBRepository.getOrdersToday.mockResolvedValue(25);
      AdminDBRepository.getTotalUsers.mockResolvedValue(150);
      AdminDBRepository.getActiveDiscounts.mockResolvedValue(5);

      const result = await AdminDBService.getOverview();
      logReality(`revenue: ${result.revenueToday}, orders: ${result.ordersToday}`);

      expect(result.revenueToday).toBe(5000000);
      expect(result.ordersToday).toBe(25);
      expect(result.totalUsers).toBe(150);
      expect(result.activeDiscounts).toBe(5);
    });
  });

  describe("getRevenueSeries", () => {
    it("ADM-SVC-002: Lấy series doanh thu thành công", async () => {
      const input = { startDate: "2026-03-01", endDate: "2026-03-07" };
      logCase({
        tcid: "ADM-SVC-002",
        scenario: "Lấy doanh thu tuần",
        input,
        expected: "Array length: 2",
      });

      const mockData = [
        { date: "2026-03-01", revenue: 1000000 },
        { date: "2026-03-02", revenue: 1200000 },
      ];
      AdminDBRepository.getRevenueSeries.mockResolvedValue(mockData);

      const result = await AdminDBService.getRevenueSeries(input);
      logReality(`Array length: ${result.length}`);

      expect(result).toHaveLength(2);
      expect(AdminDBRepository.getRevenueSeries).toHaveBeenCalledWith(input);
    });
  });

  describe("getTopProducts", () => {
    it("ADM-SVC-003: Lấy top sản phẩm thành công", async () => {
      const input = { startDate: "2026-03-01", endDate: "2026-03-07", limit: 5 };
      logCase({
        tcid: "ADM-SVC-003",
        scenario: "Lấy top 5 sản phẩm",
        input,
        expected: "Top product: Cà phê đen",
      });

      const mockData = [
        { productId: 1, productName: "Cà phê đen", quantitySold: 100, revenue: 3000000 },
      ];
      AdminDBRepository.getTopProducts.mockResolvedValue(mockData);

      const result = await AdminDBService.getTopProducts(input);
      logReality(`Top product: ${result[0].productName}`);

      expect(result[0].productName).toBe("Cà phê đen");
    });
  });

  describe("getShiftReport", () => {
    it("ADM-SVC-004: Lấy báo cáo theo ca làm việc", async () => {
      const input = { date: "2026-04-27" };
      logCase({
        tcid: "ADM-SVC-004",
        scenario: "Báo cáo ca ngày 27/04",
        input,
        expected: "Date matches",
      });

      const mockData = { date: "2026-04-27", shifts: [] };
      AdminDBRepository.getShiftReport.mockResolvedValue(mockData);

      const result = await AdminDBService.getShiftReport(input);
      logReality(`Date matches: ${result.date === "2026-04-27"}`);

      expect(result.date).toBe("2026-04-27");
    });
  });
});
