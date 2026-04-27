jest.mock("nodemailer");
jest.mock("../../src/config/env", () => ({
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: 587,
  SMTP_USER: "test@gmail.com",
  SMTP_PASSWORD: "password",
  CLIENT_URL: "http://localhost:3000",
}));

const nodemailer = require("nodemailer");
const EmailService = require("../../src/services/EmailService");
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

describe("EmailService Unit Tests", () => {
  let mockTransporter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "12345" }),
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);

    // Re-instantiate or inject to use mocked transporter
    EmailService.transporter = mockTransporter;
  });

  describe("sendOTPEmail", () => {
    it("EML-SVC-001: Gửi email OTP thành công", async () => {
      logCase({
        tcid: "EML-SVC-001",
        scenario: "Gửi OTP cho user An",
        input: "an@example.com",
        expected: "success: true",
      });

      const result = await EmailService.sendOTPEmail(
        "an@example.com",
        "123456",
        "An"
      );
      logReality(`success: ${result.success}`);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "an@example.com",
          subject: expect.stringContaining("Xác thực Email"),
        })
      );
      expect(result.success).toBe(true);
    });

    it("EML-SVC-002: Lỗi 500 khi SMTP server gặp sự cố", async () => {
      logCase({
        tcid: "EML-SVC-002",
        scenario: "SMTP error",
        input: "error@test.com",
        expected: "500 - Không thể gửi email",
      });
      mockTransporter.sendMail.mockRejectedValue(
        new Error("SMTP Connection Failed")
      );

      try {
        await EmailService.sendOTPEmail("error@test.com", "123456", "User");
      } catch (error) {
        logReality(`${error.statusCode} - ${error.message}`);
        expect(error.statusCode).toBe(500);
      }
    });
  });

  describe("sendStaffAccountEmail", () => {
    it("EML-SVC-003: Gửi thông tin tài khoản nhân viên mới", async () => {
      logCase({
        tcid: "EML-SVC-003",
        scenario: "Gửi pass tạm cho Staff",
        expected: "success: true",
      });

      const result = await EmailService.sendStaffAccountEmail(
        "staff@test.com",
        "Staff A",
        "temp123",
        "BARISTA"
      );
      logReality(`success: ${result.success}`);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining("temp123"),
        })
      );
      expect(result.success).toBe(true);
    });
  });
});
