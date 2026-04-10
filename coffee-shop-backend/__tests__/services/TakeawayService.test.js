jest.mock("../../src/repositories/TakeawayRepository");
jest.mock("../../src/config/payos", () => ({
  payOS: {
    paymentRequests: {
      create: jest.fn(),
    },
  },
}));

const TakeawayService = require("../../src/services/TakeawayService");
const TakeawayRepository = require("../../src/repositories/TakeawayRepository");
const { payOS } = require("../../src/config/payos");

const logCase = ({ tcid, crud, scenario, input, expected }) => {
  console.log("\n" + "=".repeat(70));
  console.log(`TakeawayService - ${scenario} - ${tcid} - CRUD: ${crud}`);
  console.log("=".repeat(70));
  console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));
  console.log("✅ OUTPUT EXPECT:", JSON.stringify(expected, null, 2));
};

const logReality = (value) => {
  console.log("🎯 OUTPUT REALITY:", JSON.stringify(value, null, 2));
};

describe("TakeawayService", () => {
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

    TakeawayRepository.getConnection.mockResolvedValue(mockConnection);
  });

  describe("createTakeawayOrder", () => {
    it("TakeawayService - CREATE_TAKEAWAY_ORDER - TCID: TKW-SVC-CR-001 - CRUD: CREATE", async () => {
      const input = {
        payload: {
          payment_method: "cash",
          cash_received: 50000,
          items: [{ product_size_id: 1, quantity: 1 }],
        },
        staffUser: { id: 9 },
      };
      const expected = {
        order_id: 101,
        amount: 30000,
        subtotal_amount: 30000,
        discount_amount: 0,
        discount_code: null,
        total_amount: 30000,
        payment_method: "cash",
        is_paid: true,
        status: "pending",
        cash_received: 50000,
        change_amount: 20000,
      };
      logCase({
        tcid: "TKW-SVC-CR-001",
        crud: "CREATE",
        scenario: "tạo đơn takeaway cash",
        input,
        expected,
      });

      TakeawayRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        name: "Coffee",
        size: "M",
        price: 30000,
        status: "available",
        is_deleted: 0,
        product_deleted: 0,
      });
      TakeawayRepository.createOrder.mockResolvedValue(101);
      TakeawayRepository.createOrderDetail.mockResolvedValue(201);

      const result = await TakeawayService.createTakeawayOrder(
        input.payload,
        input.staffUser
      );
      logReality(result);

      expect(TakeawayRepository.createOrderPayment).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 101,
          payment_method: "cash",
          payment_status: "paid",
          amount: 30000,
          paid_amount: 30000,
          cash_received: 50000,
          change_amount: 20000,
        }
      );
      expect(result).toEqual(expected);
    });

    it("TakeawayService - CREATE_TAKEAWAY_ORDER - TCID: TKW-SVC-CR-002 - CRUD: CREATE", async () => {
      const input = {
        payload: {
          payment_method: "payos",
          items: [{ product_size_id: 1, quantity: 1 }],
          returnUrl: "https://app.example/return",
          cancelUrl: "https://app.example/cancel",
        },
        staffUser: { id: 10 },
      };
      const expected = {
        payment_method: "payos",
        payment_status: "pending",
        checkout_url: "https://pay.example/checkout",
        qr_code: "base64-qr",
      };
      logCase({
        tcid: "TKW-SVC-CR-002",
        crud: "CREATE",
        scenario: "tạo đơn takeaway payos",
        input,
        expected,
      });

      TakeawayRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        name: "Coffee",
        size: "L",
        price: 40000,
        status: "available",
        is_deleted: 0,
        product_deleted: 0,
      });
      TakeawayRepository.createOrder.mockResolvedValue(102);
      TakeawayRepository.createOrderDetail.mockResolvedValue(202);
      payOS.paymentRequests.create.mockResolvedValue({
        checkoutUrl: "https://pay.example/checkout",
        qrCode: "base64-qr",
      });

      const result = await TakeawayService.createTakeawayOrder(
        input.payload,
        input.staffUser
      );
      logReality(result);

      expect(TakeawayRepository.createOrderPayment).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 102,
          payment_method: "payos",
          payment_status: "pending",
          amount: 40000,
          paid_amount: 0,
          cash_received: 0,
          change_amount: 0,
        }
      );
      expect(result.checkout_url).toBe(expected.checkout_url);
      expect(result.qr_code).toBe(expected.qr_code);
    });

    it("TakeawayService - CREATE_TAKEAWAY_ORDER - TCID: TKW-SVC-CR-003 - CRUD: CREATE", async () => {
      const input = {
        payload: {
          payment_method: "banking",
          items: [{ product_size_id: 1, quantity: 1 }],
        },
        staffUser: { id: 1 },
      };
      const expectedError = "Phương thức thanh toán không hợp lệ";
      logCase({
        tcid: "TKW-SVC-CR-003",
        crud: "CREATE",
        scenario: "lỗi payment_method không hợp lệ",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await TakeawayService.createTakeawayOrder(input.payload, input.staffUser);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(TakeawayRepository.getConnection).not.toHaveBeenCalled();
    });
  });

  describe("assignToBarista", () => {
    it("TakeawayService - ASSIGN_TO_BARISTA - TCID: TKW-SVC-UP-001 - CRUD: UPDATE", async () => {
      const input = { orderId: 77, baristaUser: { id: 5 } };
      const expected = {
        order_id: 77,
        assigned_barista_id: 5,
        status: "preparing",
      };
      logCase({
        tcid: "TKW-SVC-UP-001",
        crud: "UPDATE",
        scenario: "barista nhận đơn pending đã paid",
        input,
        expected,
      });

      TakeawayRepository.findOrderById.mockResolvedValue({ id: 77, status: "pending" });
      TakeawayRepository.findOrderPayment.mockResolvedValue({ payment_status: "paid" });
      TakeawayRepository.assignBarista.mockResolvedValue(true);

      const result = await TakeawayService.assignToBarista(
        input.orderId,
        input.baristaUser
      );
      logReality(result);

      expect(TakeawayRepository.assignBarista).toHaveBeenCalledWith(77, 5);
      expect(result).toEqual(expected);
    });
  });

  describe("getReceipt", () => {
    it("TakeawayService - GET_RECEIPT - TCID: TKW-SVC-RD-001 - CRUD: READ", async () => {
      const input = { orderId: 88 };
      const expected = {
        order_id: 88,
        discount_amount: 2000,
        cash_received: 30000,
        items_length: 1,
      };
      logCase({
        tcid: "TKW-SVC-RD-001",
        crud: "READ",
        scenario: "lấy dữ liệu hóa đơn",
        input,
        expected,
      });

      TakeawayRepository.findOrderById.mockResolvedValue({
        id: 88,
        amount: 30000,
        total_amount: 28000,
        discount_amount: 2000,
        discount_code: "SAVE",
        discount_percentage: 10,
        delivery_fee: 0,
        order_type: "takeaway",
        status: "completed",
        created_at: "2026-04-10T10:00:00.000Z",
        paid_at: "2026-04-10T10:10:00.000Z",
        staff_first_name: "Lan",
        staff_last_name: "Nguyen",
      });
      TakeawayRepository.findOrderItems.mockResolvedValue([
        {
          product_name: "Coffee",
          size: "M",
          quantity: 1,
          price: 30000,
          note: null,
          toppings: [{ topping_id: 1, name: "Pearl", quantity: 1, price: 5000 }],
        },
      ]);
      TakeawayRepository.findOrderPayment.mockResolvedValue({
        payment_method: "cash",
        payment_status: "paid",
        paid_amount: 28000,
        amount: 28000,
        cash_received: 30000,
        change_amount: 2000,
      });

      const result = await TakeawayService.getReceipt(88);
      logReality(result);

      expect(result.receipt.order_id).toBe(88);
      expect(result.receipt.discount_amount).toBe(2000);
      expect(result.receipt.payment.cash_received).toBe(30000);
      expect(result.receipt.items).toHaveLength(1);
    });
  });
});
