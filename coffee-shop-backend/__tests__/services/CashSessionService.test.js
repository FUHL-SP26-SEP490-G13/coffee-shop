jest.mock("../../src/repositories/CashSessionRepository");

const CashSessionService = require("../../src/services/CashSessionService");
const CashSessionRepository = require("../../src/repositories/CashSessionRepository");
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

describe("CashSessionService Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("openSession", () => {
        it("CAS-SVC-001: Mở ca thành công với dữ liệu hợp lệ", async () => {
            const input = { opening_cash: 500000, opening_note: "Tiền đầu ca" };
            logCase({ tcid: "CAS-SVC-001", scenario: "Mở ca hợp lệ", input, expected: "CA-YYMMDD-XXXX" });

            CashSessionRepository.getCurrentActiveUserShift.mockResolvedValue({ shift_registration_id: 101 });
            CashSessionRepository.findOpenSession.mockResolvedValue(null);
            CashSessionRepository.createSession.mockImplementation((data) => Promise.resolve({
                ...data, id: 1, status: "open", opener_first_name: "Staff", opener_last_name: "A"
            }));

            const result = await CashSessionService.openSession(input, { id: 1 });
            logReality(result.code);
            expect(result.code).toMatch(/^CA-\d{6}-\d{4}$/);
            expect(result.status).toBe("open");
        });

        it("CAS-SVC-002: Lỗi 400 khi số tiền đầu ca không hợp lệ (NaN hoặc < 0)", async () => {
            logCase({ tcid: "CAS-SVC-002", scenario: "Nhập tiền chữ hoặc số âm", input: "abc", expected: "400 - Tiền đầu ca không hợp lệ" });
            try {
                await CashSessionService.openSession({ opening_cash: "abc" }, { id: 1 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });

        it("CAS-SVC-003: Lỗi 403 khi mở ca sai giờ và báo lịch ca tiếp theo", async () => {
            logCase({ tcid: "CAS-SVC-003", scenario: "Không có lịch làm việc hiện tại", input: "user_id: 1", expected: "403 - Ca tiếp theo của bạn: 08:00 ngày 28/04/2026" });
            
            CashSessionRepository.getCurrentActiveUserShift.mockResolvedValue(null);
            CashSessionRepository.getNextUserShift.mockResolvedValue({
                start_time: "08:00:00",
                shift_date: "2026-04-28"
            });

            try {
                await CashSessionService.openSession({ opening_cash: 0 }, { id: 1 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(403);
                expect(error.message).toContain("08:00 ngày 28/04/2026");
            }
        });

        it("CAS-SVC-004: Lỗi 400 khi có ca khác đang mở chưa kết", async () => {
            logCase({ tcid: "CAS-SVC-004", scenario: "Mở ca khi ca cũ chưa đóng", input: "opening_cash: 0", expected: "400 - Đang có ca CA-OLD chưa kết" });
            
            CashSessionRepository.getCurrentActiveUserShift.mockResolvedValue({ shift_registration_id: 101 });
            CashSessionRepository.findOpenSession.mockResolvedValue({ code: "CA-OLD" });

            try {
                await CashSessionService.openSession({ opening_cash: 0 }, { id: 1 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
                expect(error.message).toContain("CA-OLD");
            }
        });
    });

    describe("closeSession", () => {
        const mockOpenSession = { id: 10, status: "open", opening_cash: 200000 };

        it("CAS-SVC-005: Kết ca thành công (Két khớp tiền)", async () => {
            const input = { closing_cash_actual: 700000 }; // 200k + 500k
            logCase({ tcid: "CAS-SVC-005", scenario: "Kết ca khớp tiền hệ thống", input, expected: "Két khớp, không chênh lệch" });

            CashSessionRepository.findById.mockResolvedValue(mockOpenSession);
            CashSessionRepository.isUserInSessionShift.mockResolvedValue(true);
            CashSessionRepository.getOrderSummary.mockResolvedValue({ cash_revenue: 500000 });
            CashSessionRepository.closeSession.mockImplementation((id, data) => Promise.resolve({
                ...mockOpenSession, ...data, cash_difference: 0, status: "closed"
            }));

            const result = await CashSessionService.closeSession(10, input, { id: 1 });
            logReality(result.closing_summary.difference_note);
            expect(result.closing_summary.cash_difference).toBe(0);
        });

        it("CAS-SVC-006: Kết ca thành công (Két thiếu tiền)", async () => {
            const input = { closing_cash_actual: 600000 }; // Thiếu 100k
            logCase({ tcid: "CAS-SVC-006", scenario: "Kết ca thiếu tiền", input, expected: "Két thiếu 100.000đ" });

            CashSessionRepository.findById.mockResolvedValue(mockOpenSession);
            CashSessionRepository.isUserInSessionShift.mockResolvedValue(true);
            CashSessionRepository.getOrderSummary.mockResolvedValue({ cash_revenue: 500000 });
            CashSessionRepository.closeSession.mockResolvedValue({
                ...mockOpenSession, cash_difference: -100000, status: "closed"
            });

            const result = await CashSessionService.closeSession(10, input, { id: 1 });
            logReality(result.closing_summary.difference_note);
            expect(result.closing_summary.cash_difference).toBe(-100000);
        });

        it("CAS-SVC-007: Lỗi 403 khi đóng ca của người khác (Không thuộc shift)", async () => {
            logCase({ tcid: "CAS-SVC-007", scenario: "User không thuộc ca cố đóng ca", input: "user_id: 2", expected: "403 - Bạn không thuộc ca này" });

            CashSessionRepository.findById.mockResolvedValue(mockOpenSession);
            CashSessionRepository.isUserInSessionShift.mockResolvedValue(false);

            try {
                await CashSessionService.closeSession(10, { closing_cash_actual: 700000 }, { id: 2 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(403);
            }
        });
    });

    describe("getCurrentSession", () => {
        it("CAS-SVC-008: Manager có thể xem ca của bất kỳ ai", async () => {
            logCase({ tcid: "CAS-SVC-008", scenario: "Manager xem ca hiện tại", input: "role: manager", expected: "Session data" });

            CashSessionRepository.findOpenSession.mockResolvedValue({ id: 10, opening_cash: 100000 });
            CashSessionRepository.getOrderSummary.mockResolvedValue({ cash_revenue: 50000 });

            const result = await CashSessionService.getCurrentSession({ id: 99, role: "manager" });
            logReality(result ? "Session found" : "null");
            expect(result.current_cash).toBe(150000);
        });
    });

    describe("forceCloseSession", () => {
        it("CAS-SVC-009: Manager đóng ca hộ thành công", async () => {
            logCase({ tcid: "CAS-SVC-009", scenario: "Manager force close", input: "manager: 99", expected: "SUCCESS" });

            CashSessionRepository.findById.mockResolvedValue({ id: 10, status: "open", opening_cash: 100000 });
            CashSessionRepository.getOrderSummary.mockResolvedValue({ cash_revenue: 0 });
            CashSessionRepository.closeSession.mockResolvedValue({ id: 10, status: "closed", closed_by: 99 });

            const result = await CashSessionService.forceCloseSession(10, { closing_cash_actual: 100000 }, { id: 99 });
            logReality("SUCCESS");
            expect(CashSessionRepository.closeSession).toHaveBeenCalledWith(10, expect.objectContaining({
                closed_by: 99,
                closing_note: expect.stringContaining("[Manager đóng hộ]")
            }));
        });
    });

    describe("getSessionSummary", () => {
        it("CAS-SVC-010: Lấy summary thành công", async () => {
            logCase({ tcid: "CAS-SVC-010", scenario: "Xem summary ca", expected: "Total Revenue: 150000" });
            CashSessionRepository.findById.mockResolvedValue({ id: 10, opening_cash: 100000 });
            CashSessionRepository.getOrderSummary.mockResolvedValue({
                total_orders: 5,
                completed_orders: 4,
                cash_revenue: 50000,
                payos_revenue: 100000
            });

            const result = await CashSessionService.getSessionSummary(10);
            logReality(`Total Revenue: ${result.summary.total_revenue}`);
            expect(result.summary.total_revenue).toBe(150000);
            expect(result.summary.current_cash_system).toBe(150000); // 100k open + 50k cash
        });
    });

    describe("getReceipt", () => {
        it("CAS-SVC-011: Lấy phiếu bàn giao thành công", async () => {
            logCase({ tcid: "CAS-SVC-011", scenario: "In hóa đơn kết ca", expected: "cash_difference: -5000" });
            CashSessionRepository.findById.mockResolvedValue({
                id: 10, code: "CA-123", opening_cash: 100000, 
                status: "closed", closing_cash_system: 150000, 
                closing_cash_actual: 145000, cash_difference: -5000
            });
            CashSessionRepository.getOrderSummary.mockResolvedValue({ cash_revenue: 50000 });

            const result = await CashSessionService.getReceipt(10);
            logReality(`cash_difference: ${result.cash_reconciliation.cash_difference}`);
            expect(result.cash_reconciliation.cash_difference).toBe(-5000);
        });
    });

    describe("History Methods", () => {
        it("CAS-SVC-012: getSessionHistory trả về danh sách đã format", async () => {
            logCase({ tcid: "CAS-SVC-012", scenario: "Lấy lịch sử ca (Admin)", expected: "Array length 1" });
            CashSessionRepository.findAll.mockResolvedValue([{ id: 1, code: "CA-1" }]);

            const result = await CashSessionService.getSessionHistory({ status: "closed" });
            logReality(`Array length ${result.length}`);
            expect(result[0].id).toBe(1);
        });

        it("CAS-SVC-013: getMySessionHistory trả về ca của đúng User", async () => {
            logCase({ tcid: "CAS-SVC-013", scenario: "Lấy lịch sử ca của tôi", expected: "Called with userId" });
            CashSessionRepository.findAll.mockResolvedValue([]);

            await CashSessionService.getMySessionHistory({}, 5);
            logReality("Called");
            expect(CashSessionRepository.findAll).toHaveBeenCalledWith(expect.objectContaining({ userId: 5 }));
        });
    });

    describe("Edge Cases", () => {
        it("CAS-SVC-014: closeSession lỗi nếu ca đã đóng", async () => {
            logCase({ tcid: "CAS-SVC-014", scenario: "Đóng ca đã đóng", expected: "400 - Ca này đã được kết trước đó" });
            CashSessionRepository.findById.mockResolvedValue({ id: 10, status: "closed" });

            try {
                await CashSessionService.closeSession(10, { closing_cash_actual: 100 }, { id: 1 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });

        it("CAS-SVC-015: getCurrentSession trả về null nếu không có ca", async () => {
            logCase({ tcid: "CAS-SVC-015", scenario: "Xem ca khi không có ca nào mở", expected: "null" });
            CashSessionRepository.findOpenSession.mockResolvedValue(null);

            const result = await CashSessionService.getCurrentSession({ id: 1 });
            logReality(result === null ? "null" : "not null");
            expect(result).toBeNull();
        });
    });
});
