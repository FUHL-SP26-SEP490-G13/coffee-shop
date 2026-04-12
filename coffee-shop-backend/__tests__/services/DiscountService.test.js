const DiscountService = require("../../src/services/DiscountService");
const DiscountRepository = require("../../src/repositories/DiscountRepository");

// Mock dependencies
jest.mock("../../src/repositories/DiscountRepository");

describe("DiscountService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("DiscountService - getAll - TC-01: should return all discounts successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - GET_ALL - TC-1: Lấy danh sách discount thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        page: 1,
        limit: 10,
        code: "SUMMER",
        status: "active",
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

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

      DiscountRepository.findAll.mockResolvedValue(mockResult);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockResult, null, 2));

      // Act
      const result = await DiscountService.getAll(input);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(DiscountRepository.findAll).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResult);
    });
  });

  describe("getById", () => {
    it("DiscountService - getById - TC-01: should return discount when found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - GET_BY_ID - TC-1: Lấy discount theo id thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockDiscount = {
        id: 1,
        code: "SUMMER2024",
        description: "Giảm giá mùa hè",
        percentage: 10,
      };
      DiscountRepository.findById.mockResolvedValue(mockDiscount);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockDiscount, null, 2));

      // Act
      const result = await DiscountService.getById(input.id);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(DiscountRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDiscount);
    });

    it("DiscountService - getById - TC-02: should throw error when discount not found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - GET_BY_ID - TC-2: Lỗi khi không tìm thấy discount"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = "Không tìm thấy mã giảm giá";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(DiscountService.getById(999)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(DiscountRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  describe("create", () => {
    it("DiscountService - create - TC-01: should create discount successfully with trimmed fields", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - CREATE - TC-1: Tạo discount thành công với dữ liệu hợp lệ"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        code: "  SUMMER2024  ",
        description: "  Giảm giá mùa hè  ",
        percentage: 10,
        min_order_amount: 100000,
        max_discount_amount: 50000,
        usage_limit: 100,
        valid_from: "2025-01-01T00:00:00",
        valid_until: "2025-12-31T23:59:59",
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findByCode.mockResolvedValue(null);
      DiscountRepository.create.mockResolvedValue(10);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: created id = 10");

      // Act
      const result = await DiscountService.create(input);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.findByCode).toHaveBeenCalledWith("SUMMER2024");
      expect(DiscountRepository.create).toHaveBeenCalledWith({
        ...input,
        code: "SUMMER2024",
        description: "Giảm giá mùa hè",
      });
      expect(result).toBe(10);
    });

    it("DiscountService - create - TC-02: should create discount with description null when description is empty", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - CREATE - TC-2: Tạo discount với description = null khi description rỗng"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        code: "  SALE50  ",
        description: "   ",
        percentage: 50,
        min_order_amount: 100000,
        max_discount_amount: 50000,
        usage_limit: 10,
        valid_from: "2025-01-01T00:00:00",
        valid_until: "2025-12-31T23:59:59",
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findByCode.mockResolvedValue(null);
      DiscountRepository.create.mockResolvedValue(11);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: description = null, created id = 11");

      // Act
      const result = await DiscountService.create(input);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.create).toHaveBeenCalledWith({
        ...input,
        code: "SALE50",
        description: null,
      });
      expect(result).toBe(11);
    });

    it("DiscountService - create - TC-03: should throw error when code already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - CREATE - TC-3: Lỗi khi mã giảm giá đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        code: "SUMMER2024",
        description: "Giảm giá mùa hè",
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findByCode.mockResolvedValue({ id: 1 });

      // OUTPUT EXPECT
      const expectedError = "Mã giảm giá đã tồn tại";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(DiscountService.create(input)).rejects.toThrow(
        expectedError
      );

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(DiscountRepository.findByCode).toHaveBeenCalledWith("SUMMER2024");
      expect(DiscountRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    const existingDiscount = {
      id: 1,
      code: "SUMMER2024",
      description: "Giảm giá mùa hè",
      percentage: 10,
      min_order_amount: 100000,
      max_discount_amount: 50000,
      usage_limit: 100,
      valid_from: "2025-01-01T00:00:00",
      valid_until: "2025-12-31T23:59:59",
      used_count: 0,
    };

    it("DiscountService - update - TC-01: should update discount successfully when unused", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-1: Cập nhật discount thành công khi chưa được sử dụng"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          code: "  WINTER2024  ",
          description: "  Giảm giá mùa đông  ",
          percentage: 20,
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findById.mockResolvedValue(existingDiscount);
      DiscountRepository.findByCode.mockResolvedValue(null);
      DiscountRepository.update.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: true");

      // Act
      const result = await DiscountService.update(input.id, input.data);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.findById).toHaveBeenCalledWith(1);
      expect(DiscountRepository.findByCode).toHaveBeenCalledWith("WINTER2024");
      expect(DiscountRepository.update).toHaveBeenCalledWith(1, {
        ...input.data,
        code: "WINTER2024",
        description: "Giảm giá mùa đông",
      });
      expect(result).toBe(true);
    });

    it("DiscountService - update - TC-02: should update discount successfully without checking duplicate when code unchanged", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-2: Cập nhật discount khi code không đổi"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          code: "  summer2024  ",
          description: "  Mô tả mới  ",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findById.mockResolvedValue(existingDiscount);
      DiscountRepository.update.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: update thành công, không check duplicate");

      // Act
      const result = await DiscountService.update(input.id, input.data);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.findByCode).not.toHaveBeenCalled();
      expect(DiscountRepository.update).toHaveBeenCalledWith(1, {
        ...input.data,
        code: "summer2024",
        description: "Mô tả mới",
      });
      expect(result).toBe(true);
    });

    it("DiscountService - update - TC-03: should throw error when discount not found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-3: Lỗi khi discount không tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 999,
        data: {
          description: "abc",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = "Không tìm thấy mã giảm giá";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(DiscountService.update(999, input.data)).rejects.toThrow(
        expectedError
      );

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(DiscountRepository.update).not.toHaveBeenCalled();
    });

    it("DiscountService - update - TC-04: should throw error when new code already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-4: Lỗi khi mã giảm giá mới đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          code: "NEWCODE2024",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findById.mockResolvedValue(existingDiscount);
      DiscountRepository.findByCode.mockResolvedValue({ id: 2 });

      // OUTPUT EXPECT
      const expectedError = "Mã giảm giá đã tồn tại";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(DiscountService.update(1, input.data)).rejects.toThrow(
        expectedError
      );

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(DiscountRepository.findByCode).toHaveBeenCalledWith("NEWCODE2024");
      expect(DiscountRepository.update).not.toHaveBeenCalled();
    });

    it("DiscountService - update - TC-05: should only allow description and valid_until when discount has been used", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-5: Chỉ cho sửa description và valid_until khi discount đã được sử dụng"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          description: "  Mô tả mới  ",
          valid_until: "2025-12-01T00:00:00",
          percentage: 20,
          code: "NEWCODE",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const usedDiscount = {
        ...existingDiscount,
        used_count: 5,
      };
      DiscountRepository.findById.mockResolvedValue(usedDiscount);
      DiscountRepository.update.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: chỉ update description và valid_until");

      // Act
      const result = await DiscountService.update(1, input.data);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.update).toHaveBeenCalledWith(1, {
        description: "Mô tả mới",
        valid_until: "2025-12-01T00:00:00",
      });
      expect(result).toBe(true);
      expect(DiscountRepository.findByCode).not.toHaveBeenCalled();
    });

    it("DiscountService - update - TC-06: should allow update used discount with description only", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-6: Cho phép sửa description khi discount đã được sử dụng"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          description: "  Mô tả cập nhật  ",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const usedDiscount = {
        ...existingDiscount,
        used_count: 2,
      };
      DiscountRepository.findById.mockResolvedValue(usedDiscount);
      DiscountRepository.update.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: true");

      // Act
      const result = await DiscountService.update(1, input.data);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.update).toHaveBeenCalledWith(1, {
        description: "Mô tả cập nhật",
      });
      expect(result).toBe(true);
    });

    it("DiscountService - update - TC-07: should allow update used discount with valid_until only", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-7: Cho phép sửa valid_until khi discount đã được sử dụng"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          valid_until: "2025-12-20T00:00:00",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const usedDiscount = {
        ...existingDiscount,
        used_count: 1,
      };
      DiscountRepository.findById.mockResolvedValue(usedDiscount);
      DiscountRepository.update.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: true");

      // Act
      const result = await DiscountService.update(1, input.data);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.update).toHaveBeenCalledWith(1, {
        valid_until: "2025-12-20T00:00:00",
      });
      expect(result).toBe(true);
    });

    it("DiscountService - update - TC-08: should throw error when used discount updates invalid fields only", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-8: Lỗi khi discount đã được sử dụng nhưng sửa field không được phép"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          percentage: 50,
          code: "NEWCODE",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const usedDiscount = {
        ...existingDiscount,
        used_count: 10,
      };
      DiscountRepository.findById.mockResolvedValue(usedDiscount);

      // OUTPUT EXPECT
      const expectedError =
        "Mã giảm giá đã được sử dụng, chỉ được sửa ngày kết thúc, mô tả";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(DiscountService.update(1, input.data)).rejects.toThrow(
        expectedError
      );

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(DiscountRepository.update).not.toHaveBeenCalled();
    });

    it("DiscountService - update - TC-09: should convert empty trimmed description to null", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - UPDATE - TC-9: Chuyển description rỗng thành null"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          description: "   ",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findById.mockResolvedValue(existingDiscount);
      DiscountRepository.update.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: description = null");

      // Act
      const result = await DiscountService.update(1, input.data);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.update).toHaveBeenCalledWith(1, {
        description: null,
        code: undefined,
      });
      expect(result).toBe(true);
    });
  });

  describe("delete", () => {
    it("DiscountService - delete - TC-01: should soft delete discount successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - DELETE - TC-1: Xóa mềm discount thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockDiscount = {
        id: 1,
        code: "SUMMER2024",
      };
      DiscountRepository.findById.mockResolvedValue(mockDiscount);
      DiscountRepository.softDelete.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: true");

      // Act
      const result = await DiscountService.delete(1);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(DiscountRepository.findById).toHaveBeenCalledWith(1);
      expect(DiscountRepository.softDelete).toHaveBeenCalledTimes(1);

      const [deletedId, newCode] = DiscountRepository.softDelete.mock.calls[0];
      expect(deletedId).toBe(1);
      expect(newCode).toContain("SUMMER2024__deleted__1__");

      expect(result).toBe(true);
    });

    it("DiscountService - delete - TC-02: should throw error when discount not found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "DiscountService - DELETE - TC-2: Lỗi khi không tìm thấy discount để xóa"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      DiscountRepository.findById.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = "Không tìm thấy mã giảm giá";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(DiscountService.delete(999)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(DiscountRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});
