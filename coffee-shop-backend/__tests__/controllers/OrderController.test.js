const OrderController = require("../../src/controllers/OrderController");
const OrderService = require("../../src/services/OrderService");

jest.mock("../../src/services/OrderService");

describe("OrderController", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      user: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("checkout", () => {
    it("OrderController - checkout - TC-01: should checkout successfully for registered user", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderController - CHECKOUT - TC-1: Đặt hàng thành công cho user đã đăng nhập"
      );
      console.log("=".repeat(50));

      // INPUT
      req.user = { id: 1 };
      req.body = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        receiver_email: "a@example.com",
        address: "123 ABC",
        note: "Giao giờ trưa",
        items: [
          {
            product_size_id: 1,
            quantity: 2,
            toppings: [],
          },
        ],
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ body: req.body, user: req.user }, null, 2)
      );

      // Arrange
      const mockResult = {
        order_id: 100,
        total_amount: 90000,
      };
      OrderService.checkout.mockResolvedValue(mockResult);

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(
          {
            success: true,
            data: mockResult,
            message: "Đặt hàng thành công",
          },
          null,
          2
        )
      );

      // Act
      await OrderController.checkout(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: res.status(201).json(...) called");

      // Assert
      expect(OrderService.checkout).toHaveBeenCalledWith(req.body, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: "Đặt hàng thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("OrderController - checkout - TC-02: should checkout successfully for guest user", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderController - CHECKOUT - TC-2: Đặt hàng thành công cho guest"
      );
      console.log("=".repeat(50));

      // INPUT
      req.user = null;
      req.body = {
        order_type: "takeaway",
        payment_method: "cash",
        receiver_name: "Guest User",
        receiver_phone: "0987654321",
        items: [
          {
            product_size_id: 1,
            quantity: 1,
            toppings: [],
          },
        ],
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ body: req.body, user: req.user }, null, 2)
      );

      // Arrange
      const mockResult = {
        order_id: 101,
        total_amount: 45000,
      };
      OrderService.checkout.mockResolvedValue(mockResult);

      // Act
      await OrderController.checkout(req, res, next);

      // Assert
      expect(OrderService.checkout).toHaveBeenCalledWith(req.body, null);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: "Đặt hàng thành công",
      });
    });

    it("OrderController - checkout - TC-03: should call next when checkout fails", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderController - CHECKOUT - TC-3: Xử lý lỗi khi checkout thất bại"
      );
      console.log("=".repeat(50));

      // INPUT
      req.user = { id: 1 };
      req.body = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [],
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ body: req.body, user: req.user }, null, 2)
      );

      // Arrange
      const mockError = new Error("Giỏ hàng trống");
      OrderService.checkout.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: Error -", mockError.message);

      // Act
      await OrderController.checkout(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: next called with error");

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("getMyOrders", () => {
    it("OrderController - getMyOrders - TC-01: should return user orders successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderController - GET_MY_ORDERS - TC-1: Lấy danh sách đơn hàng của user thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.user = { id: 1 };
      console.log("\n📝 INPUT:", JSON.stringify(req.user, null, 2));

      // Arrange
      const mockOrders = [
        { id: 1, total_amount: 50000 },
        { id: 2, total_amount: 80000 },
      ];
      OrderService.getOrdersByUser.mockResolvedValue(mockOrders);

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(
          {
            success: true,
            data: mockOrders,
            message: "Lấy danh sách đơn hàng thành công",
          },
          null,
          2
        )
      );

      // Act
      await OrderController.getMyOrders(req, res);

      // Assert
      expect(OrderService.getOrdersByUser).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockOrders,
        message: "Lấy danh sách đơn hàng thành công",
      });
    });

    it("OrderController - getMyOrders - TC-02: should return 401 when user is not logged in", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderController - GET_MY_ORDERS - TC-2: Trả về 401 khi chưa đăng nhập"
      );
      console.log("=".repeat(50));

      // INPUT
      req.user = {};
      console.log("\n📝 INPUT:", JSON.stringify(req.user, null, 2));

      // Act
      await OrderController.getMyOrders(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Bạn cần đăng nhập để xem đơn hàng",
      });
      expect(OrderService.getOrdersByUser).not.toHaveBeenCalled();
    });
  });

  describe("getMyOrderDetail", () => {
    it("OrderController - getMyOrderDetail - TC-01: should return order detail successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderController - GET_MY_ORDER_DETAIL - TC-1: Lấy chi tiết đơn hàng thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.user = { id: 1 };
      req.params = { id: "10" };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ user: req.user, params: req.params }, null, 2)
      );

      // Arrange
      const mockDetail = {
        id: 10,
        total_amount: 120000,
        items: [{ id: 1, name: "Coffee" }],
      };
      OrderService.getOrderDetailByUser.mockResolvedValue(mockDetail);

      // Act
      await OrderController.getMyOrderDetail(req, res);

      // Assert
      expect(OrderService.getOrderDetailByUser).toHaveBeenCalledWith(10, 1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDetail,
        message: "Lấy chi tiết đơn hàng thành công",
      });
    });
  });

  describe("payosReturn", () => {
    it("OrderController - payosReturn - TC-01: should save payos return successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderController - PAYOS_RETURN - TC-1: Lưu kết quả PayOS return thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        orderCode: 100,
        payosId: "PAYOS123",
        status: "PAID",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.body, null, 2));

      // Arrange
      const mockResult = { saved: true };
      OrderService.savePayosReturn.mockResolvedValue(mockResult);

      // Act
      await OrderController.payosReturn(req, res, next);

      // Assert
      expect(OrderService.savePayosReturn).toHaveBeenCalledWith({
        orderCode: 100,
        payosId: "PAYOS123",
        status: "PAID",
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("OrderController - payosReturn - TC-02: should call next when save fails", async () => {
      const mockError = new Error("Thiếu orderCode");
      req.body = {
        payosId: "PAYOS123",
        status: "PAID",
      };
      OrderService.savePayosReturn.mockRejectedValue(mockError);

      await OrderController.payosReturn(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
