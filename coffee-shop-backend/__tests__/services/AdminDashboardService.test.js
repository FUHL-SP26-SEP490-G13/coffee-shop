const AdminDashboardService = require('../../src/services/AdminDashboardService');
const AdminDashboardRepository = require('../../src/repositories/AdminDashboardRepository');

// Mock dependencies
jest.mock('../../src/repositories/AdminDashboardRepository');

describe('AdminDashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== GET OVERVIEW TESTS ==========
  describe('getOverview', () => {
    it('AdminDashboardService - getOverview - TC-01: should get dashboard overview successfully', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_OVERVIEW - TC-1: Lấy tổng quan dashboard thành công');
      console.log('='.repeat(50));

      // Arrange
      AdminDashboardRepository.getRevenueToday.mockResolvedValue(5000000);
      AdminDashboardRepository.getOrdersToday.mockResolvedValue(25);
      AdminDashboardRepository.getTotalUsers.mockResolvedValue(150);
      AdminDashboardRepository.getActiveDiscounts.mockResolvedValue(5);

      
      const mockRevenueSeries = [
        { date: '2026-03-01', revenue: 4500000 },
        { date: '2026-03-02', revenue: 5200000 },
      ];
      AdminDashboardRepository.getRevenueSeries.mockResolvedValue(mockRevenueSeries);
      
      const mockTopProducts = [
        { id: 1, name: 'Cà phê đen', total_sold: 50 },
        { id: 2, name: 'Bạc xỉu', total_sold: 45 },
      ];
      AdminDashboardRepository.getTopProducts.mockResolvedValue(mockTopProducts);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Overview with all statistics');

      // Act
      const result = await AdminDashboardService.getOverview();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(result.revenueToday).toBe(5000000);
      expect(result.ordersToday).toBe(25);
      expect(result.totalUsers).toBe(150);
      expect(result.activeDiscounts).toBe(5);

      expect(result.revenueSeries7Days).toHaveLength(2);
      expect(result.topProducts7Days).toHaveLength(2);
      
      expect(AdminDashboardRepository.getRevenueToday).toHaveBeenCalled();
      expect(AdminDashboardRepository.getOrdersToday).toHaveBeenCalled();
      expect(AdminDashboardRepository.getTotalUsers).toHaveBeenCalled();
      expect(AdminDashboardRepository.getRevenueSeries).toHaveBeenCalledWith({ days: 7 });
      expect(AdminDashboardRepository.getTopProducts).toHaveBeenCalledWith({ days: 7, limit: 5 });
    });
  });

  // ========== GET REVENUE SERIES TESTS ==========
  describe('getRevenueSeries', () => {
    it('AdminDashboardService - getRevenueSeries - TC-01: should get revenue series for 7 days', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_REVENUE_SERIES - TC-1: Lấy series doanh thu 7 ngày');
      console.log('='.repeat(50));

      // INPUT
      const input = { days: 7 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockData = [
        { date: '2026-03-01', revenue: 4500000 },
        { date: '2026-03-02', revenue: 5200000 },
        { date: '2026-03-03', revenue: 4800000 },
      ];
      AdminDashboardRepository.getRevenueSeries.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Array of revenue data for 7 days');

      // Act
      const result = await AdminDashboardService.getRevenueSeries(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getRevenueSeries).toHaveBeenCalledWith(input);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('revenue');
    });

    it('AdminDashboardService - getRevenueSeries - TC-02: should get revenue series for 30 days', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_REVENUE_SERIES - TC-2: Lấy series doanh thu 30 ngày');
      console.log('='.repeat(50));

      // INPUT
      const input = { days: 30 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      AdminDashboardRepository.getRevenueSeries.mockResolvedValue([]);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Revenue series for 30 days');

      // Act
      const result = await AdminDashboardService.getRevenueSeries(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY: Got data');

      // Assert
      expect(AdminDashboardRepository.getRevenueSeries).toHaveBeenCalledWith({ days: 30 });
    });

    it('AdminDashboardService - getRevenueSeries - TC-03: should pass through full-space days value for repository handling', async () => {
      const input = { days: '        ' };
      AdminDashboardRepository.getRevenueSeries.mockResolvedValue([]);

      const result = await AdminDashboardService.getRevenueSeries(input);

      expect(AdminDashboardRepository.getRevenueSeries).toHaveBeenCalledWith(input);
      expect(result).toEqual([]);
    });
  });

  // ========== GET TOP PRODUCTS TESTS ==========
  describe('getTopProducts', () => {
    it('AdminDashboardService - getTopProducts - TC-01: should get top 5 products', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_TOP_PRODUCTS - TC-1: Lấy top 5 sản phẩm bán chạy');
      console.log('='.repeat(50));

      // INPUT
      const input = { days: 7, limit: 5 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockProducts = [
        { id: 1, name: 'Cà phê đen', total_sold: 100 },
        { id: 2, name: 'Bạc xỉu', total_sold: 95 },
        { id: 3, name: 'Cappuccino', total_sold: 80 },
      ];
      AdminDashboardRepository.getTopProducts.mockResolvedValue(mockProducts);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Top 5 products ordered by total_sold DESC');

      // Act
      const result = await AdminDashboardService.getTopProducts(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getTopProducts).toHaveBeenCalledWith(input);
      expect(result).toHaveLength(3);
      expect(result[0].total_sold).toBeGreaterThanOrEqual(result[1].total_sold);
    });
  });

  // ========== GET PAYMENT METHOD BREAKDOWN TESTS ==========
  describe('getPaymentMethodBreakdown', () => {
    it('AdminDashboardService - getPaymentMethodBreakdown - TC-01: should get payment method breakdown', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_PAYMENT_BREAKDOWN - TC-1: Lấy thống kê phương thức thanh toán');
      console.log('='.repeat(50));

      // INPUT
      const input = { days: 7 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockData = [
        { payment_method: 'cash', total: 3000000, count: 15 },
        { payment_method: 'momo', total: 2000000, count: 10 },
      ];
      AdminDashboardRepository.getPaymentMethodBreakdown.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Payment method statistics');

      // Act
      const result = await AdminDashboardService.getPaymentMethodBreakdown(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getPaymentMethodBreakdown).toHaveBeenCalledWith(input);
      expect(result).toHaveLength(2);
    });
  });

  // ========== GET ORDER TYPE REVENUE TESTS ==========
  describe('getOrderTypeRevenue', () => {
    it('AdminDashboardService - getOrderTypeRevenue - TC-01: should get revenue by order type', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_ORDER_TYPE_REVENUE - TC-1: Lấy doanh thu theo loại đơn hàng');
      console.log('='.repeat(50));

      // INPUT
      const input = { days: 7 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockData = [
        { order_type: 'dine-in', revenue: 3500000 },
        { order_type: 'takeaway', revenue: 1500000 },
      ];
      AdminDashboardRepository.getOrderTypeRevenue.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Revenue breakdown by order type');

      // Act
      const result = await AdminDashboardService.getOrderTypeRevenue(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getOrderTypeRevenue).toHaveBeenCalledWith(input);
      expect(result).toHaveLength(2);
    });
  });

  // ========== GET TABLE STATUS SUMMARY TESTS ==========
  describe('getTableStatusSummary', () => {
    it('AdminDashboardService - getTableStatusSummary - TC-01: should get table status summary', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_TABLE_STATUS - TC-1: Lấy tổng quan trạng thái bàn');
      console.log('='.repeat(50));

      // Arrange
      const mockData = {
        totalTables: 20,
        occupied: 12,
        available: 8,
      };
      AdminDashboardRepository.getTableStatusSummary.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Table status summary');

      // Act
      const result = await AdminDashboardService.getTableStatusSummary();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getTableStatusSummary).toHaveBeenCalled();
      expect(result.totalTables).toBe(20);
      expect(result.occupied).toBe(12);
      expect(result.available).toBe(8);
    });
  });

  // ========== GET COMPARISON TESTS ==========
  describe('getComparison', () => {
    it('AdminDashboardService - getComparison - TC-01: should get comparison data', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_COMPARISON - TC-1: Lấy dữ liệu so sánh');
      console.log('='.repeat(50));

      // INPUT
      const input = { days: 7 };
      console.log('\n📝 INPUT:', JSON.stringify(input, null, 2));

      // Arrange
      const mockData = {
        currentPeriod: { revenue: 5000000, orders: 100 },
        previousPeriod: { revenue: 4500000, orders: 90 },
        percentageChange: { revenue: 11.11, orders: 11.11 },
      };
      AdminDashboardRepository.getComparison.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Comparison data between periods');

      // Act
      const result = await AdminDashboardService.getComparison(input);

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getComparison).toHaveBeenCalledWith(input);
      expect(result).toHaveProperty('currentPeriod');
      expect(result).toHaveProperty('previousPeriod');
    });
  });

  // ========== GET STAFF SUMMARY TESTS ==========
  describe('getStaffSummary', () => {
    it('AdminDashboardService - getStaffSummary - TC-01: should get staff summary by role', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_STAFF_SUMMARY - TC-1: Lấy tổng quan nhân viên theo vai trò');
      console.log('='.repeat(50));

      // Arrange
      const mockData = {
        manager: 2,
        staff: 10,
        barista: 8,
      };
      AdminDashboardRepository.getStaffSummary.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: Staff count by role');

      // Act
      const result = await AdminDashboardService.getStaffSummary();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getStaffSummary).toHaveBeenCalled();
      expect(result).toHaveProperty('manager');
      expect(result).toHaveProperty('staff');
      expect(result).toHaveProperty('barista');
    });
  });

  // ========== GET TABLE STATUS TESTS ==========
  describe('getTableStatus', () => {
    it('AdminDashboardService - getTableStatus - TC-01: should get formatted table status', async () => {
      console.log('\n' + '='.repeat(50));
      console.log('AdminDashboard - GET_TABLE_STATUS - TC-1: Lấy trạng thái bàn formatted');
      console.log('='.repeat(50));

      // Arrange
      const mockData = {
        totalTables: 25,
        occupied: 15,
        available: 10,
      };
      AdminDashboardRepository.getTableStatus.mockResolvedValue(mockData);

      // OUTPUT EXPECT
      console.log('✅ OUTPUT EXPECT: { totalTables, occupied, available }');

      // Act
      const result = await AdminDashboardService.getTableStatus();

      // OUTPUT REALITY
      console.log('🎯 OUTPUT REALITY:', JSON.stringify(result, null, 2));

      // Assert
      expect(AdminDashboardRepository.getTableStatus).toHaveBeenCalled();
      expect(result.totalTables).toBe(25);
      expect(result.occupied).toBe(15);
      expect(result.available).toBe(10);
    });
  });
});
