jest.mock("../../src/repositories/AttendanceRepository");
jest.mock("../../src/repositories/UserRepository");
jest.mock("../../src/repositories/AttendanceSettingRepository");
jest.mock("../../src/services/RekognitionService");

const AttendanceService = require("../../src/services/AttendanceService");
const AttendanceRepository = require("../../src/repositories/AttendanceRepository");
const AttendanceSettingRepository = require("../../src/repositories/AttendanceSettingRepository");
const { ATTENDANCE_STATUS } = require('../../src/config/constants');
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

describe("AttendanceService Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("_handleClockIn", () => {
        it("ATT-SVC-001: Đánh dấu LATE nếu đi muộn quá số phút quy định", async () => {
            const targetShift = { shift_name: "Ca sáng", shift_date: "2026-04-27", start_time: "08:00:00", registration_id: 1 };
            const settings = { late_after_minutes: 15 };
            const checkInTime = new Date("2026-04-27T08:20:00"); 
            logCase({ tcid: "ATT-SVC-001", scenario: "Check-in muộn 20p (limit 15p)", input: "08:20:00", expected: "LATE (20 mins)" });

            AttendanceRepository.create.mockImplementation((data) => Promise.resolve({ ...data, id: 1 }));

            const result = await AttendanceService._handleClockIn({ first_name: "An", last_name: "Nguyen" }, targetShift, checkInTime, settings);
            logReality(`${result.attendance.status} (${result.lateMinutes} mins)`);
            
            expect(result.attendance.status).toBe(ATTENDANCE_STATUS.LATE);
            expect(result.lateMinutes).toBe(20);
        });

        it("ATT-SVC-002: Đánh dấu PRESENT nếu đi đúng giờ", async () => {
            const targetShift = { shift_name: "Ca sáng", shift_date: "2026-04-27", start_time: "08:00:00", registration_id: 1 };
            const settings = { late_after_minutes: 15 };
            const checkInTime = new Date("2026-04-27T08:05:00"); 
            logCase({ tcid: "ATT-SVC-002", scenario: "Check-in muộn 5p (limit 15p)", input: "08:05:00", expected: "PRESENT" });

            AttendanceRepository.create.mockImplementation((data) => Promise.resolve({ ...data, id: 1 }));

            const result = await AttendanceService._handleClockIn({ first_name: "An" }, targetShift, checkInTime, settings);
            logReality(result.attendance.status);
            
            expect(result.attendance.status).toBe(ATTENDANCE_STATUS.PRESENT);
        });
    });

    describe("_processClockLogic", () => {
        it("ATT-SVC-003: Lỗi 400 khi không có ca làm việc nào hôm nay", async () => {
            logCase({ tcid: "ATT-SVC-003", scenario: "Điểm danh khi không có ca", input: "user_id: 1", expected: "400 - bạn không có ca làm việc nào được duyệt" });
            
            AttendanceSettingRepository.findSetting.mockResolvedValue({ early_checkin_minutes: 30 });
            AttendanceRepository.findTodayShiftsForUser.mockResolvedValue([]);

            try {
                await AttendanceService._processClockLogic({ id: 1, first_name: "An", last_name: "Nguyen" });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });

        it("ATT-SVC-004: Tự động chuyển sang Clock Out nếu đang trong ca", async () => {
            const now = new Date("2026-04-27T12:05:00");
            const mockShift = {
                registration_id: 1,
                attendance_id: 100,
                shift_name: "Ca sáng",
                shift_date: "2026-04-27",
                start_time: "08:00:00",
                end_time: "12:00:00",
                check_in: "2026-04-27 08:00:00",
                check_out: null
            };
            logCase({ tcid: "ATT-SVC-004", scenario: "Clock-out tự động khi đã check-in", input: "Now: 12:05", expected: "check_out" });

            AttendanceSettingRepository.findSetting.mockResolvedValue({ early_checkin_minutes: 30 });
            AttendanceRepository.findTodayShiftsForUser.mockResolvedValue([mockShift]);
            AttendanceRepository.update.mockResolvedValue({ id: 100, check_out: "2026-04-27 12:05:00" });

            // Mocking Date to control "now"
            jest.useFakeTimers().setSystemTime(now);

            const result = await AttendanceService._processClockLogic({ id: 1, first_name: "An" });
            logReality(result.type);
            
            expect(result.type).toBe("check_out");
            jest.useRealTimers();
        });

        it("ATT-SVC-005: Lỗi 400 khi check-in quá sớm", async () => {
            const now = new Date("2026-04-27T07:20:00"); // Start 08:00, Early limit 30p -> Min 07:30
            const mockShift = { shift_name: "Ca sáng", shift_date: "2026-04-27", start_time: "08:00:00", end_time: "12:00:00", check_in: null };
            logCase({ tcid: "ATT-SVC-005", scenario: "Check-in lúc 07:20 cho ca 08:00 (limit 30p)", input: "07:20", expected: "400 - chưa mở điểm danh" });

            AttendanceSettingRepository.findSetting.mockResolvedValue({ early_checkin_minutes: 30 });
            AttendanceRepository.findTodayShiftsForUser.mockResolvedValue([mockShift]);

            jest.useFakeTimers().setSystemTime(now);
            try {
                await AttendanceService._processClockLogic({ id: 1, first_name: "An" });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
                expect(error.message).toContain("chưa mở điểm danh");
            }
            jest.useRealTimers();
        });

        it("ATT-SVC-006: Lỗi 400 khi ca đã kết thúc", async () => {
            const now = new Date("2026-04-27T12:05:00"); // End 12:00
            const mockShift = { shift_name: "Ca sáng", shift_date: "2026-04-27", start_time: "08:00:00", end_time: "12:00:00", check_in: null };
            logCase({ tcid: "ATT-SVC-006", scenario: "Check-in lúc 12:05 cho ca đã end 12:00", expected: "400 - ca Ca sáng đã kết thúc" });

            AttendanceSettingRepository.findSetting.mockResolvedValue({ early_checkin_minutes: 30 });
            AttendanceRepository.findTodayShiftsForUser.mockResolvedValue([mockShift]);

            jest.useFakeTimers().setSystemTime(now);
            try {
                await AttendanceService._processClockLogic({ id: 1, first_name: "An" });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
                expect(error.message).toContain("đã kết thúc");
            }
            jest.useRealTimers();
        });
    });

    describe("registerFace", () => {
        const UserRepository = require("../../src/repositories/UserRepository");
        const RekognitionService = require("../../src/services/RekognitionService");

        it("ATT-SVC-007: Đăng ký khuôn mặt thành công", async () => {
            logCase({ tcid: "ATT-SVC-007", scenario: "Đăng ký face thành công", input: "userId: 1", expected: "success" });
            UserRepository.findById.mockResolvedValue({ id: 1 });
            RekognitionService.registerFace.mockResolvedValue("face_123");

            const result = await AttendanceService.registerFace(1, Buffer.from("img"));
            logReality("SUCCESS");
            expect(UserRepository.updateFaceId).toHaveBeenCalledWith(1, "face_123");
        });

        it("ATT-SVC-008: Lỗi 404 khi không tìm thấy user để đăng ký face", async () => {
            logCase({ tcid: "ATT-SVC-008", scenario: "User không tồn tại", expected: "404 - Không tìm thấy người dùng" });
            UserRepository.findById.mockResolvedValue(null);

            try {
                await AttendanceService.registerFace(99, Buffer.from("img"));
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(404);
            }
        });
    });

    describe("clockByFace", () => {
        const UserRepository = require("../../src/repositories/UserRepository");
        const RekognitionService = require("../../src/services/RekognitionService");

        it("ATT-SVC-009: Điểm danh thành công qua face", async () => {
            logCase({ tcid: "ATT-SVC-009", scenario: "Nhận diện face thành công", expected: "success" });
            RekognitionService.recognizeFace.mockResolvedValue("face_123");
            UserRepository.findByFaceId.mockResolvedValue({ id: 1, first_name: "An", isActive: 1 });
            
            // Mock _processClockLogic to avoid deep dependency
            jest.spyOn(AttendanceService, "_processClockLogic").mockResolvedValue({ type: "check_in" });

            const result = await AttendanceService.clockByFace(Buffer.from("img"));
            logReality(result.type);
            expect(result.type).toBe("check_in");
            AttendanceService._processClockLogic.mockRestore();
        });

        it("ATT-SVC-010: Lỗi 400 khi faceId null", async () => {
            logCase({ tcid: "ATT-SVC-010", scenario: "Ảnh không có mặt", expected: "400 - Không tìm thấy khuôn mặt" });
            RekognitionService.recognizeFace.mockResolvedValue(null);

            try {
                await AttendanceService.clockByFace(Buffer.from("img"));
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });
    });

    describe("updateAttendance", () => {
        it("ATT-SVC-011: Cập nhật ghi chú thành công", async () => {
            logCase({ tcid: "ATT-SVC-011", scenario: "Sửa note", input: "note: 'Updated'", expected: "note: 'Updated'" });
            AttendanceRepository.findById.mockResolvedValue({ id: 1 });
            AttendanceRepository.getAttendanceDetails.mockResolvedValue({ id: 1, note: "Updated" });

            const result = await AttendanceService.updateAttendance(1, { note: "Updated" });
            logReality(`note: '${result.note}'`);
            expect(AttendanceRepository.update).toHaveBeenCalledWith(1, { note: "Updated" });
        });

        it("ATT-SVC-012: Lỗi 400 khi sửa field không được phép", async () => {
            logCase({ tcid: "ATT-SVC-012", scenario: "Sửa check_in time", expected: "400 - Chỉ được phép cập nhật ghi chú" });
            AttendanceRepository.findById.mockResolvedValue({ id: 1 });

            try {
                await AttendanceService.updateAttendance(1, { check_in: "2026-01-01" });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });
    });

    describe("executeAutoCronLogic", () => {
        it("ATT-SVC-013: Đánh dấu vắng mặt cho các ca không đi làm", async () => {
            logCase({ tcid: "ATT-SVC-013", scenario: "Quét 2 ca vắng", expected: "absent: 2" });
            AttendanceRepository.findAbsentRegistrations.mockResolvedValue([
                { registration_id: 10 }, { registration_id: 11 }
            ]);

            const result = await AttendanceService.executeAutoCronLogic();
            logReality(`absent: ${result.absent}`);
            expect(AttendanceRepository.create).toHaveBeenCalledTimes(2);
            expect(result.absent).toBe(2);
        });
    });
});
