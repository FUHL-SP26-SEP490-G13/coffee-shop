jest.mock("../../src/repositories/ToppingRepository");

const ToppingService = require("../../src/services/ToppingService");
const ToppingRepository = require("../../src/repositories/ToppingRepository");
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

describe("ToppingService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getToppingById", () => {
    it("TOP-SVC-001: Trả về topping nếu ID hợp lệ", async () => {
      logCase({
        tcid: "TOP-SVC-001",
        scenario: "Lấy topping bằng ID",
        input: 1,
        expected: "Topping: Pearl",
      });
      ToppingRepository.findById.mockResolvedValue({
        id: 1,
        name: "Pearl",
        is_deleted: 0,
      });

      const result = await ToppingService.getToppingById(1);
      logReality(`Topping: ${result.name}`);
      expect(result.name).toBe("Pearl");
    });

    it("TOP-SVC-002: Lỗi 404 khi topping không tồn tại", async () => {
      logCase({
        tcid: "TOP-SVC-002",
        scenario: "ID không có trong DB",
        input: 999,
        expected: "404 - Topping không tồn tại",
      });
      ToppingRepository.findById.mockResolvedValue(null);

      try {
        await ToppingService.getToppingById(999);
      } catch (error) {
        logReality(`${error.statusCode} - ${error.message}`);
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe("createTopping", () => {
    it("TOP-SVC-003: Lỗi 400 nếu tên topping đã tồn tại", async () => {
      const input = { name: "Pearl", price: 5000 };
      logCase({
        tcid: "TOP-SVC-003",
        scenario: "Tạo topping trùng tên",
        input,
        expected: "400 - Topping đã tồn tại",
      });
      ToppingRepository.findByName.mockResolvedValue({ id: 1, name: "Pearl" });

      try {
        await ToppingService.createTopping(input);
      } catch (error) {
        logReality(`${error.statusCode} - ${error.message}`);
        expect(error.statusCode).toBe(400);
      }
    });

    it("TOP-SVC-004: Tạo topping thành công", async () => {
      const input = { name: "Aloe Vera", price: 7000, category_ids: [1, 2] };
      logCase({
        tcid: "TOP-SVC-004",
        scenario: "Tạo topping mới",
        input,
        expected: "SUCCESS",
      });
      ToppingRepository.findByName.mockResolvedValue(null);
      ToppingRepository.create.mockImplementation((data) =>
        Promise.resolve({ id: 2, ...data })
      );

      const result = await ToppingService.createTopping(input);
      logReality("SUCCESS");
      expect(result.name).toBe("Aloe Vera");
    });
  });

  describe("deleteTopping", () => {
    it("TOP-SVC-005: Soft delete thành công", async () => {
      logCase({
        tcid: "TOP-SVC-005",
        scenario: "Xóa mềm topping ID 1",
        input: 1,
        expected: "true",
      });
      ToppingRepository.findById.mockResolvedValue({
        id: 1,
        name: "Pearl",
        is_deleted: 0,
      });
      ToppingRepository.softDelete.mockResolvedValue(true);

      const result = await ToppingService.deleteTopping(1);
      logReality(result);
      expect(result).toBe(true);
      expect(ToppingRepository.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
