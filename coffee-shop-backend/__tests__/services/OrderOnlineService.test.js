jest.mock("../../src/repositories/OrderRepository");
jest.mock("../../src/services/ReputationService", () => ({
  ensureProfileForPhone: jest.fn(),
  applyScoreChangeByOrder: jest.fn(),
}));
jest.mock("../../src/services/LoyaltyService", () => ({
  MONEY_PER_POINT: 1000,
  getRedeemDiscountForCheckout: jest.fn(),
  applyRedeemForOrder: jest.fn(),
  syncOrderLoyaltyByOrderId: jest.fn(),
}));
jest.mock("../../src/services/ReceiptSettingService", () => ({
  getActiveSetting: jest.fn(),
}));
jest.mock("../../src/services/FlashSaleService", () => ({
  getCurrentActive: jest.fn(),
}));

const OrderOnlineService = require("../../src/services/OrderOnlineService");
const OrderRepository = require("../../src/repositories/OrderRepository");
const ReputationService = require("../../src/services/ReputationService");
const LoyaltyService = require("../../src/services/LoyaltyService");
const ReceiptSettingService = require("../../src/services/ReceiptSettingService");
const FlashSaleService = require("../../src/services/FlashSaleService");

const { logTestCase } = require('../utils/logger');

let pendingLogCase = null;

const logCase = (payload = {}) => {
  pendingLogCase = payload;
};

const logReality = (actual) => {
  const payload = pendingLogCase || {};
  const {
    title,
    method,
    tcid,
    crud,
    scenario,
    input,
    expected,
    outputExpect,
    reality,
  } = payload;

  const nameParts = [title, method, scenario, tcid].filter(Boolean);
  if (crud) nameParts.push(`CRUD: ${crud}`);

  logTestCase({
    name: nameParts.join(' - ') || 'Test case',
    input,
    expected: expected !== undefined ? expected : outputExpect,
    actual: actual !== undefined ? actual : reality,
  });

  pendingLogCase = null;
};

describe("OrderOnlineService", () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();

    jest.restoreAllMocks();
    mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValue([[]]),
    };

    OrderRepository.getConnection.mockResolvedValue(mockConnection);
  });

  describe("shipping helpers", () => {
    it("OrderOnlineService - shipping - TC-01: OON-SVC-RD-001 - CRUD: READ", () => {
      const input = { distanceKm: 4.26 };
      const expected = { shippingFee: 8500 };
      logCase({
        tcid: "OON-SVC-RD-001",
        crud: "READ",
        scenario: "tính phí ship theo khoảng cách",
        input,
        expected,
      });

      const fee = OrderOnlineService.calculateShippingFeeByDistanceKm(4.26);
      logReality({ shippingFee: fee });

      expect(fee).toBe(8500);
    });

    it("OrderOnlineService - shipping - TC-02: OON-SVC-RD-002 - CRUD: READ", () => {
      const input = { distanceKm: 10 };
      const expectedError = "vượt quá giới hạn giao hàng";
      logCase({
        tcid: "OON-SVC-RD-002",
        crud: "READ",
        scenario: "lỗi vượt giới hạn giao hàng",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        OrderOnlineService.calculateShippingFeeByDistanceKm(10);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });

    it("OrderOnlineService - shipping - TC-03: OON-SVC-RD-003 - CRUD: READ", () => {
      const input = {
        order: {
          order_type: "delivery",
          created_at: "2026-01-01T00:00:00.000Z",
          total_amount: 50000,
          used_points: 0,
        },
        items: [{ price: 50000, quantity: 1 }],
      };
      const expected = { shippingFee: 20000 };
      logCase({
        tcid: "OON-SVC-RD-003",
        crud: "READ",
        scenario: "fallback phí ship legacy",
        input,
        expected,
      });

      const fee = OrderOnlineService.getDerivedShippingFee(input.order, input.items);
      logReality({ shippingFee: fee });

      expect(fee).toBe(20000);
    });
  });

  describe("checkout", () => {
    it("OrderOnlineService - checkout - TC-01: OON-SVC-CR-001 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "+84 123456789",
        receiver_email: "a@example.com",
        address: "123 ABC",
        customer_latitude: 10.77,
        customer_longitude: 106.69,
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expected = {
        order_id: 501,
        subtotal_amount: 30000,
        delivery_distance_km: 0,
        shipping_fee: 0,
        discount_amount: 0,
        loyalty_discount_amount: 0,
        discount_code: null,
        used_points: 0,
        total_amount: 30000,
      };
      logCase({
        tcid: "OON-SVC-CR-001",
        crud: "CREATE",
        scenario: "checkout delivery thành công",
        input: { payload, user: null },
        expected,
      });

      jest.spyOn(OrderOnlineService, "calculateCartAmounts").mockResolvedValue({
        totalAmount: 30000,
        regularAmount: 30000,
        flashSaleAmount: 0,
        normalizedItems: [
          {
            product_size_id: 1,
            quantity: 1,
            price: 30000,
            toppings: [],
          },
        ],
      });
      jest.spyOn(OrderOnlineService, "getDrivingDistanceKm").mockResolvedValue(3.4);

      ReceiptSettingService.getActiveSetting.mockResolvedValue({
        latitude: 10.8,
        longitude: 106.7,
      });
      OrderRepository.countPendingUnpaidOnlineOrdersByPhone.mockResolvedValue(0);
      OrderRepository.createOrder.mockResolvedValue(501);
      OrderRepository.createOrderDetail.mockResolvedValue(601);

      const result = await OrderOnlineService.checkout(payload, null);
      logReality(result);

      expect(OrderRepository.createOrder).toHaveBeenCalledWith(
        mockConnection,
        expect.objectContaining({
          order_type: "delivery",
          total_amount: 30000,
          amount: 30000,
          delivery_fee: 0,
        })
      );
      expect(OrderRepository.createOrderPayment).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 501,
          payment_method: "cash",
          payment_status: "pending",
          amount: 30000,
        }
      );
      expect(result).toEqual(expected);
    });

    it("OrderOnlineService - checkout - TC-04: OON-SVC-CR-004 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "dine-in",
        table_id: 10,
        payment_method: "cash",
        items: [{ product_size_id: 1, quantity: 2 }],
      };
      const expected = {
        order_id: 502,
        subtotal_amount: 60000,
        delivery_distance_km: 0,
        shipping_fee: 0,
        discount_amount: 0,
        loyalty_discount_amount: 0,
        discount_code: null,
        used_points: 0,
        total_amount: 60000,
      };
      logCase({
        tcid: "OON-SVC-CR-004",
        crud: "CREATE",
        scenario: "checkout dine-in gộp vào đơn hiện tại",
        input: { payload, user: null },
        expected,
      });

      jest.spyOn(OrderOnlineService, "calculateCartAmounts").mockResolvedValue({
        totalAmount: 60000,
        regularAmount: 60000,
        flashSaleAmount: 0,
        normalizedItems: [
          {
            product_size_id: 1,
            quantity: 2,
            price: 30000,
            toppings: [],
          },
        ],
      });

      OrderRepository.findActiveOrderByTableId.mockResolvedValue({
        id: 502,
        total_amount: 30000,
        amount: 30000,
        discount_amount: 0,
      });

      const result = await OrderOnlineService.checkout(payload, null);
      logReality(result);

      expect(OrderRepository.updateOrderTotalAmount).toHaveBeenCalled();
      expect(OrderRepository.createOrderDetail).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it("OrderOnlineService - checkout - TC-05: OON-SVC-CR-005 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        used_points: 10,
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expected = {
        order_id: 505,
        subtotal_amount: 30000,
        delivery_distance_km: 0,
        shipping_fee: 0,
        discount_amount: 0,
        loyalty_discount_amount: 10000,
        discount_code: null,
        used_points: 10,
        total_amount: 20000,
      };
      logCase({
        tcid: "OON-SVC-CR-005",
        crud: "CREATE",
        scenario: "checkout delivery với điểm loyalty",
        input: { payload, user: { id: 1 } },
        expected,
      });

      jest.spyOn(OrderOnlineService, "calculateCartAmounts").mockResolvedValue({
        totalAmount: 30000,
        regularAmount: 30000,
        flashSaleAmount: 0,
        normalizedItems: [{ product_size_id: 1, quantity: 1, price: 30000, toppings: [] }],
      });

      LoyaltyService.getRedeemDiscountForCheckout.mockResolvedValue(10000);
      OrderRepository.createOrder.mockResolvedValue(505);

      const result = await OrderOnlineService.checkout(payload, { id: 1 });
      logReality(result);

      expect(LoyaltyService.getRedeemDiscountForCheckout).toHaveBeenCalledWith(
        mockConnection,
        expect.objectContaining({
          userId: 1,
          usedPoints: 10,
          orderAmount: 30000,
        })
      );
      expect(OrderRepository.createOrder).toHaveBeenCalledWith(
        mockConnection,
        expect.objectContaining({
          used_points: 10,
          total_amount: 20000,
        })
      );
      expect(LoyaltyService.applyRedeemForOrder).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it("OrderOnlineService - checkout - TC-06: OON-SVC-CR-006 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "A",
        receiver_phone: "0123456789",
        used_points: 10,
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expectedError = "Bạn cần đăng nhập để sử dụng điểm loyalty";
      logCase({
        tcid: "OON-SVC-CR-006",
        crud: "CREATE",
        scenario: "checkout với điểm loyalty nhưng chưa đăng nhập",
        input: { payload, user: null },
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await OrderOnlineService.checkout(payload, null);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });

    it("OrderOnlineService - checkout - TC-03: OON-SVC-CR-003 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "   ",
        receiver_phone: "   ",
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expectedError = "Số điện thoại không hợp lệ";
      logCase({
        tcid: "OON-SVC-CR-003",
        crud: "CREATE",
        scenario: "checkout lỗi receiver_phone chỉ chứa khoảng trắng",
        input: { payload, user: null },
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await OrderOnlineService.checkout(payload, null);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(OrderRepository.getConnection).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(
        OrderRepository.countPendingUnpaidOnlineOrdersByPhone
      ).not.toHaveBeenCalled();
    });
  });

  describe("status and payment", () => {
    it("OrderOnlineService - savePayosReturn - TC-01: OON-SVC-UP-001 - CRUD: UPDATE", async () => {
      const input = {
        orderCode: 10,
        payosId: "TX123",
        status: "CANCELLED",
      };
      const expected = {
        saved: true,
        order_id: 10,
        user_id: 5,
        order_status: "cancelled",
        payment_status: "cancelled",
        is_paid: 0,
      };
      logCase({
        tcid: "OON-SVC-UP-001",
        crud: "UPDATE",
        scenario: "savePayosReturn cancelled",
        input,
        expected,
      });

      OrderRepository.findOrderById.mockResolvedValue({
        id: 10,
        status: "pending",
        user_id: 5,
      });

      const result = await OrderOnlineService.savePayosReturn(input);
      logReality(result);

      expect(OrderRepository.updateOrderStatus).toHaveBeenCalledWith(10, "cancelled");
      expect(OrderRepository.updateOrderPaidStatus).toHaveBeenCalledWith(10, false);
      expect(LoyaltyService.syncOrderLoyaltyByOrderId).toHaveBeenCalledWith(10);
      expect(result).toEqual(expected);
    });

    it("OrderOnlineService - transitionStatus - TC-01: OON-SVC-UP-002 - CRUD: UPDATE", async () => {
      const input = {
        orderId: 20,
        targetStatus: "completed",
        options: { cash_received: 70000 },
      };
      const expected = {
        order_id: 20,
        status: "completed",
        is_paid: 1,
        cash_received: 70000,
        change_amount: 20000,
      };
      logCase({
        tcid: "OON-SVC-UP-002",
        crud: "UPDATE",
        scenario: "staff hoàn tất đơn unpaid bằng tiền mặt",
        input,
        expected,
      });

      OrderRepository.findOrderById.mockResolvedValueOnce({
        id: 20,
        user_id: 7,
        order_type: "delivery",
        customer_type: "guest",
        status: "preparing",
        total_amount: 50000,
        is_paid: 0,
        payment_status: "pending",
      }).mockResolvedValue({
        id: 20,
        user_id: 7,
        order_type: "delivery",
        customer_type: "guest",
        status: "completed",
        total_amount: 50000,
        is_paid: 1,
        payment_status: "paid",
      });

      const result = await OrderOnlineService.transitionOrderStatusByStaff(
        input.orderId,
        input.targetStatus,
        input.options
      );
      logReality(result);

      expect(OrderRepository.updateOrderPaidStatus).toHaveBeenCalledWith(20, true);
      expect(OrderRepository.updatePaymentStatusByOrderId).toHaveBeenCalledWith(
        20,
        "paid",
        {
          cash_received: 70000,
          change_amount: 20000,
        }
      );
      expect(ReputationService.applyScoreChangeByOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 20,
          changeAmount: 10,
        })
      );
      expect(result).toEqual(expected);
    });
  });

  describe("calculateCartAmounts with Flash Sale", () => {
    it("OON-SVC-RD-004: Áp dụng Flash Sale chính xác cho sản phẩm được chỉ định", async () => {
      logCase({
        tcid: "OON-SVC-RD-004",
        scenario: "Sản phẩm A có Flash Sale 20%, B không có",
        expected: "A: 8k, B: 10k",
      });

      FlashSaleService.getCurrentActive.mockResolvedValue({
        product_ids: [1], // Chỉ sản phẩm ID 1 có Flash Sale
        discount_percent: 20,
      });
      OrderRepository.findProductSizeById
        .mockResolvedValueOnce({
          product_id: 1,
          price: 10000,
          status: "available",
          name: "Coffee A",
          id: 1,
        })
        .mockResolvedValueOnce({
          product_id: 2,
          price: 10000,
          status: "available",
          name: "Coffee B",
          id: 2,
        });

      const items = [
        { product_size_id: 1, quantity: 1 },
        { product_size_id: 2, quantity: 1 },
      ];
      const result = await OrderOnlineService.calculateCartAmounts(
        mockConnection,
        items
      );

      logReality(
        `Total: ${result.totalAmount}, FlashSale: ${result.flashSaleAmount}`
      );
      expect(result.totalAmount).toBe(18000); // 8k + 10k
      expect(result.flashSaleAmount).toBe(8000);
      expect(result.regularAmount).toBe(10000);
    });
  });

  describe("validateDiscount logic", () => {
    it("OON-SVC-RD-005: Lỗi khi Voucher không đủ điều kiện đơn hàng tối thiểu (chỉ tính SP thường)", async () => {
      logCase({
        tcid: "OON-SVC-RD-005",
        scenario: "Đơn 50k (25k thường + 25k flash), Voucher yêu cầu 40k thường",
        expected: "400 - Voucher chỉ áp dụng cho sản phẩm Thường...",
      });

      // Mock giỏ hàng có 25k thường và 25k flash sale
      jest.spyOn(OrderOnlineService, "calculateCartAmounts").mockResolvedValue({
        totalAmount: 50000,
        regularAmount: 25000,
        flashSaleAmount: 25000,
        normalizedItems: [],
      });

      OrderRepository.findDiscountByCodeForCheckout.mockResolvedValue({
        code: "KM40K",
        min_order_amount: 40000,
        percentage: 10,
        valid_from: "2020-01-01",
        valid_until: "2099-01-01",
      });

      try {
        await OrderOnlineService.validateDiscount("KM40K", [
          { product_size_id: 1, quantity: 1 },
        ]);
      } catch (error) {
        logReality(`${error.statusCode} - ${error.message}`);
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("Mua thêm 15.000đ sản phẩm nguyên giá");
      }
    });

    it("OON-SVC-RD-006: Tính toán số tiền giảm giá chính xác với Max Discount", async () => {
      logCase({
        tcid: "OON-SVC-RD-006",
        scenario: "Giảm 10% tối đa 10k cho đơn 200k",
        expected: "Discount: 10000",
      });

      jest.spyOn(OrderOnlineService, "calculateCartAmounts").mockResolvedValue({
        totalAmount: 200000,
        regularAmount: 200000,
        flashSaleAmount: 0,
        normalizedItems: [],
      });

      OrderRepository.findDiscountByCodeForCheckout.mockResolvedValue({
        code: "MAX10K",
        min_order_amount: 50000,
        percentage: 10,
        max_discount_amount: 10000,
        valid_from: "2020-01-01",
        valid_until: "2099-01-01",
      });

      const result = await OrderOnlineService.validateDiscount("MAX10K", [
        { product_size_id: 1, quantity: 1 },
      ]);
      logReality(result.discount_amount);
      expect(result.discount_amount).toBe(10000);
    });
  });

  describe("driving distance fallback", () => {
    it("OON-SVC-RD-007: Fallback sang Haversine * 1.3 khi OSRM lỗi", async () => {
      logCase({
        tcid: "OON-SVC-RD-007",
        scenario: "OSRM request failed",
        expected: "Distance: 1.3km (1km straight * 1.3)",
      });

      // Mock fetch lỗi
      global.fetch = jest.fn().mockRejectedValue(new Error("Network Error"));
      jest.spyOn(OrderOnlineService, "getDrivingDistanceKm").mockRestore();

      // 10.0, 106.0 -> 10.009, 106.0 ~ xấp xỉ 1km
      const distance = await OrderOnlineService.getDrivingDistanceKm(
        10.0,
        106.0,
        10.009,
        106.0
      );
      logReality(`Distance: ${distance.toFixed(1)}km`);
      expect(distance).toBeGreaterThan(1);
      expect(distance).toBeLessThan(1.5);
    });
  });
});
