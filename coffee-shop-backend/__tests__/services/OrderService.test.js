const OrderService = require("../../src/services/OrderService");
const OrderRepository = require("../../src/repositories/OrderRepository");

jest.mock("../../src/repositories/OrderRepository");

describe("OrderService", () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn(),
    };

    OrderRepository.getConnection.mockResolvedValue(mockConnection);
  });

  describe("checkout", () => {
    it("OrderService - CHECKOUT - TC-1: should checkout successfully with cash payment and no toppings", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderService - CHECKOUT - TC-1: Đặt hàng thành công với cash và không có topping"
      );
      console.log("=".repeat(50));

      // INPUT
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        receiver_email: "a@example.com",
        address: "123 ABC",
        note: "Giao nhanh",
        items: [
          {
            product_size_id: 1,
            quantity: 2,
            toppings: [],
          },
        ],
      };
      const user = { id: 1 };
      console.log("\n📝 INPUT:", JSON.stringify({ payload, user }, null, 2));

      // Arrange
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
      OrderRepository.createOrderDeliveryInfo.mockResolvedValue(true);
      OrderRepository.createOrderPayment.mockResolvedValue(true);

      // OUTPUT EXPECT
      const expectedOutput = {
        order_id: 100,
        total_amount: 60000,
      };
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await OrderService.checkout(payload, user);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(OrderRepository.findProductSizeById).toHaveBeenCalledWith(
        mockConnection,
        1
      );
      expect(OrderRepository.createOrder).toHaveBeenCalledWith(mockConnection, {
        user_id: 1,
        created_by: 1,
        customer_type: "registered",
        order_type: "delivery",
        total_amount: 60000,
      });
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
          payment_status: "pending",
          amount: 60000,
        }
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toEqual(expectedOutput);
    });

    it("OrderService - CHECKOUT - TC-2: should checkout successfully with toppings", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "OrderService - CHECKOUT - TC-2: Đặt hàng thành công với topping"
      );
      console.log("=".repeat(50));

      // INPUT
      const payload = {
        order_type: "takeaway",
        payment_method: "cash",
        receiver_name: "Guest User",
        receiver_phone: "0987654321",
        items: [
          {
            product_size_id: 1,
            quantity: 2,
            toppings: [
              {
                topping_id: 10,
                quantity: 2,
              },
            ],
          },
        ],
      };
      const user = null;
      console.log("\n📝 INPUT:", JSON.stringify({ payload, user }, null, 2));

      // Arrange
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
      OrderRepository.createOrderDetailTopping.mockResolvedValue(true);
      OrderRepository.createOrderDeliveryInfo.mockResolvedValue(true);
      OrderRepository.createOrderPayment.mockResolvedValue(true);

      // unitPrice = 30000 + (5000*2) = 40000
      // total = 40000 * 2 = 80000

      const result = await OrderService.checkout(payload, user);

      expect(OrderRepository.createOrder).toHaveBeenCalledWith(mockConnection, {
        user_id: null,
        created_by: null,
        customer_type: "guest",
        order_type: "takeaway",
        total_amount: 80000,
      });

      expect(OrderRepository.createOrderDetail).toHaveBeenCalledWith(
        mockConnection,
        {
          order_id: 101,
          product_size_id: 1,
          quantity: 2,
          price: 40000,
        }
      );

      expect(OrderRepository.createOrderDetailTopping).toHaveBeenCalledWith(
        mockConnection,
        {
          order_detail_id: 201,
          topping_id: 10,
          quantity: 2,
          price: 5000,
        }
      );

      expect(result).toEqual({
        order_id: 101,
        total_amount: 80000,
      });
    });

    it("OrderService - CHECKOUT - TC-3: should throw error when cart is empty", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [],
      };

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Giỏ hàng trống"
      );

      expect(OrderRepository.getConnection).not.toHaveBeenCalled();
    });

    it("OrderService - CHECKOUT - TC-4: should throw error when order_type is invalid", async () => {
      const payload = {
        order_type: "invalid-type",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [{ product_size_id: 1, quantity: 1 }],
      };

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Loại đơn hàng không hợp lệ"
      );
    });

    it("OrderService - CHECKOUT - TC-5: should throw error when payment_method is invalid", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "banking",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [{ product_size_id: 1, quantity: 1 }],
      };

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Phương thức thanh toán không hợp lệ"
      );
    });

    it("OrderService - CHECKOUT - TC-6: should throw error when receiver info is missing", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "",
        receiver_phone: "",
        items: [{ product_size_id: 1, quantity: 1 }],
      };

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Vui lòng nhập tên và số điện thoại người nhận"
      );
    });

    it("OrderService - CHECKOUT - TC-7: should throw error when item data is invalid", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [{ product_size_id: null, quantity: 0 }],
      };

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Dữ liệu sản phẩm trong giỏ hàng không hợp lệ"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("OrderService - CHECKOUT - TC-8: should throw error when product does not exist", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [{ product_size_id: 99, quantity: 1 }],
      };

      OrderRepository.findProductSizeById.mockResolvedValue(null);

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Sản phẩm không tồn tại"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("OrderService - CHECKOUT - TC-9: should throw error when product is unavailable", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [{ product_size_id: 1, quantity: 1 }],
      };

      OrderRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        price: 30000,
        name: "Coffee",
        status: "unavailable",
      });

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        'Sản phẩm "Coffee" hiện không khả dụng'
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("OrderService - CHECKOUT - TC-10: should throw error when topping is invalid", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [
          {
            product_size_id: 1,
            quantity: 1,
            toppings: [{ topping_id: null, quantity: 1 }],
          },
        ],
      };

      OrderRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        price: 30000,
        name: "Coffee",
        status: "available",
      });

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Topping không hợp lệ"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("OrderService - CHECKOUT - TC-11: should throw error when topping does not exist", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [
          {
            product_size_id: 1,
            quantity: 1,
            toppings: [{ topping_id: 10, quantity: 1 }],
          },
        ],
      };

      OrderRepository.findProductSizeById.mockResolvedValue({
        id: 1,
        price: 30000,
        name: "Coffee",
        status: "available",
      });

      OrderRepository.findToppingById.mockResolvedValue(null);

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Topping không tồn tại"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("OrderService - CHECKOUT - TC-12: should rollback and release when repository throws unexpected error", async () => {
      const payload = {
        order_type: "delivery",
        payment_method: "cash",
        receiver_name: "Nguyen Van A",
        receiver_phone: "0123456789",
        items: [{ product_size_id: 1, quantity: 1 }],
      };

      OrderRepository.findProductSizeById.mockRejectedValue(
        new Error("Database failed")
      );

      await expect(OrderService.checkout(payload, { id: 1 })).rejects.toThrow(
        "Database failed"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("getOrdersByUser", () => {
    it("OrderService - GET_ORDERS_BY_USER - TC-1: should get orders by user successfully", async () => {
      const mockOrders = [
        { id: 1, total_amount: 50000 },
        { id: 2, total_amount: 60000 },
      ];

      OrderRepository.findOrdersByUser.mockResolvedValue(mockOrders);

      const result = await OrderService.getOrdersByUser(1);

      expect(OrderRepository.findOrdersByUser).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrders);
    });
  });

  describe("getOrderDetailByUser", () => {
    it("OrderService - GET_ORDER_DETAIL_BY_USER - TC-1: should get order detail successfully", async () => {
      const mockOrder = {
        id: 10,
        total_amount: 120000,
      };

      const mockItems = [{ id: 1, name: "Coffee", toppings: [] }];

      OrderRepository.findOrderByIdAndUser.mockResolvedValue(mockOrder);
      OrderRepository.findOrderItems.mockResolvedValue(mockItems);

      const result = await OrderService.getOrderDetailByUser(10, 1);

      expect(OrderRepository.findOrderByIdAndUser).toHaveBeenCalledWith(10, 1);
      expect(OrderRepository.findOrderItems).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        ...mockOrder,
        items: mockItems,
      });
    });

    it("OrderService - GET_ORDER_DETAIL_BY_USER - TC-2: should throw error when order does not exist", async () => {
      OrderRepository.findOrderByIdAndUser.mockResolvedValue(null);

      await expect(OrderService.getOrderDetailByUser(999, 1)).rejects.toThrow(
        "Đơn hàng không tồn tại"
      );

      expect(OrderRepository.findOrderItems).not.toHaveBeenCalled();
    });
  });

  describe("savePayosReturn", () => {
    it("OrderService - SAVE_PAYOS_RETURN - TC-1: should save paid status successfully", async () => {
      const input = {
        orderCode: 100,
        payosId: "PAYOS123",
        status: "PAID",
      };

      OrderRepository.updatePaymentByOrderCode.mockResolvedValue(true);
      OrderRepository.updateOrderPaidStatus.mockResolvedValue(true);

      const result = await OrderService.savePayosReturn(input);

      expect(OrderRepository.updatePaymentByOrderCode).toHaveBeenCalledWith(
        100,
        {
          transaction_id: "PAYOS123",
          payment_status: "paid",
        }
      );
      expect(OrderRepository.updateOrderPaidStatus).toHaveBeenCalledWith(
        100,
        true
      );
      expect(result).toEqual({ saved: true });
    });

    it("OrderService - SAVE_PAYOS_RETURN - TC-2: should save cancelled status successfully", async () => {
      const input = {
        orderCode: 100,
        payosId: "PAYOS123",
        status: "CANCELLED",
      };

      OrderRepository.updatePaymentByOrderCode.mockResolvedValue(true);

      const result = await OrderService.savePayosReturn(input);

      expect(OrderRepository.updatePaymentByOrderCode).toHaveBeenCalledWith(
        100,
        {
          transaction_id: "PAYOS123",
          payment_status: "cancelled",
        }
      );
      expect(OrderRepository.updateOrderPaidStatus).not.toHaveBeenCalled();
      expect(result).toEqual({ saved: true });
    });

    it("OrderService - SAVE_PAYOS_RETURN - TC-3: should save pending status successfully", async () => {
      const input = {
        orderCode: 100,
        payosId: null,
        status: "PENDING",
      };

      OrderRepository.updatePaymentByOrderCode.mockResolvedValue(true);

      const result = await OrderService.savePayosReturn(input);

      expect(OrderRepository.updatePaymentByOrderCode).toHaveBeenCalledWith(
        100,
        {
          transaction_id: null,
          payment_status: "pending",
        }
      );
      expect(OrderRepository.updateOrderPaidStatus).not.toHaveBeenCalled();
      expect(result).toEqual({ saved: true });
    });

    it("OrderService - SAVE_PAYOS_RETURN - TC-4: should throw error when orderCode is missing", async () => {
      await expect(
        OrderService.savePayosReturn({
          payosId: "PAYOS123",
          status: "PAID",
        })
      ).rejects.toThrow("Thiếu orderCode");
    });
  });
});
