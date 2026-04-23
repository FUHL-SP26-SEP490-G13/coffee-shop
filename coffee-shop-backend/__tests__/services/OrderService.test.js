jest.mock("../../src/repositories/OrderRepository");
jest.mock("../../src/services/LoyaltyService", () => ({
  MONEY_PER_POINT: 1000,
  getRedeemDiscountForCheckout: jest.fn(),
  applyRedeemForOrder: jest.fn(),
  syncOrderLoyaltyByOrderId: jest.fn(),
}));

const OrderService = require("../../src/services/OrderService");
const OrderRepository = require("../../src/repositories/OrderRepository");
const LoyaltyService = require("../../src/services/LoyaltyService");

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

describe("OrderService", () => {
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

  describe("checkout", () => {
    it("OrderService - checkout - TC-01: ORD-SVC-CO-001 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        receiver_email: "a@example.com",
        address: "123 ABC",
        note: "Giao nhanh",
        items: [{ product_size_id: 1, quantity: 2, toppings: [] }],
      };
      const expected = {
        order_id: 100,
        subtotal_amount: 60000,
        discount_amount: 0,
        loyalty_discount_amount: 0,
        discount_code: null,
        used_points: 0,
        total_amount: 60000,
      };
      logCase({
        tcid: "ORD-SVC-CO-001",
        crud: "CREATE",
        scenario: "checkout cash không topping",
        input: { payload, user: { id: 1 } },
        expected,
      });

      OrderRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        price: 30000,
        size: "M",
        product_id: 1,
        name: "Trà sữa",
        status: "available",
      });
      OrderRepository.createOrder.mockResolvedValue(100);
      OrderRepository.createOrderDetail.mockResolvedValue(200);

      const result = await OrderService.checkout(payload, { id: 1 });
      logReality(result);

      expect(OrderRepository.createOrder).toHaveBeenCalledWith(
        mockConnection,
        expect.objectContaining({
          user_id: 1,
          created_by: 1,
          customer_type: "registered",
          status: "pending",
          order_type: "delivery",
          total_amount: 60000,
          amount: 60000,
          discount_amount: 0,
          used_points: 0,
        })
      );
      expect(OrderRepository.createOrderDetail).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 100,
          product_size_id: 1,
          quantity: 2,
          price: 30000,
        }
      );
      expect(OrderRepository.createOrderDeliveryInfo).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 100,
          receiver_name: "Nguyen Van A",
          receiver_phone: "0123456789",
          receiver_email: "a@example.com",
          address: "123 ABC",
          note: "Giao nhanh",
        }
      );
      expect(OrderRepository.createOrderPayment).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 100,
          payment_method: "cash",
          payment_status: "paid",
          amount: 60000,
          paid_amount: 60000,
          cash_received: 60000,
          change_amount: 0,
        }
      );
      expect(result).toEqual(expected);
    });

    it("OrderService - checkout - TC-02: ORD-SVC-CO-002 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "takeaway",
        payment_method: "cash",
        cash_received: 100000,
        receiver_name: "Guest User",
        receiver_phone: "0987654321",
        items: [
          {
            product_size_id: 1,
            quantity: 2,
            toppings: [{ topping_id: 10, quantity: 2 }],
          },
        ],
      };
      const expected = {
        order_id: 101,
        subtotal_amount: 80000,
        discount_amount: 0,
        loyalty_discount_amount: 0,
        discount_code: null,
        used_points: 0,
        total_amount: 80000,
      };
      logCase({
        tcid: "ORD-SVC-CO-002",
        crud: "CREATE",
        scenario: "checkout cash có topping",
        input: { payload, user: null },
        expected,
      });

      OrderRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        price: 30000,
        name: "Coffee",
        status: "available",
      });
      OrderRepository.findToppingById.mockResolvedValue({
        id: 10,
        name: "Trân châu",
        price: 5000,
      });
      OrderRepository.createOrder.mockResolvedValue(101);
      OrderRepository.createOrderDetail.mockResolvedValue(201);

      const result = await OrderService.checkout(payload, null);
      logReality(result);

      expect(OrderRepository.createOrderPayment).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 101,
          payment_method: "cash",
          payment_status: "paid",
          amount: 80000,
          paid_amount: 80000,
          cash_received: 100000,
          change_amount: 20000,
        }
      );
      expect(result).toEqual(expected);
    });

    it("OrderService - checkout - TC-03: ORD-SVC-CO-003 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        items: [],
      };
      const expectedError = "Giỏ hàng trống";
      logCase({
        tcid: "ORD-SVC-CO-003",
        crud: "CREATE",
        scenario: "checkout lỗi giỏ hàng trống",
        input: { payload, user: { id: 1 } },
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await OrderService.checkout(payload, { id: 1 });
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(OrderRepository.getConnection).not.toHaveBeenCalled();
    });

    it("OrderService - checkout - TC-04: ORD-SVC-CO-004 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "",
        receiver_phone: "",
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expected = {
        order_id: 102,
        subtotal_amount: 25000,
        discount_amount: 0,
        loyalty_discount_amount: 0,
        discount_code: null,
        used_points: 0,
        total_amount: 25000,
      };
      logCase({
        tcid: "ORD-SVC-CO-004",
        crud: "CREATE",
        scenario: "checkout cho phép thiếu receiver",
        input: { payload, user: { id: 1 } },
        expected,
      });

      OrderRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        price: 25000,
        name: "Coffee",
        status: "available",
      });
      OrderRepository.createOrder.mockResolvedValue(102);
      OrderRepository.createOrderDetail.mockResolvedValue(202);

      const result = await OrderService.checkout(payload, { id: 1 });
      logReality(result);

      expect(OrderRepository.createOrderDeliveryInfo).toHaveBeenCalledWith(
        mockConnection,
        expect.objectContaining({
          order_id: 102,
          receiver_name: "",
          receiver_phone: "",
        })
      );
      expect(result).toEqual(expected);
    });

    it("OrderService - checkout - TC-05: ORD-SVC-CO-005 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        items: [{ product_size_id: null, quantity: 0 }],
      };
      const expectedError = "Dữ liệu sản phẩm trong giỏ hàng không hợp lệ";
      logCase({
        tcid: "ORD-SVC-CO-005",
        crud: "CREATE",
        scenario: "checkout lỗi dữ liệu item",
        input: { payload, user: { id: 1 } },
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await OrderService.checkout(payload, { id: 1 });
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("OrderService - checkout - TC-06: ORD-SVC-CO-006 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "takeaway",
        payment_method: "cash",
        cash_received: 10000,
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expectedError = "Tiền khách đưa không đủ";
      logCase({
        tcid: "ORD-SVC-CO-006",
        crud: "CREATE",
        scenario: "checkout lỗi tiền khách không đủ",
        input: { payload, user: null },
        expected: { error: expectedError },
      });

      OrderRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        price: 30000,
        name: "Coffee",
        status: "available",
      });

      let actualError = null;
      try {
        await OrderService.checkout(payload, null);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("OrderService - checkout - TC-07: ORD-SVC-CO-007 - CRUD: CREATE", async () => {
      const payload = {
        order_type: "takeaway",
        payment_method: "cash",
        used_points: 1.5,
        items: [{ product_size_id: 1, quantity: 1 }],
      };
      const expectedError = "Điểm sử dụng không hợp lệ";
      logCase({
        tcid: "ORD-SVC-CO-007",
        crud: "CREATE",
        scenario: "checkout lỗi used_points sai định dạng số nguyên",
        input: { payload, user: { id: 1 } },
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await OrderService.checkout(payload, { id: 1 });
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(OrderRepository.findProductSizeById).not.toHaveBeenCalled();
    });
  });

  describe("getOrdersByUser", () => {
    it("OrderService - getOrdersByUser - TC-01: ORD-SVC-RO-001 - CRUD: READ", async () => {
      const input = { userId: 1 };
      const expected = [
        { id: 1, total_amount: 50000 },
        { id: 2, total_amount: 60000 },
      ];
      logCase({
        tcid: "ORD-SVC-RO-001",
        crud: "READ",
        scenario: "lấy danh sách đơn theo user",
        input,
        expected,
      });

      OrderRepository.findOrdersByUser.mockResolvedValue(expected);

      const result = await OrderService.getOrdersByUser(1);
      logReality(result);

      expect(OrderRepository.findOrdersByUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });

  describe("getOrderDetailByUser", () => {
    it("OrderService - getOrderDetailByUser - TC-01: ORD-SVC-RO-002 - CRUD: READ", async () => {
      const input = { orderId: 10, userId: 1 };
      const mockOrder = { id: 10, total_amount: 120000 };
      const mockItems = [{ id: 1, name: "Coffee", toppings: [] }];
      const expected = { ...mockOrder, items: mockItems };
      logCase({
        tcid: "ORD-SVC-RO-002",
        crud: "READ",
        scenario: "lấy chi tiết đơn theo user",
        input,
        expected,
      });

      OrderRepository.findOrderByIdAndUser.mockResolvedValue(mockOrder);
      OrderRepository.findOrderItems.mockResolvedValue(mockItems);

      const result = await OrderService.getOrderDetailByUser(10, 1);
      logReality(result);

      expect(OrderRepository.findOrderByIdAndUser).toHaveBeenCalledWith(10, 1);
      expect(OrderRepository.findOrderItems).toHaveBeenCalledWith(10);
      expect(result).toEqual(expected);
    });

    it("OrderService - getOrderDetailByUser - TC-02: ORD-SVC-RO-003 - CRUD: READ", async () => {
      const input = { orderId: 999, userId: 1 };
      const expectedError = "Đơn hàng không tồn tại";
      logCase({
        tcid: "ORD-SVC-RO-003",
        crud: "READ",
        scenario: "lỗi khi không tìm thấy đơn",
        input,
        expected: { error: expectedError },
      });

      OrderRepository.findOrderByIdAndUser.mockResolvedValue(null);

      let actualError = null;
      try {
        await OrderService.getOrderDetailByUser(999, 1);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(OrderRepository.findOrderItems).not.toHaveBeenCalled();
    });
  });

  describe("savePayosReturn", () => {
    beforeEach(() => {
      OrderRepository.findOrderById.mockResolvedValue({
        id: 100,
        status: "pending",
      });
    });

    it("OrderService - savePayosReturn - TC-01: ORD-SVC-UP-001 - CRUD: UPDATE", async () => {
      const input = {
        orderCode: 100,
        payosId: "PAYOS123",
        status: "PAID",
      };
      const expected = { saved: true };
      logCase({
        tcid: "ORD-SVC-UP-001",
        crud: "UPDATE",
        scenario: "lưu trạng thái paid từ payos",
        input,
        expected,
      });

      const result = await OrderService.savePayosReturn(input);
      logReality(result);

      expect(OrderRepository.updatePaymentByOrderCode).toHaveBeenCalledWith(100, {
        transaction_id: "PAYOS123",
        payment_status: "paid",
      });
      expect(OrderRepository.updateOrderPaidStatus).toHaveBeenCalledWith(100, true);
      expect(result).toEqual(expected);
    });

    it("OrderService - savePayosReturn - TC-02: ORD-SVC-UP-002 - CRUD: UPDATE", async () => {
      const input = {
        orderCode: 100,
        payosId: "PAYOS123",
        status: "CANCELLED",
      };
      const expected = { saved: true };
      logCase({
        tcid: "ORD-SVC-UP-002",
        crud: "UPDATE",
        scenario: "lưu trạng thái cancelled từ payos",
        input,
        expected,
      });

      const result = await OrderService.savePayosReturn(input);
      logReality(result);

      expect(OrderRepository.updatePaymentByOrderCode).toHaveBeenCalledWith(100, {
        transaction_id: "PAYOS123",
        payment_status: "cancelled",
      });
      expect(OrderRepository.updateOrderStatus).toHaveBeenCalledWith(100, "cancelled");
      expect(OrderRepository.updateOrderPaidStatus).toHaveBeenCalledWith(100, false);
      expect(LoyaltyService.syncOrderLoyaltyByOrderId).toHaveBeenCalledWith(100);
      expect(result).toEqual(expected);
    });

    it("OrderService - savePayosReturn - TC-03: ORD-SVC-UP-003 - CRUD: UPDATE", async () => {
      const input = {
        orderCode: 100,
        payosId: null,
        status: "PENDING",
      };
      const expected = { saved: true };
      logCase({
        tcid: "ORD-SVC-UP-003",
        crud: "UPDATE",
        scenario: "lưu trạng thái pending từ payos",
        input,
        expected,
      });

      const result = await OrderService.savePayosReturn(input);
      logReality(result);

      expect(OrderRepository.updatePaymentByOrderCode).toHaveBeenCalledWith(100, {
        transaction_id: null,
        payment_status: "pending",
      });
      expect(OrderRepository.updateOrderPaidStatus).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it("OrderService - savePayosReturn - TC-04: ORD-SVC-UP-004 - CRUD: UPDATE", async () => {
      const input = { payosId: "PAYOS123", status: "PAID" };
      const expectedError = "Thiếu orderCode";
      logCase({
        tcid: "ORD-SVC-UP-004",
        crud: "UPDATE",
        scenario: "lỗi thiếu orderCode",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await OrderService.savePayosReturn(input);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });
  });
});
