jest.mock("../../src/repositories/ShiftRepository");
jest.mock("../../src/repositories/AttendanceRepository");

const ShiftService = require("../../src/services/ShiftService");
const ShiftRepository = require("../../src/repositories/ShiftRepository");
const { logTestCase } = require('../utils/logger');

let pendingLogCase = null;
const logCase = (payload = {}) => { pendingLogCase = payload; };
const logReality = (actual) => {
    const payload = pendingLogCase || {};
    logTestCase({
        name: `${payload.tcid} - ${payload.scenario}`,
        input: payload.input,
        expected: payload.expected,
        actual: actual
    });
    pendingLogCase = null;
};

describe("ShiftService Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("timeToMinutes", () => {
        it("SHF-SVC-001: Chuyển đổi giờ thành phút chính xác", () => {
            logCase({ tcid: "SHF-SVC-001", scenario: "08:30 thành 510 phút", input: "08:30", expected: 510 });
            const result = ShiftService.timeToMinutes("08:30");
            logReality(result);
            expect(result).toBe(510);
        });
    });

    describe("isTimeOverlap", () => {
        it("SHF-SVC-002: Phát hiện trùng lặp ca thường", () => {
            logCase({ tcid: "SHF-SVC-002", scenario: "Trùng lặp 10:00-12:00 và 11:00-13:00", input: "10:00-12:00 vs 11:00-13:00", expected: true });
            const result = ShiftService.isTimeOverlap("10:00", "12:00", "11:00", "13:00");
            logReality(result);
            expect(result).toBe(true);
        });

        it("SHF-SVC-003: Không trùng lặp ca liền kề", () => {
            logCase({ tcid: "SHF-SVC-003", scenario: "Ca 08:00-12:00 và 12:00-16:00", input: "08:00-12:00 vs 12:00-16:00", expected: false });
            const result = ShiftService.isTimeOverlap("08:00", "12:00", "12:00", "16:00");
            logReality(result);
            expect(result).toBe(false);
        });

        it("SHF-SVC-004: Trùng lặp ca qua đêm", () => {
            logCase({ tcid: "SHF-SVC-004", scenario: "Ca 22:00-02:00 trùng với 01:00-05:00", input: "22:00-02:00 vs 01:00-05:00", expected: true });
            const result = ShiftService.isTimeOverlap("22:00", "02:00", "01:00", "05:00");
            logReality(result);
            expect(result).toBe(true);
        });
    });

    describe("assignSingle", () => {
        it("SHF-SVC-005: Lỗi 400 khi gán ca trong quá khứ", async () => {
            const pastDate = "2020-01-01";
            logCase({ tcid: "SHF-SVC-005", scenario: "Gán ca cho năm 2020", input: pastDate, expected: "400 - Không thể gán ca cho ngày trong quá khứ" });
            try {
                await ShiftService.assignSingle({ date: pastDate, user_id: 1, template_id: 1 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });

        it("SHF-SVC-006: Lỗi 404 khi nhân viên không tồn tại", async () => {
            logCase({ tcid: "SHF-SVC-006", scenario: "Gán ca cho user ID 999 không tồn tại", input: 999, expected: "404 - Nhân viên không tồn tại" });
            ShiftRepository.findTemplateById.mockResolvedValue({ id: 1, name: "Morning", start_time: "08:00", end_time: "12:00" });
            ShiftRepository.findUserById.mockResolvedValue(null);

            try {
                await ShiftService.assignSingle({ date: "2026-12-01", user_id: 999, template_id: 1 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(404);
            }
        });

        it("SHF-SVC-007: Lỗi 400 khi nhân viên đã ngừng hoạt động", async () => {
            logCase({ tcid: "SHF-SVC-007", scenario: "Gán ca cho nhân viên isActive = 0", input: "user_id: 1", expected: "400 - Nhân viên đã ngừng hoạt động" });
            ShiftRepository.findTemplateById.mockResolvedValue({ id: 1, name: "Morning", start_time: "08:00", end_time: "12:00" });
            ShiftRepository.findUserById.mockResolvedValue({ id: 1, isActive: 0 });

            try {
                await ShiftService.assignSingle({ date: "2026-12-01", user_id: 1, template_id: 1 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });
    });
});
