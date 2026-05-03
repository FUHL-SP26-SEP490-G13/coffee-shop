jest.mock("../../src/repositories/ShiftRepository");

const ShiftTemplateService = require("../../src/services/ShiftTemplateService");
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

describe("ShiftTemplateService Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("create", () => {
        it("TPL-SVC-001: Tạo mẫu ca thành công với dữ liệu hợp lệ", async () => {
            const input = { name: "Ca Chiều", start_time: "13:00", end_time: "17:00", color: "orange" };
            logCase({ tcid: "TPL-SVC-001", scenario: "Tạo mẫu ca hợp lệ", input, expected: "SUCCESS" });

            ShiftRepository.findTemplateByName.mockResolvedValue(null);
            ShiftRepository.findTemplateByColor.mockResolvedValue(null);
            ShiftRepository.findOverlappingTemplate.mockResolvedValue(null);
            ShiftRepository.createTemplate.mockResolvedValue({ id: 1, ...input });

            const result = await ShiftTemplateService.create(input);
            logReality("SUCCESS");

            expect(result.name).toBe("Ca Chiều");
            expect(ShiftRepository.createTemplate).toHaveBeenCalled();
        });

        it("TPL-SVC-002: Lỗi 400 khi thời lượng ca quá ngắn (< 2 tiếng)", async () => {
            const input = { name: "Ca Ngắn", start_time: "08:00", end_time: "09:00" };
            logCase({ tcid: "TPL-SVC-002", scenario: "Ca chỉ dài 1 tiếng", input, expected: "400 - Ca làm việc phải dài ít nhất 2 tiếng" });

            try {
                await ShiftTemplateService.create(input);
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
                expect(error.message).toContain("2 tiếng");
            }
        });

        it("TPL-SVC-003: Lỗi 400 khi sai định dạng giờ", async () => {
            const input = { name: "Ca Lỗi", start_time: "8:00", end_time: "12:00" }; // Thiếu số 0 đầu
            logCase({ tcid: "TPL-SVC-003", scenario: "Giờ 8:00 thay vì 08:00", input, expected: "400 - Định dạng giờ không hợp lệ" });

            try {
                await ShiftTemplateService.create(input);
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });

        it("TPL-SVC-004: Lỗi 400 khi trùng khung giờ với ca khác", async () => {
            const input = { name: "Ca Chiều", start_time: "13:00", end_time: "17:00" };
            logCase({ tcid: "TPL-SVC-004", scenario: "Trùng khung giờ", input, expected: "400 - Khung giờ bị trùng với ca khác" });

            ShiftRepository.findOverlappingTemplate.mockResolvedValue({ id: 99, name: "CA KHÁC" });

            try {
                await ShiftTemplateService.create(input);
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });
        describe("update", () => {
            it("TPL-SVC-005: Cập nhật mẫu ca thành công", async () => {
                const input = { name: "Ca Sáng Mới", start_time: "07:00", end_time: "11:00" };
                logCase({ tcid: "TPL-SVC-005", scenario: "Cập nhật thông tin hợp lệ", input, expected: "SUCCESS" });

                ShiftRepository.findTemplateById.mockResolvedValue({ id: 1, name: "CA SÁNG", start_time: "08:00", end_time: "12:00", color: "blue" });
                ShiftRepository.findTemplateByName.mockResolvedValue(null);
                ShiftRepository.findOverlappingTemplate.mockResolvedValue(null);
                ShiftRepository.updateTemplate.mockResolvedValue({ id: 1, ...input, color: "blue" });

                const result = await ShiftTemplateService.update(1, input);
                logReality("SUCCESS");

                expect(result.name).toBe("Ca Sáng Mới");
                expect(ShiftRepository.updateTemplate).toHaveBeenCalled();
            });

            it("TPL-SVC-006: Lỗi 404 khi không tìm thấy mẫu ca", async () => {
                logCase({ tcid: "TPL-SVC-006", scenario: "Cập nhật ca không tồn tại", input: "id: 999", expected: "404 - Ca làm việc không tồn tại" });

                ShiftRepository.findTemplateById.mockResolvedValue(null);

                try {
                    await ShiftTemplateService.update(999, { name: "New Name" });
                } catch (error) {
                    logReality(`${error.statusCode} - ${error.message}`);
                    expect(error.statusCode).toBe(404);
                }
            });

            it("TPL-SVC-007: Lỗi 400 khi tên mới đã tồn tại ở ca khác", async () => {
                const input = { name: "Ca Chiều" };
                logCase({ tcid: "TPL-SVC-007", scenario: "Cập nhật tên bị trùng", input, expected: "400 - Ca \"Ca Chiều\" đã tồn tại" });

                ShiftRepository.findTemplateById.mockResolvedValue({ id: 1, name: "CA SÁNG" });
                ShiftRepository.findTemplateByName.mockResolvedValue({ id: 2, name: "CA CHIỀU" });

                try {
                    await ShiftTemplateService.update(1, input);
                } catch (error) {
                    logReality(`${error.statusCode} - ${error.message}`);
                    expect(error.statusCode).toBe(400);
                }
            });

            it("TPL-SVC-008: Lỗi 400 khi cập nhật khung giờ gây trùng lặp", async () => {
                const input = { start_time: "08:00", end_time: "12:00" };
                logCase({ tcid: "TPL-SVC-008", scenario: "Cập nhật giờ bị trùng với ca khác", input, expected: "400 - Khung giờ bị trùng với ca khác" });

                ShiftRepository.findTemplateById.mockResolvedValue({ id: 1, name: "CA SÁNG", start_time: "07:00", end_time: "11:00" });
                ShiftRepository.findOverlappingTemplate.mockResolvedValue({ id: 2, name: "CA KHÁC" });

                try {
                    await ShiftTemplateService.update(1, input);
                } catch (error) {
                    logReality(`${error.statusCode} - ${error.message}`);
                    expect(error.statusCode).toBe(400);
                }
            });
        });
    });
})
