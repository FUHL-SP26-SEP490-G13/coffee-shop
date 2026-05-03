jest.mock("../../src/repositories/AddressRepository");

const AddressService = require("../../src/services/AddressService");
const AddressRepository = require("../../src/repositories/AddressRepository");
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

describe("AddressService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("normalizeNullableText", () => {
    it("ADR-SVC-001: Chuẩn hóa text - Trim và null nếu rỗng", () => {
      logCase({
        tcid: "ADR-SVC-001",
        scenario: "Chuẩn hóa text rỗng/trim",
        input: "  ",
        expected: "null",
      });
      const result = AddressService.normalizeNullableText("  ");
      logReality(result === null ? "null" : result);
      expect(result).toBeNull();
    });
  });

  describe("createAddress", () => {
    it("ADR-SVC-002: Tự động đặt làm mặc định nếu là địa chỉ đầu tiên", async () => {
      const payload = { address: "123 Street", receiver_name: "An" };
      logCase({
        tcid: "ADR-SVC-002",
        scenario: "Tạo địa chỉ đầu tiên",
        input: payload,
        expected: "is_default: 1",
      });

      AddressRepository.findByUserId.mockResolvedValue([]); // Chưa có địa chỉ nào
      AddressRepository.create.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 1 })
      );

      const result = await AddressService.createAddress(1, payload);
      logReality(`is_default: ${result.is_default}`);
      expect(result.is_default).toBe(1);
    });

    it("ADR-SVC-003: Xóa mặc định cũ nếu địa chỉ mới được set is_default = 1", async () => {
      const payload = { address: "New Home", is_default: 1 };
      logCase({
        tcid: "ADR-SVC-003",
        scenario: "Thêm địa chỉ mặc định mới",
        input: payload,
        expected: "clearDefaultByUserId called",
      });

      AddressRepository.findByUserId.mockResolvedValue([
        { id: 10, is_default: 1 },
      ]);
      AddressRepository.create.mockImplementation((data) =>
        Promise.resolve({ ...data, id: 2 })
      );

      await AddressService.createAddress(1, payload);
      logReality("called");
      expect(AddressRepository.clearDefaultByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe("deleteAddress", () => {
    it("ADR-SVC-004: Tự động gán mặc định cho địa chỉ còn lại nếu xóa địa chỉ mặc định", async () => {
      logCase({
        tcid: "ADR-SVC-004",
        scenario: "Xóa địa chỉ mặc định hiện có",
        input: "id: 1",
        expected: "Address ID 2 becomes default",
      });

      AddressRepository.findByIdAndUser.mockResolvedValue({
        id: 1,
        is_default: 1,
      });
      AddressRepository.findByUserId.mockResolvedValue([
        { id: 2, is_default: 0 },
      ]); // Còn lại địa chỉ 2

      await AddressService.deleteAddress(1, 1);
      logReality("Address 2 updated to is_default: 1");
      expect(AddressRepository.update).toHaveBeenCalledWith(2, {
        is_default: 1,
      });
    });
  });
});
