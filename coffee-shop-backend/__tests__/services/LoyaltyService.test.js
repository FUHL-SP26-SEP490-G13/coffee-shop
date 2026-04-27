jest.mock("../../src/repositories/LoyaltyRepository");
jest.mock("../../src/repositories/UserRepository");

const LoyaltyService = require("../../src/services/LoyaltyService");
const LoyaltyRepository = require("../../src/repositories/LoyaltyRepository");
const UserRepository = require("../../src/repositories/UserRepository");
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

describe("LoyaltyService Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("normalizePoints", () => {
        it("LOY-SVC-001: Trả về số điểm hợp lệ", () => {
            logCase({ tcid: "LOY-SVC-001", scenario: "Normalize số điểm nguyên dương", input: 10, expected: 10 });
            const result = LoyaltyService.normalizePoints(10);
            logReality(result);
            expect(result).toBe(10);
        });

        it("LOY-SVC-002: Lỗi 400 khi nhập số không phải số nguyên", () => {
            logCase({ tcid: "LOY-SVC-002", scenario: "Nhập số thập phân", input: 10.5, expected: "400 - Số điểm phải là số nguyên" });
            try {
                LoyaltyService.normalizePoints(10.5);
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
                expect(error.message).toContain("Số điểm phải là số nguyên");
            }
        });

        it("LOY-SVC-003: Lỗi 400 khi nhập số âm", () => {
            logCase({ tcid: "LOY-SVC-003", scenario: "Nhập số âm", input: -5, expected: "400 - Số điểm không hợp lệ" });
            try {
                LoyaltyService.normalizePoints(-5);
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });
    });

    describe("calculateEarnedPoints", () => {
        it("LOY-SVC-004: Tích điểm chính xác (10k = 1 điểm)", () => {
            logCase({ tcid: "LOY-SVC-004", scenario: "Tính điểm cho đơn 55.000đ", input: 55000, expected: 5 });
            const result = LoyaltyService.calculateEarnedPoints(55000);
            logReality(result);
            expect(result).toBe(5);
        });

        it("LOY-SVC-005: Đơn hàng nhỏ hơn 10k không có điểm", () => {
            logCase({ tcid: "LOY-SVC-005", scenario: "Tính điểm cho đơn 9.000đ", input: 9000, expected: 0 });
            const result = LoyaltyService.calculateEarnedPoints(9000);
            logReality(result);
            expect(result).toBe(0);
        });
    });

    describe("getRedeemDiscountForCheckout", () => {
        it("LOY-SVC-006: Tính toán mức giảm giá hợp lệ", async () => {
            const input = { userId: 1, usedPoints: 50, orderAmount: 20000 };
            logCase({ tcid: "LOY-SVC-006", scenario: "Dùng 50 điểm cho đơn 20k", input, expected: 5000 });
            
            LoyaltyRepository.ensureWallet.mockResolvedValue();
            LoyaltyRepository.getWalletByUserId.mockResolvedValue({ total_points: 100 });

            const result = await LoyaltyService.getRedeemDiscountForCheckout(null, input);
            logReality(result);
            expect(result).toBe(5000);
        });

        it("LOY-SVC-007: Lỗi 400 khi dùng điểm vượt quá 50% giá trị đơn hàng", async () => {
            const input = { userId: 1, usedPoints: 100, orderAmount: 10000 }; 
            logCase({ tcid: "LOY-SVC-007", scenario: "Dùng điểm quá 50% hóa đơn", input, expected: "400 - Số điểm quy đổi không được vượt quá 50% giá trị đơn hàng" });
            
            LoyaltyRepository.getWalletByUserId.mockResolvedValue({ total_points: 500 });

            try {
                await LoyaltyService.getRedeemDiscountForCheckout(null, input);
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(400);
            }
        });

        it("LOY-SVC-008: Lỗi 401 khi khách chưa đăng nhập", async () => {
            logCase({ tcid: "LOY-SVC-008", scenario: "Dùng điểm khi chưa login", input: { userId: null }, expected: "401 - Bạn cần đăng nhập để sử dụng điểm loyalty" });
            try {
                await LoyaltyService.getRedeemDiscountForCheckout(null, { userId: null, usedPoints: 10 });
            } catch (error) {
                logReality(`${error.statusCode} - ${error.message}`);
                expect(error.statusCode).toBe(401);
            }
        });
    });
});
