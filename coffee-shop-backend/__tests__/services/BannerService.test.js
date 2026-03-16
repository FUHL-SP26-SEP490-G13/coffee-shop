const BannerService = require("../../src/services/BannerService");
const bannerRepository = require("../../src/repositories/BannerRepository");

jest.mock("../../src/repositories/BannerRepository");

describe("BannerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getActive", () => {
    it("BannerService - GET_ACTIVE - TC-1: should return active banner successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerService - GET_ACTIVE - TC-1: Lấy banner active thành công"
      );
      console.log("=".repeat(50));

      const mockBanner = { id: 1, title: "Banner active" };
      bannerRepository.findActive.mockResolvedValue(mockBanner);

      const result = await BannerService.getActive();

      expect(bannerRepository.findActive).toHaveBeenCalled();
      expect(result).toEqual(mockBanner);
    });
  });

  describe("getAll", () => {
    it("BannerService - GET_ALL - TC-1: should return banner list successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerService - GET_ALL - TC-1: Lấy danh sách banner thành công"
      );
      console.log("=".repeat(50));

      const input = {
        page: 1,
        limit: 5,
        keyword: "sale",
        status: "active",
      };

      const mockResult = {
        data: [{ id: 1, title: "Banner sale" }],
        total: 1,
      };

      bannerRepository.findAll.mockResolvedValue(mockResult);

      const result = await BannerService.getAll(input);

      expect(bannerRepository.findAll).toHaveBeenCalledWith(input);
      expect(result).toEqual(mockResult);
    });
  });

  describe("validateDateRange", () => {
    it("BannerService - VALIDATE_DATE_RANGE - TC-1: should pass when end date is greater than start date", () => {
      expect(() =>
        BannerService.validateDateRange(
          "2025-01-01T00:00:00",
          "2025-01-02T00:00:00"
        )
      ).not.toThrow();
    });

    it("BannerService - VALIDATE_DATE_RANGE - TC-2: should pass when end date equals start date", () => {
      expect(() =>
        BannerService.validateDateRange(
          "2025-01-01T00:00:00",
          "2025-01-01T00:00:00"
        )
      ).not.toThrow();
    });

    it("BannerService - VALIDATE_DATE_RANGE - TC-3: should throw error when dates are invalid", () => {
      const expectedError = "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ";

      expect(() =>
        BannerService.validateDateRange("invalid-date", "2025-01-01T00:00:00")
      ).toThrow(expectedError);

      expect(() =>
        BannerService.validateDateRange("2025-01-01T00:00:00", "invalid-date")
      ).toThrow(expectedError);
    });

    it("BannerService - VALIDATE_DATE_RANGE - TC-4: should throw error when end date is before start date", () => {
      const expectedError = "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu";

      expect(() =>
        BannerService.validateDateRange(
          "2025-01-10T00:00:00",
          "2025-01-01T00:00:00"
        )
      ).toThrow(expectedError);
    });
  });

  describe("create", () => {
    it("BannerService - CREATE - TC-1: should create banner successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log("BannerService - CREATE - TC-1: Tạo banner thành công");
      console.log("=".repeat(50));

      const input = {
        title: "Banner mới",
        subtitle: "Mô tả banner hợp lệ",
        image_url: "banner.jpg",
        button_text: "Xem ngay",
        button_link: "/products",
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-01-10T00:00:00",
      };

      bannerRepository.findByTitle.mockResolvedValue(null);
      bannerRepository.create.mockResolvedValue(true);

      const result = await BannerService.create(input);

      expect(bannerRepository.findByTitle).toHaveBeenCalledWith("Banner mới");
      expect(bannerRepository.create).toHaveBeenCalledWith(input);
      expect(result).toBe(true);
    });

    it("BannerService - CREATE - TC-2: should throw error when title already exists", async () => {
      const input = {
        title: "Banner trùng",
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-01-10T00:00:00",
      };

      bannerRepository.findByTitle.mockResolvedValue({
        id: 1,
        title: "Banner trùng",
      });

      await expect(BannerService.create(input)).rejects.toThrow(
        "Tiêu đề quảng cáo đã tồn tại"
      );

      expect(bannerRepository.create).not.toHaveBeenCalled();
    });

    it("BannerService - CREATE - TC-3: should throw error when dates are invalid", async () => {
      const input = {
        title: "Banner mới",
        start_date: "invalid-date",
        end_date: "2025-01-10T00:00:00",
      };

      bannerRepository.findByTitle.mockResolvedValue(null);

      await expect(BannerService.create(input)).rejects.toThrow(
        "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ"
      );

      expect(bannerRepository.create).not.toHaveBeenCalled();
    });

    it("BannerService - CREATE - TC-4: should throw error when end date is before start date", async () => {
      const input = {
        title: "Banner mới",
        start_date: "2025-01-10T00:00:00",
        end_date: "2025-01-01T00:00:00",
      };

      bannerRepository.findByTitle.mockResolvedValue(null);

      await expect(BannerService.create(input)).rejects.toThrow(
        "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"
      );

      expect(bannerRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("BannerService - UPDATE - TC-1: should update banner successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log("BannerService - UPDATE - TC-1: Cập nhật banner thành công");
      console.log("=".repeat(50));

      const id = 1;
      const input = {
        title: "Banner cập nhật",
        subtitle: "Mô tả mới hợp lệ",
        image_url: "new-banner.jpg",
        button_text: "Mua ngay",
        button_link: "/shop",
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-01-10T00:00:00",
      };

      bannerRepository.findByTitleExcludeId.mockResolvedValue(null);
      bannerRepository.update.mockResolvedValue(true);

      const result = await BannerService.update(id, input);

      expect(bannerRepository.findByTitleExcludeId).toHaveBeenCalledWith(
        "Banner cập nhật",
        1
      );
      expect(bannerRepository.update).toHaveBeenCalledWith(1, input);
      expect(result).toBe(true);
    });

    it("BannerService - UPDATE - TC-2: should throw error when title already exists", async () => {
      const id = 1;
      const input = {
        title: "Banner trùng",
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-01-10T00:00:00",
      };

      bannerRepository.findByTitleExcludeId.mockResolvedValue({
        id: 2,
        title: "Banner trùng",
      });

      await expect(BannerService.update(id, input)).rejects.toThrow(
        "Tiêu đề quảng cáo đã tồn tại"
      );

      expect(bannerRepository.update).not.toHaveBeenCalled();
    });

    it("BannerService - UPDATE - TC-3: should throw error when dates are invalid", async () => {
      const id = 1;
      const input = {
        title: "Banner mới",
        start_date: "invalid",
        end_date: "2025-01-10T00:00:00",
      };

      bannerRepository.findByTitleExcludeId.mockResolvedValue(null);

      await expect(BannerService.update(id, input)).rejects.toThrow(
        "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ"
      );

      expect(bannerRepository.update).not.toHaveBeenCalled();
    });

    it("BannerService - UPDATE - TC-4: should throw error when end date is before start date", async () => {
      const id = 1;
      const input = {
        title: "Banner mới",
        start_date: "2025-01-10T00:00:00",
        end_date: "2025-01-01T00:00:00",
      };

      bannerRepository.findByTitleExcludeId.mockResolvedValue(null);

      await expect(BannerService.update(id, input)).rejects.toThrow(
        "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"
      );

      expect(bannerRepository.update).not.toHaveBeenCalled();
    });

    it("BannerService - UPDATE - TC-5: should propagate repository error when banner not found", async () => {
      const id = 999;
      const input = {
        title: "Banner mới",
        start_date: "2025-01-01T00:00:00",
        end_date: "2025-01-10T00:00:00",
      };

      bannerRepository.findByTitleExcludeId.mockResolvedValue(null);
      bannerRepository.update.mockRejectedValue(
        new Error("Không tìm thấy quảng cáo")
      );

      await expect(BannerService.update(id, input)).rejects.toThrow(
        "Không tìm thấy quảng cáo"
      );
    });
  });

  describe("delete", () => {
    it("BannerService - DELETE - TC-1: should delete banner successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log("BannerService - DELETE - TC-1: Xóa banner thành công");
      console.log("=".repeat(50));

      bannerRepository.delete.mockResolvedValue(true);

      const result = await BannerService.delete(1);

      expect(bannerRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe("getById", () => {
    it("BannerService - GET_BY_ID - TC-1: should get banner by id successfully", async () => {
      const mockBanner = { id: 1, title: "Banner 1" };
      bannerRepository.findById.mockResolvedValue(mockBanner);

      const result = await BannerService.getById(1);

      expect(bannerRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBanner);
    });
  });

  describe("getActiveList", () => {
    it("BannerService - GET_ACTIVE_LIST - TC-1: should get active banner list successfully", async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      bannerRepository.findActiveList.mockResolvedValue(mockList);

      const result = await BannerService.getActiveList();

      expect(bannerRepository.findActiveList).toHaveBeenCalled();
      expect(result).toEqual(mockList);
    });
  });
});
