jest.mock("../../src/repositories/CartRepository");
jest.mock("../../src/config/database");

const CartService = require("../../src/services/CartService");
const CartRepository = require("../../src/repositories/CartRepository");
const db = require("../../src/config/database");
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

describe("CartService Unit Tests", () => {
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };
    db.getConnection.mockResolvedValue(mockConnection);
  });

  describe("normalizeToppings", () => {
    it("CRT-SVC-001: Chuẩn hóa và sắp xếp Topping theo ID", () => {
      const input = [
        { topping_id: 2, quantity: 1 },
        { id: 1, quantity: 2 },
      ];
      logCase({
        tcid: "CRT-SVC-001",
        scenario: "Chuẩn hóa list topping lộn xộn",
        input,
        expected: "ID 1 đứng trước ID 2",
      });

      const result = CartService.normalizeToppings(input);
      logReality(result);
      expect(result[0].topping_id).toBe(1);
      expect(result[1].topping_id).toBe(2);
    });
  });

  describe("mergeCollections", () => {
    it("CRT-SVC-002: Gộp sản phẩm giống hệt nhau (cùng size và cùng topping)", () => {
      const existing = [
        {
          product_size_id: 1,
          quantity: 1,
          toppings: [{ topping_id: 10, quantity: 1 }],
        },
      ];
      const incoming = [
        {
          product_size_id: 1,
          quantity: 2,
          toppings: [{ topping_id: 10, quantity: 1 }],
        },
      ];
      logCase({
        tcid: "CRT-SVC-002",
        scenario: "Merge 1 + 2 sản phẩm giống nhau",
        input: { existing, incoming },
        expected: "Quantity: 3",
      });

      const result = CartService.mergeCollections(existing, incoming);
      logReality(result[0].quantity);
      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(3);
    });

    it("CRT-SVC-003: Không gộp nếu khác Topping dù cùng size", () => {
      const existing = [{ product_size_id: 1, quantity: 1, toppings: [] }];
      const incoming = [
        {
          product_size_id: 1,
          quantity: 1,
          toppings: [{ topping_id: 10, quantity: 1 }],
        },
      ];
      logCase({
        tcid: "CRT-SVC-003",
        scenario: "Cùng size nhưng khác topping",
        input: "Diff toppings",
        expected: "Array length: 2",
      });

      const result = CartService.mergeCollections(existing, incoming);
      logReality(result.length);
      expect(result).toHaveLength(2);
    });
  });

  describe("validateItem", () => {
    it("CRT-SVC-004: Lỗi 400 khi product_size_id không tồn tại", async () => {
      logCase({
        tcid: "CRT-SVC-004",
        scenario: "Validate item không có trong DB",
        input: "id: 999",
        expected: "400 - Sản phẩm không tồn tại",
      });
      CartRepository.findProductSizeById.mockResolvedValue(null);

      try {
        await CartService.validateItem(mockConnection, { product_size_id: 999 });
      } catch (error) {
        logReality(`${error.statusCode} - ${error.message}`);
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe("getCartByUser", () => {
    it("CRT-SVC-005: Tính tổng tiền giỏ hàng chính xác (Base + Toppings)", async () => {
      logCase({
        tcid: "CRT-SVC-005",
        scenario: "Giỏ hàng 1 món + 1 topping",
        expected: "totalAmount: 40000",
      });

      CartRepository.findCartByUserId.mockResolvedValue({ id: 100 });
      CartRepository.findCartItemsByCartId.mockResolvedValue([
        {
          id: 1,
          product_size_id: 1,
          base_price: 30000,
          quantity: 1,
          name: "Coffee",
        },
      ]);
      CartRepository.findToppingsByCartItemIds.mockResolvedValue([
        {
          cart_item_id: 1,
          topping_id: 10,
          price: 10000,
          quantity: 1,
          name: "Pearl",
        },
      ]);

      const result = await CartService.getCartByUser(1);
      logReality(result.totalAmount);
      expect(result.totalAmount).toBe(40000);
    });
  });
});
