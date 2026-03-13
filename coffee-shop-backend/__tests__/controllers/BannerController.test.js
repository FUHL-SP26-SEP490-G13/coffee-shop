const BannerController = require("../../src/controllers/BannerController");
const bannerService = require("../../src/services/BannerService");

jest.mock("../../src/services/BannerService");

describe("BannerController", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      query: {},
      body: {},
      file: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("getActive", () => {
    it("BannerController - GET_ACTIVE - TC-1: should get active banner successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerController - GET_ACTIVE - TC-1: Lấy banner active thành công"
      );
      console.log("=".repeat(50));

      const mockData = {
        id: 1,
        title: "Banner active",
        image_url: "banner.jpg",
      };

      bannerService.getActive.mockResolvedValue(mockData);

      console.log("\n📝 INPUT: {}");
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify({ success: true, data: mockData }, null, 2)
      );

      await BannerController.getActive(req, res, next);

      console.log("🎯 OUTPUT REALITY: res.json called with active banner");

      expect(bannerService.getActive).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - GET_ACTIVE - TC-2: should call next when service throws error", async () => {
      const mockError = new Error("Database failed");
      bannerService.getActive.mockRejectedValue(mockError);

      await BannerController.getActive(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getAll", () => {
    it("BannerController - GET_ALL - TC-1: should get all banners successfully with default query", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerController - GET_ALL - TC-1: Lấy danh sách banner thành công với query mặc định"
      );
      console.log("=".repeat(50));

      req.query = {};
      const mockResult = {
        data: [{ id: 1, title: "Banner 1" }],
        total: 1,
      };

      bannerService.getAll.mockResolvedValue(mockResult);

      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify({ success: true, ...mockResult }, null, 2)
      );

      await BannerController.getAll(req, res, next);

      console.log("🎯 OUTPUT REALITY: res.json called with banner list");

      expect(bannerService.getAll).toHaveBeenCalledWith({
        page: 1,
        limit: 5,
        keyword: "",
        status: "",
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - GET_ALL - TC-2: should get all banners successfully with filters", async () => {
      req.query = {
        page: "2",
        limit: "10",
        keyword: "sale",
        status: "active",
      };

      const mockResult = {
        data: [{ id: 2, title: "Sale banner" }],
        total: 12,
      };

      bannerService.getAll.mockResolvedValue(mockResult);

      await BannerController.getAll(req, res, next);

      expect(bannerService.getAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        keyword: "sale",
        status: "active",
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it("BannerController - GET_ALL - TC-3: should call next when service throws error", async () => {
      const mockError = new Error("Database failed");
      bannerService.getAll.mockRejectedValue(mockError);

      await BannerController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("create", () => {
    it("BannerController - CREATE - TC-1: should create banner successfully with uploaded file", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerController - CREATE - TC-1: Tạo banner thành công với file upload"
      );
      console.log("=".repeat(50));

      req.body = {
        title: "Banner mới",
        subtitle: "Mô tả banner hợp lệ",
        button_text: "Xem ngay",
        button_link: "/products",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
        type: "banner",
      };
      req.file = {
        path: "uploads/banner-1.jpg",
      };

      bannerService.create.mockResolvedValue(true);

      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ body: req.body, file: req.file }, null, 2)
      );
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(
          {
            success: true,
            message: "Tạo quảng cáo thành công",
          },
          null,
          2
        )
      );

      await BannerController.create(req, res, next);

      console.log("🎯 OUTPUT REALITY: res.json called with success message");

      expect(bannerService.create).toHaveBeenCalledWith({
        ...req.body,
        image_url: "uploads/banner-1.jpg",
        start_date: req.body.start_date,
        end_date: req.body.end_date,
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Tạo quảng cáo thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - CREATE - TC-2: should create banner successfully with image_url from body", async () => {
      req.body = {
        title: "Banner mới",
        subtitle: "Mô tả banner hợp lệ",
        button_text: "Xem ngay",
        button_link: "/products",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
        type: "banner",
        image_url: "https://example.com/banner.jpg",
      };
      req.file = null;

      bannerService.create.mockResolvedValue(true);

      await BannerController.create(req, res, next);

      expect(bannerService.create).toHaveBeenCalledWith({
        ...req.body,
        image_url: "https://example.com/banner.jpg",
        start_date: req.body.start_date,
        end_date: req.body.end_date,
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Tạo quảng cáo thành công",
      });
    });

    it("BannerController - CREATE - TC-3: should return 400 when image is missing", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerController - CREATE - TC-3: Trả về lỗi khi thiếu ảnh quảng cáo"
      );
      console.log("=".repeat(50));

      req.body = {
        title: "Banner mới",
        subtitle: "Mô tả banner hợp lệ",
      };
      req.file = null;

      console.log(
        "\n📝 INPUT:",
        JSON.stringify({ body: req.body, file: req.file }, null, 2)
      );

      await BannerController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "image",
            message: "Ảnh quảng cáo là bắt buộc",
          },
        ],
      });
      expect(bannerService.create).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - CREATE - TC-4: should return 400 when title already exists", async () => {
      req.body = {
        title: "Banner trùng",
        subtitle: "Mô tả banner hợp lệ",
        button_text: "Xem ngay",
        button_link: "/products",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
        image_url: "banner.jpg",
      };

      const mockError = new Error("Tiêu đề quảng cáo đã tồn tại");
      bannerService.create.mockRejectedValue(mockError);

      await BannerController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "title",
            message: "Tiêu đề quảng cáo đã tồn tại",
          },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - CREATE - TC-5: should return 400 when end date is before start date", async () => {
      req.body = {
        title: "Banner mới",
        subtitle: "Mô tả banner hợp lệ",
        button_text: "Xem ngay",
        button_link: "/products",
        start_date: "2025-01-10T00:00",
        end_date: "2025-01-01T00:00",
        image_url: "banner.jpg",
      };

      const mockError = new Error(
        "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"
      );
      bannerService.create.mockRejectedValue(mockError);

      await BannerController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "end_date",
            message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
          },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - CREATE - TC-6: should return 400 when dates are invalid", async () => {
      req.body = {
        title: "Banner mới",
        subtitle: "Mô tả banner hợp lệ",
        button_text: "Xem ngay",
        button_link: "/products",
        start_date: "invalid-date",
        end_date: "invalid-date",
        image_url: "banner.jpg",
      };

      const mockError = new Error(
        "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ"
      );
      bannerService.create.mockRejectedValue(mockError);

      await BannerController.create(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "start_date",
            message: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ",
          },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - CREATE - TC-7: should call next for unexpected error", async () => {
      req.body = {
        title: "Banner mới",
        subtitle: "Mô tả banner hợp lệ",
        button_text: "Xem ngay",
        button_link: "/products",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
        image_url: "banner.jpg",
      };

      const mockError = new Error("Database failed");
      bannerService.create.mockRejectedValue(mockError);

      await BannerController.create(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("update", () => {
    it("BannerController - UPDATE - TC-1: should update banner successfully without file", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerController - UPDATE - TC-1: Cập nhật banner thành công không thay ảnh"
      );
      console.log("=".repeat(50));

      req.params = { id: "1" };
      req.body = {
        title: "Banner cập nhật",
        subtitle: "Mô tả cập nhật hợp lệ",
        button_text: "Mua ngay",
        button_link: "/shop",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
        type: "banner",
      };

      bannerService.update.mockResolvedValue(true);

      await BannerController.update(req, res, next);

      expect(bannerService.update).toHaveBeenCalledWith("1", {
        title: "Banner cập nhật",
        subtitle: "Mô tả cập nhật hợp lệ",
        button_text: "Mua ngay",
        button_link: "/shop",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Cập nhật thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - UPDATE - TC-2: should update banner successfully with file", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Banner cập nhật",
        subtitle: "Mô tả cập nhật hợp lệ",
        button_text: "Mua ngay",
        button_link: "/shop",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
        type: "banner",
      };
      req.file = { path: "uploads/new-banner.jpg" };

      bannerService.update.mockResolvedValue(true);

      await BannerController.update(req, res, next);

      expect(bannerService.update).toHaveBeenCalledWith("1", {
        title: "Banner cập nhật",
        subtitle: "Mô tả cập nhật hợp lệ",
        button_text: "Mua ngay",
        button_link: "/shop",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
        image_url: "uploads/new-banner.jpg",
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Cập nhật thành công",
      });
    });

    it("BannerController - UPDATE - TC-3: should return 400 when title already exists", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Banner trùng",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
      };

      const mockError = new Error("Tiêu đề quảng cáo đã tồn tại");
      bannerService.update.mockRejectedValue(mockError);

      await BannerController.update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "title",
            message: "Tiêu đề quảng cáo đã tồn tại",
          },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - UPDATE - TC-4: should return 404 when banner not found", async () => {
      req.params = { id: "999" };
      req.body = {
        title: "Banner mới",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
      };

      const mockError = new Error("Không tìm thấy quảng cáo");
      bannerService.update.mockRejectedValue(mockError);

      await BannerController.update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Không tìm thấy quảng cáo",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - UPDATE - TC-5: should return 400 when end date is before start date", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Banner mới",
        start_date: "2025-01-10T00:00",
        end_date: "2025-01-01T00:00",
      };

      const mockError = new Error(
        "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu"
      );
      bannerService.update.mockRejectedValue(mockError);

      await BannerController.update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "end_date",
            message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
          },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - UPDATE - TC-6: should return 400 when dates are invalid", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Banner mới",
        start_date: "invalid",
        end_date: "invalid",
      };

      const mockError = new Error(
        "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ"
      );
      bannerService.update.mockRejectedValue(mockError);

      await BannerController.update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "start_date",
            message: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ",
          },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - UPDATE - TC-7: should call next for unexpected error", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Banner mới",
        start_date: "2025-01-01T00:00",
        end_date: "2025-01-10T00:00",
      };

      const mockError = new Error("Database failed");
      bannerService.update.mockRejectedValue(mockError);

      await BannerController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("delete", () => {
    it("BannerController - DELETE - TC-1: should delete banner successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log("BannerController - DELETE - TC-1: Xóa banner thành công");
      console.log("=".repeat(50));

      req.params = { id: "1" };
      bannerService.delete.mockResolvedValue(true);

      await BannerController.delete(req, res, next);

      expect(bannerService.delete).toHaveBeenCalledWith("1");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Xóa quảng cáo thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - DELETE - TC-2: should call next when service throws error", async () => {
      req.params = { id: "1" };
      const mockError = new Error("Database failed");
      bannerService.delete.mockRejectedValue(mockError);

      await BannerController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getActiveList", () => {
    it("BannerController - GET_ACTIVE_LIST - TC-1: should get active banner list successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "BannerController - GET_ACTIVE_LIST - TC-1: Lấy danh sách banner active thành công"
      );
      console.log("=".repeat(50));

      const mockData = [
        { id: 1, title: "Banner 1" },
        { id: 2, title: "Banner 2" },
      ];

      bannerService.getActiveList.mockResolvedValue(mockData);

      await BannerController.getActiveList(req, res, next);

      expect(bannerService.getActiveList).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("BannerController - GET_ACTIVE_LIST - TC-2: should call next when service throws error", async () => {
      const mockError = new Error("Database failed");
      bannerService.getActiveList.mockRejectedValue(mockError);

      await BannerController.getActiveList(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
