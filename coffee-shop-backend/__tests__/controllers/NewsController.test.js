const NewsController = require("../../src/controllers/NewsController");
const NewsService = require("../../src/services/NewsService");
const response = require("../../src/utils/response");

// Mock dependencies
jest.mock("../../src/services/NewsService");
jest.mock("../../src/utils/response");

describe("NewsController", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {},
      query: {},
      body: {},
      file: null,
      user: { id: 1 },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
    response.success = jest.fn();
  });

  describe("create", () => {
    it("NewsController - CREATE - TC-1: should create news successfully with thumbnail", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - CREATE - TC-1: Tạo bài viết thành công với thumbnail"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        title: "Bài viết về cà phê mùa hè",
        summary: "Đây là phần tóm tắt đủ dài cho bài viết",
        content: "<p>Nội dung bài viết rất dài và hợp lệ...</p>",
        tag: "#coffee",
      };
      req.file = {
        path: "uploads/news/thumbnail-1.jpg",
      };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify(
          {
            body: req.body,
            file: req.file,
            user: req.user,
          },
          null,
          2
        )
      );

      // Arrange
      const mockNews = {
        id: 10,
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        tag: req.body.tag,
        thumbnail: req.file.path,
      };

      NewsService.createNews.mockResolvedValue(mockNews);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockNews, null, 2));

      // Act
      await NewsController.create(req, res, next);

      // OUTPUT REALITY
      console.log(
        "🎯 OUTPUT REALITY: response.success called with created news"
      );

      // Assert
      expect(NewsService.createNews).toHaveBeenCalledWith(
        {
          title: req.body.title,
          summary: req.body.summary,
          content: req.body.content,
          tag: req.body.tag,
          thumbnail: req.file.path,
        },
        1
      );
      expect(response.success).toHaveBeenCalledWith(
        res,
        mockNews,
        "Tạo tin thành công",
        201
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("NewsController - CREATE - TC-2: should create news successfully without thumbnail", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - CREATE - TC-2: Tạo bài viết thành công không có thumbnail"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        title: "Bài viết về latte art nâng cao",
        summary: "Đây là phần tóm tắt bài viết latte art",
        content: "<p>Nội dung bài viết latte art...</p>",
        tag: "#latte",
      };
      req.file = null;
      console.log(
        "\n📝 INPUT:",
        JSON.stringify(
          {
            body: req.body,
            file: req.file,
            user: req.user,
          },
          null,
          2
        )
      );

      // Arrange
      const mockNews = {
        id: 11,
        ...req.body,
        thumbnail: null,
      };

      NewsService.createNews.mockResolvedValue(mockNews);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockNews, null, 2));

      // Act
      await NewsController.create(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: response.success called with news");

      // Assert
      expect(NewsService.createNews).toHaveBeenCalledWith(
        {
          title: req.body.title,
          summary: req.body.summary,
          content: req.body.content,
          tag: req.body.tag,
          thumbnail: null,
        },
        1
      );
      expect(response.success).toHaveBeenCalledWith(
        res,
        mockNews,
        "Tạo tin thành công",
        201
      );
    });

    it("NewsController - CREATE - TC-3: should return validation error when title already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - CREATE - TC-3: Trả về lỗi khi tiêu đề bài viết đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        title: "Tiêu đề đã tồn tại",
        summary: "Tóm tắt hợp lệ",
        content: "<p>Nội dung hợp lệ...</p>",
        tag: "#coffee",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.body, null, 2));

      // Arrange
      const mockError = new Error("Tiêu đề bài viết đã tồn tại");
      NewsService.createNews.mockRejectedValue(mockError);

      const expectedResponse = {
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "title",
            message: "Tiêu đề bài viết đã tồn tại",
          },
        ],
      };

      // OUTPUT EXPECT
      console.log(
        "✅ OUTPUT EXPECT:",
        JSON.stringify(expectedResponse, null, 2)
      );

      // Act
      await NewsController.create(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: res.status(400).json(...) called");

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
      expect(next).not.toHaveBeenCalled();
      expect(response.success).not.toHaveBeenCalled();
    });

    it("NewsController - CREATE - TC-4: should call next for unexpected error", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - CREATE - TC-4: Xử lý lỗi hệ thống khi tạo bài viết"
      );
      console.log("=".repeat(50));

      // INPUT
      req.body = {
        title: "Bài viết test lỗi",
        summary: "Tóm tắt test lỗi",
        content: "<p>Nội dung test lỗi...</p>",
        tag: "#news",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.body, null, 2));

      // Arrange
      const mockError = new Error("Database connection failed");
      NewsService.createNews.mockRejectedValue(mockError);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: Error -", mockError.message);

      // Act
      await NewsController.create(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: next called with error");

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("NewsController - GET_ALL - TC-1: should get all published news with default query", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_ALL - TC-1: Lấy danh sách tin thành công với query mặc định"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = {};
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockNews = {
        items: [{ id: 1, title: "Tin 1" }],
        total: 1,
        page: 1,
        totalPages: 1,
      };
      NewsService.getAllPublished.mockResolvedValue(mockNews);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockNews, null, 2));

      // Act
      await NewsController.getAll(req, res, next);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: response.success called");

      // Assert
      expect(NewsService.getAllPublished).toHaveBeenCalledWith({
        page: 1,
        limit: 6,
      });
      expect(response.success).toHaveBeenCalledWith(
        res,
        mockNews,
        "Lấy tin thành công"
      );
    });

    it("NewsController - GET_ALL - TC-2: should get all published news with custom page and limit", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_ALL - TC-2: Lấy danh sách tin thành công với page và limit custom"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = { page: "2", limit: "4" };
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockNews = {
        items: [{ id: 2, title: "Tin 2" }],
        total: 10,
        page: 2,
        totalPages: 3,
      };
      NewsService.getAllPublished.mockResolvedValue(mockNews);

      // Act
      await NewsController.getAll(req, res, next);

      // Assert
      expect(NewsService.getAllPublished).toHaveBeenCalledWith({
        page: 2,
        limit: 4,
      });
      expect(response.success).toHaveBeenCalledWith(
        res,
        mockNews,
        "Lấy tin thành công"
      );
    });

    it("NewsController - GET_ALL - TC-3: should call next when service throws error", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_ALL - TC-3: Xử lý lỗi khi lấy danh sách tin"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = { page: "1", limit: "6" };
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockError = new Error("Database error");
      NewsService.getAllPublished.mockRejectedValue(mockError);

      // Act
      await NewsController.getAll(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
      expect(response.success).not.toHaveBeenCalled();
    });
  });

  describe("getDetail", () => {
    it("NewsController - GET_DETAIL - TC-1: should get news detail by slug successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_DETAIL - TC-1: Lấy chi tiết bài viết thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { slug: "bai-viet-ca-phe" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      const mockNews = {
        id: 1,
        slug: "bai-viet-ca-phe",
        title: "Bài viết cà phê",
      };
      NewsService.getDetailBySlug.mockResolvedValue(mockNews);

      // Act
      await NewsController.getDetail(req, res, next);

      // Assert
      expect(NewsService.getDetailBySlug).toHaveBeenCalledWith(
        "bai-viet-ca-phe"
      );
      expect(response.success).toHaveBeenCalledWith(
        res,
        mockNews,
        "Lấy chi tiết thành công"
      );
    });

    it("NewsController - GET_DETAIL - TC-2: should call next when news not found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_DETAIL - TC-2: Xử lý lỗi khi không tìm thấy bài viết"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { slug: "not-found" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      const mockError = new Error("Tin không tồn tại");
      NewsService.getDetailBySlug.mockRejectedValue(mockError);

      // Act
      await NewsController.getDetail(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getFeatured", () => {
    it("NewsController - GET_FEATURED - TC-1: should get featured news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_FEATURED - TC-1: Lấy tin nổi bật thành công"
      );
      console.log("=".repeat(50));

      // Arrange
      const mockNews = [
        { id: 1, title: "Tin nổi bật 1" },
        { id: 2, title: "Tin nổi bật 2" },
        { id: 3, title: "Tin nổi bật 3" },
      ];
      NewsService.getFeatured.mockResolvedValue(mockNews);

      // Act
      await NewsController.getFeatured(req, res, next);

      // Assert
      expect(NewsService.getFeatured).toHaveBeenCalledWith(3);
      expect(response.success).toHaveBeenCalledWith(res, mockNews);
    });

    it("NewsController - GET_FEATURED - TC-2: should call next when service throws error", async () => {
      // Arrange
      const mockError = new Error("Database error");
      NewsService.getFeatured.mockRejectedValue(mockError);

      // Act
      await NewsController.getFeatured(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("delete", () => {
    it("NewsController - DELETE - TC-1: should delete news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log("NewsController - DELETE - TC-1: Xóa bài viết thành công");
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      NewsService.deleteNews.mockResolvedValue(true);

      // Act
      await NewsController.delete(req, res, next);

      // Assert
      expect(NewsService.deleteNews).toHaveBeenCalledWith("1");
      expect(response.success).toHaveBeenCalledWith(res, null, "Đã xóa");
    });

    it("NewsController - DELETE - TC-2: should call next when delete fails", async () => {
      const mockError = new Error("Không tìm thấy bài viết");
      req.params = { id: "999" };
      NewsService.deleteNews.mockRejectedValue(mockError);

      await NewsController.delete(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getAllAdmin", () => {
    it("NewsController - GET_ALL_ADMIN - TC-1: should get all admin news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_ALL_ADMIN - TC-1: Lấy danh sách tin admin thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = {
        page: "2",
        limit: "10",
        keyword: "coffee",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockNews = {
        items: [{ id: 1, title: "Coffee news" }],
        total: 11,
        page: 2,
        totalPages: 2,
      };
      NewsService.getAllAdmin.mockResolvedValue(mockNews);

      // Act
      await NewsController.getAllAdmin(req, res, next);

      // Assert
      expect(NewsService.getAllAdmin).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        keyword: "coffee",
      });
      expect(response.success).toHaveBeenCalledWith(res, mockNews);
    });

    it("NewsController - GET_ALL_ADMIN - TC-2: should use default query values", async () => {
      req.query = {};
      const mockNews = { items: [], total: 0, page: 1, totalPages: 0 };
      NewsService.getAllAdmin.mockResolvedValue(mockNews);

      await NewsController.getAllAdmin(req, res, next);

      expect(NewsService.getAllAdmin).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        keyword: "",
      });
      expect(response.success).toHaveBeenCalledWith(res, mockNews);
    });
  });

  describe("getById", () => {
    it("NewsController - GET_BY_ID - TC-1: should get news by id successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_BY_ID - TC-1: Lấy bài viết theo id thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "5" };
      console.log("\n📝 INPUT:", JSON.stringify(req.params, null, 2));

      // Arrange
      const mockNews = { id: 5, title: "Tin admin" };
      NewsService.getById.mockResolvedValue(mockNews);

      // Act
      await NewsController.getById(req, res, next);

      // Assert
      expect(NewsService.getById).toHaveBeenCalledWith("5");
      expect(response.success).toHaveBeenCalledWith(res, mockNews);
    });

    it("NewsController - GET_BY_ID - TC-2: should call next when service throws error", async () => {
      req.params = { id: "999" };
      const mockError = new Error("Không tìm thấy bài viết");
      NewsService.getById.mockRejectedValue(mockError);

      await NewsController.getById(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("update", () => {
    it("NewsController - UPDATE - TC-1: should update news successfully with thumbnail", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - UPDATE - TC-1: Cập nhật bài viết thành công với thumbnail mới"
      );
      console.log("=".repeat(50));

      // INPUT
      req.params = { id: "1" };
      req.body = {
        title: "Bài viết cập nhật",
        summary: "Tóm tắt cập nhật",
        content: "<p>Nội dung cập nhật...</p>",
        tag: "#update",
      };
      req.file = { path: "uploads/news/new-thumb.jpg" };
      console.log(
        "\n📝 INPUT:",
        JSON.stringify(
          {
            params: req.params,
            body: req.body,
            file: req.file,
          },
          null,
          2
        )
      );

      // Arrange
      NewsService.updateNews.mockResolvedValue(true);

      // Act
      await NewsController.update(req, res, next);

      // Assert
      expect(NewsService.updateNews).toHaveBeenCalledWith("1", {
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        tag: req.body.tag,
        thumbnail: req.file.path,
      });
      expect(response.success).toHaveBeenCalledWith(
        res,
        null,
        "Cập nhật thành công"
      );
    });

    it("NewsController - UPDATE - TC-2: should update news successfully without new thumbnail", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Bài viết cập nhật",
        summary: "Tóm tắt cập nhật",
        content: "<p>Nội dung cập nhật...</p>",
        tag: "#update",
      };
      req.file = null;
      NewsService.updateNews.mockResolvedValue(true);

      await NewsController.update(req, res, next);

      expect(NewsService.updateNews).toHaveBeenCalledWith("1", {
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        tag: req.body.tag,
        thumbnail: undefined,
      });
      expect(response.success).toHaveBeenCalledWith(
        res,
        null,
        "Cập nhật thành công"
      );
    });

    it("NewsController - UPDATE - TC-3: should return validation error when title already exists", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Tiêu đề trùng",
        summary: "Summary",
        content: "<p>Content</p>",
        tag: "#tag",
      };

      const mockError = new Error("Tiêu đề bài viết đã tồn tại");
      NewsService.updateNews.mockRejectedValue(mockError);

      await NewsController.update(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: [
          {
            field: "title",
            message: "Tiêu đề bài viết đã tồn tại",
          },
        ],
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("NewsController - UPDATE - TC-4: should call next for unexpected error", async () => {
      req.params = { id: "1" };
      req.body = {
        title: "Title",
        summary: "Summary",
        content: "<p>Content</p>",
        tag: "#tag",
      };

      const mockError = new Error("Database failed");
      NewsService.updateNews.mockRejectedValue(mockError);

      await NewsController.update(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getRelated", () => {
    it("NewsController - GET_RELATED - TC-1: should get related news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsController - GET_RELATED - TC-1: Lấy tin liên quan thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      req.query = {
        tag: "#coffee",
        excludeId: "1",
      };
      console.log("\n📝 INPUT:", JSON.stringify(req.query, null, 2));

      // Arrange
      const mockNews = [
        { id: 2, title: "Tin liên quan 1" },
        { id: 3, title: "Tin liên quan 2" },
      ];
      NewsService.getRelated.mockResolvedValue(mockNews);

      // Act
      await NewsController.getRelated(req, res, next);

      // Assert
      expect(NewsService.getRelated).toHaveBeenCalledWith("#coffee", "1");
      expect(response.success).toHaveBeenCalledWith(res, mockNews);
    });

    it("NewsController - GET_RELATED - TC-2: should call next when service throws error", async () => {
      req.query = { tag: "#coffee", excludeId: "1" };
      const mockError = new Error("Database error");
      NewsService.getRelated.mockRejectedValue(mockError);

      await NewsController.getRelated(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
