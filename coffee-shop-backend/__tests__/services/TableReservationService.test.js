jest.mock("../../src/repositories/TableReservationRepository");
jest.mock("../../src/repositories/TableRepository");

const TableReservationService = require("../../src/services/TableReservationService");
const TableReservationRepository = require("../../src/repositories/TableReservationRepository");
const TableRepository = require("../../src/repositories/TableRepository");
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

describe("TableReservationService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createReservation", () => {
    it("RES-SVC-001: Đặt bàn thành công và cập nhật trạng thái bàn", async () => {
      const input = {
        customerName: "An",
        phone: "0901234567",
        reservationTime: "2026-05-01 10:00:00",
      };
      logCase({
        tcid: "RES-SVC-001",
        scenario: "Đặt bàn trống thành công",
        input,
        expected: "Status: reserved",
      });

      TableRepository.findById.mockResolvedValue({
        id: 1,
        status: "available",
        is_deleted: 0,
      });
      TableReservationRepository.create.mockResolvedValue({ id: 101, ...input });

      const result = await TableReservationService.createReservation(1, input);
      logReality("SUCCESS");

      expect(TableRepository.update).toHaveBeenCalledWith(1, {
        status: "reserved",
      });
      expect(result.id).toBe(101);
    });

    it("RES-SVC-002: Lỗi 400 khi bàn đang có khách hoặc đã được đặt", async () => {
      logCase({
        tcid: "RES-SVC-002",
        scenario: "Đặt bàn đang có khách",
        input: "tableId: 1",
        expected: "400 - Bàn hiện không trống",
      });

      TableRepository.findById.mockResolvedValue({
        id: 1,
        status: "occupied",
        is_deleted: 0,
      });

      try {
        await TableReservationService.createReservation(1, {});
      } catch (error) {
        logReality(`${error.statusCode} - ${error.message}`);
        expect(error.statusCode).toBe(400);
      }
    });

    it("RES-SVC-003: Lỗi 404 khi bàn không tồn tại", async () => {
      logCase({
        tcid: "RES-SVC-003",
        scenario: "Đặt bàn không tồn tại",
        input: "tableId: 99",
        expected: "404 - Bàn không tồn tại",
      });
      TableRepository.findById.mockResolvedValue(null);

      try {
        await TableReservationService.createReservation(99, {});
      } catch (error) {
        logReality(`${error.statusCode} - ${error.message}`);
        expect(error.statusCode).toBe(404);
      }
    });
  });
});
