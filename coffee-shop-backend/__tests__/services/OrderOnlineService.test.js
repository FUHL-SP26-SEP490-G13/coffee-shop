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

const OrderOnlineService = require("../../src/services/OrderOnlineService");
const OrderRepository = require("../../src/repositories/OrderRepository");
const ReputationService = require("../../src/services/ReputationService");
const LoyaltyService = require("../../src/services/LoyaltyService");
const ReceiptSettingService = require("../../src/services/ReceiptSettingService");

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
        subtotal_amount: 36800,
        delivery_distance_km: 3.4,
        shipping_fee: 6800,
        discount_amount: 0,
        loyalty_discount_amount: 0,
        discount_code: null,
        used_points: 0,
        total_amount: 36800,
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
          total_amount: 36800,
          amount: 30000,
          delivery_fee: 6800,
        })
      );
      expect(OrderRepository.createOrderPayment).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 501,
          payment_method: "cash",
          payment_status: "pending",
          amount: 36800,
        }
      );
      expect(result).toEqual(expected);
    });

    it("OrderOnlineService - checkout - TC-02: OON-SVC-CR-002 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "A",
        receiver_phone: "0123456789",
        customer_latitude: "bad",
        customer_longitude: 106.7,
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expectedError = "Vĩ độ giao hàng không hợp lệ";
      logCase({
        tcid: "OON-SVC-CR-002",
        crud: "CREATE",
        scenario: "checkout lỗi latitude không hợp lệ",
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
      expect(OrderRepository.getConnection).not.toHaveBeenCalled();
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

      OrderRepository.findOrderById.mockResolvedValue({
        id: 20,
        user_id: 7,
        order_type: "delivery",
        customer_type: "guest",
        status: "preparing",
        total_amount: 50000,
        is_paid: 0,
        payment_status: "pending",
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
});
