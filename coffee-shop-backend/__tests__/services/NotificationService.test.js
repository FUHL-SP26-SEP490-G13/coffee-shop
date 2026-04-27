jest.mock("../../src/repositories/NotificationRepository");
jest.mock("../../src/repositories/UserRepository");

const NotificationService = require("../../src/services/NotificationService");
const NotificationRepository = require("../../src/repositories/NotificationRepository");
const UserRepository = require("../../src/repositories/UserRepository");
const { ROLES } = require("../../src/config/constants");
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

describe("NotificationService Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createForBaristas", () => {
    it("NOT-SVC-001: Gửi thông báo cho toàn bộ Barista", async () => {
      const data = { title: "New Order", message: "Order #123" };
      logCase({
        tcid: "NOT-SVC-001",
        scenario: "Gửi thông báo Barista",
        input: data,
        expected: "Recipients length matches Barista count",
      });

      UserRepository.findByRole.mockResolvedValue([{ id: 10 }, { id: 11 }]);
      NotificationRepository.createNotification.mockResolvedValue({
        id: 1,
        ...data,
      });
      NotificationRepository.addRecipients.mockResolvedValue([1, 2]);

      const result = await NotificationService.createForBaristas(data);
      logReality(`Recipients count: ${result.recipients.length}`);

      expect(UserRepository.findByRole).toHaveBeenCalledWith(ROLES.BARISTA);
      expect(NotificationRepository.addRecipients).toHaveBeenCalledWith(1, [
        10, 11,
      ]);
    });

    it("NOT-SVC-002: Trả về null nếu không có Barista nào", async () => {
      logCase({
        tcid: "NOT-SVC-002",
        scenario: "Gửi thông báo khi list user rỗng",
        input: "any",
        expected: "null",
      });
      UserRepository.findByRole.mockResolvedValue([]);

      const result = await NotificationService.createForBaristas({});
      logReality(result === null ? "null" : "not null");
      expect(result).toBeNull();
    });
  });

  describe("markAsRead", () => {
    it("NOT-SVC-003: Đánh dấu thông báo đã đọc", async () => {
      logCase({
        tcid: "NOT-SVC-003",
        scenario: "Mark read notification",
        input: "id: 5",
        expected: "true",
      });
      NotificationRepository.markAsRead.mockResolvedValue(true);

      const result = await NotificationService.markAsRead(5, 10); // recipientId, userId
      logReality(result);
      expect(NotificationRepository.markAsRead).toHaveBeenCalledWith(5, 10);
    });
  });
});
