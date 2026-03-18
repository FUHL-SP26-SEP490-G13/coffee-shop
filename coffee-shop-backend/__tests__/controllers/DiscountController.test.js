const DiscountController = require("../../src/controllers/DiscountController");
const DiscountService = require("../../src/services/DiscountService");
const response = require("../../src/utils/response");

// Mock dependencies
jest.mock("../../src/services/DiscountService");
jest.mock("../../src/utils/response");

describe("DiscountController", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      query: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();

    response.success = jest.fn();
  });

  describe("getAll", () => {
    it("DiscountController - GET_ALL - TC-1: should get all discounts successfully with default query", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - GET_ALL - TC-1: Lấy danh sách discount thành công với query mặc định"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = {};
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockResult = {
        items: [
          {
            id: 1,
            code: "SUMMER2024",
            description: "Giảm giá mùa hè",
            percentage: 10,
          },
        ],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      DiscountService.getAll.mockResolvedValue(mockResult);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockResult, null, 2));

      // Act
      await DiscountController.getAll(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: response.success called with discounts");

      // Assert
      expect(DiscountService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        code: "",
        status: "",
      });
      expect(response.success).toHaveBeenCalledWith(res, mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - GET_ALL - TC-2: should get all discounts successfully with filters", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - GET_ALL - TC-2: Lấy danh sách discount thành công với filter"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = {
        page: "2",
        limit: "5",
        code: "SUMMER",
        status: "active",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockResult = {
        items: [
          {
            id: 2,
            code: "SUMMER2025",
            description: "Giảm giá mùa hè 2025",
            percentage: 15,
          },
        ],
        total: 6,
        page: 2,
        totalPages: 2,
      };

      DiscountService.getAll.mockResolvedValue(mockResult);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockResult, null, 2));

      // Act
      await DiscountController.getAll(req, res, next);

      // OUTPUT REALITY
      console.log(
        "🎯 OUTPUT REALITY: response.success called with filtered discounts"
      );

      // Assert
      expect(DiscountService.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        code: "SUMMER",
        status: "active",
      });
      expect(response.success).toHaveBeenCalledWith(res, mockResult);
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - GET_ALL - TC-3: should call next when service throws error", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - GET_ALL - TC-3: Xử lý lỗi khi lấy danh sách discount"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = {
        page: "1",
        limit: "10",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockError = new Error("Database connection failed");
      DiscountService.getAll.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: Error -", mockError.message);

      // Act
      await DiscountController.getAll(req, res, next);

      // OUTPUT REALITY
      console.log(
        "🎯 OUTPUT REALITY: next() called with error -",
        mockError.message
      );

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("DiscountController - GET_BY_ID - TC-1: should get discount by id successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - GET_BY_ID - TC-1: Lấy discount theo id thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      const mockDiscount = {
        id: 1,
        code: "SUMMER2024",
        description: "Giảm giá mùa hè",
        percentage: 10,
      };

      DiscountService.getById.mockResolvedValue(mockDiscount);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockDiscount, null, 2));

      // Act
      await DiscountController.getById(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: response.success called with discount");

      // Assert
      expect(DiscountService.getById).toHaveBeenCalledWith("1");
      expect(response.success).toHaveBeenCalledWith(res, mockDiscount);
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - GET_BY_ID - TC-2: should call next when discount not found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - GET_BY_ID - TC-2: Xử lý lỗi khi không tìm thấy discount"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "999" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      const mockError = new Error("Không tìm thấy mã giảm giá");
      DiscountService.getById.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: Error -", mockError.message);

      // Act
      await DiscountController.getById(req, res, next);

      // OUTPUT REALITY
      console.log(
        "🎯 OUTPUT REALITY: next() called with error -",
        mockError.message
      );

      // Assert
      expect(DiscountService.getById).toHaveBeenCalledWith("999");
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("DiscountController - CREATE - TC-1: should create discount successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - CREATE - TC-1: Tạo discount thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        code: "SUMMER2024",
        description: "Giảm giá mùa hè",
        percentage: 10,
        min_order_amount: 100000,
        max_discount_amount: 50000,
        usage_limit: 100,
        valid_from: "2025-01-01T00:00:00",
        valid_until: "2025-12-31T23:59:59",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.body, null, 2));

      // Arrange
      const mockId = 10;
      DiscountService.create.mockResolvedValue(mockId);

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(
          { id: mockId, message: "Tạo discount thành công", statusCode: 201 },
          null,
          2
        )
      );

      // Act
      await DiscountController.create(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: response.success called with created id");

      // Assert
      expect(DiscountService.create).toHaveBeenCalledWith(req.body);
      expect(response.success).toHaveBeenCalledWith(
        res,
        { id: mockId },
        "Tạo discount thành công",
        201
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - CREATE - TC-2: should return validation error when code already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - CREATE - TC-2: Trả về lỗi khi mã giảm giá đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        code: "SUMMER2024",
        description: "Giảm giá mùa hè",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.body, null, 2));

      // Arrange
      const mockError = new Error("Mã giảm giá đã tồn tại");
      DiscountService.create.mockRejectedValue(mockError);

      const expectedResponse = {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "code",
            message: "Mã giảm giá đã tồn tại",
          },
        ],
      };

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(expectedResponse, null, 2)
      );

      // Act
      await DiscountController.create(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: res.status(400).json(...) called");

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
      expect(response.success).not.toHaveBeenCalled();
    });

    it("DiscountController - CREATE - TC-3: should call next for unexpected error", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - CREATE - TC-3: Xử lý lỗi hệ thống khi tạo discount"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        code: "SUMMER2024",
        description: "Giảm giá mùa hè",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.body, null, 2));

      // Arrange
      const mockError = new Error("Database connection failed");
      DiscountService.create.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: Error -", mockError.message);

      // Act
      await DiscountController.create(req, res, next);

      // OUTPUT REALITY
      console.log(
        "🎯 OUTPUT REALITY: next() called with error -",
        mockError.message
      );

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("DiscountController - UPDATE - TC-1: should update discount successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - UPDATE - TC-1: Cập nhật discount thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      req.body = {
        description: "Giảm giá mới cập nhật",
        percentage: 20,
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ params: req.params, body: req.body }, null, 2)
      );

      // Arrange
      DiscountService.update.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT: response.success(null, 'Cập nhật thành công')"
      );

      // Act
      await DiscountController.update(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: response.success called");

      // Assert
      expect(DiscountService.update).toHaveBeenCalledWith("1", req.body);
      expect(response.success).toHaveBeenCalledWith(
        res,
        null,
        "Cập nhật thành công"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - UPDATE - TC-2: should return validation error when code already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - UPDATE - TC-2: Trả về lỗi khi mã giảm giá đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      req.body = {
        code: "SUMMER2024",
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ params: req.params, body: req.body }, null, 2)
      );

      // Arrange
      const mockError = new Error("Mã giảm giá đã tồn tại");
      DiscountService.update.mockRejectedValue(mockError);

      const expectedResponse = {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "code",
            message: "Mã giảm giá đã tồn tại",
          },
        ],
      };

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(expectedResponse, null, 2)
      );

      // Act
      await DiscountController.update(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: res.status(400).json(...) called");

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - UPDATE - TC-3: should return validation error when discount has been used", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - UPDATE - TC-3: Trả về lỗi khi mã giảm giá đã được sử dụng"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      req.body = {
        percentage: 25,
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ params: req.params, body: req.body }, null, 2)
      );

      // Arrange
      const errorMessage =
        "Mã giảm giá đã được sử dụng, chỉ được sửa ngày kết thúc, mô tả";
      const mockError = new Error(errorMessage);
      DiscountService.update.mockRejectedValue(mockError);

      const expectedResponse = {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "server",
            message: errorMessage,
          },
        ],
      };

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(expectedResponse, null, 2)
      );

      // Act
      await DiscountController.update(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: res.status(400).json(...) called");

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - UPDATE - TC-4: should call next for unexpected error", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - UPDATE - TC-4: Xử lý lỗi hệ thống khi cập nhật discount"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      req.body = {
        description: "abc",
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ params: req.params, body: req.body }, null, 2)
      );

      // Arrange
      const mockError = new Error("Database connection failed");
      DiscountService.update.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: Error -", mockError.message);

      // Act
      await DiscountController.update(req, res, next);

      // OUTPUT REALITY
      console.log(
        "🎯 OUTPUT REALITY: next() called with error -",
        mockError.message
      );

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("DiscountController - DELETE - TC-1: should delete discount successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - DELETE - TC-1: Xóa discount thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      DiscountService.delete.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT: response.success(null, 'Mã giảm giá đã xóa thành công')"
      );

      // Act
      await DiscountController.delete(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: response.success called");

      // Assert
      expect(DiscountService.delete).toHaveBeenCalledWith("1");
      expect(response.success).toHaveBeenCalledWith(
        res,
        null,
        "Mã giảm giá đã xóa thành công"
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("DiscountController - DELETE - TC-2: should call next when discount not found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountController - DELETE - TC-2: Xử lý lỗi khi không tìm thấy discount để xóa"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "999" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      const mockError = new Error("Không tìm thấy mã giảm giá");
      DiscountService.delete.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: Error -", mockError.message);

      // Act
      await DiscountController.delete(req, res, next);

      // OUTPUT REALITY
      console.log(
        "🎯 OUTPUT REALITY: next() called with error -",
        mockError.message
      );

      // Assert
      expect(DiscountService.delete).toHaveBeenCalledWith("999");
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });
});
