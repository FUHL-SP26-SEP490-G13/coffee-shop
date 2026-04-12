const NewsService = require("../../src/services/NewsService");
const NewsRepository = require("../../src/repositories/NewsRepository");

jest.mock("../../src/repositories/NewsRepository");
jest.mock("slugify", () =>
  jest.fn((title) => title.toLowerCase().replace(/\s+/g, "-"))
);

describe("NewsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateUniqueSlug", () => {
    it("NewsService - generateUniqueSlug - TC-01: should generate base slug when slug does not exist", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GENERATE_UNIQUE_SLUG - TC-1: Tạo slug cơ bản khi chưa tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { title: "Bài viết mới" };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findBySlug.mockResolvedValue(null);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: bai-viet-moi");

      // Act
      const result = await NewsService.generateUniqueSlug(input.title);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(NewsRepository.findBySlug).toHaveBeenCalledWith("bài-viết-mới");
      expect(result).toBe("bài-viết-mới");
    });

    it("NewsService - generateUniqueSlug - TC-02: should append number when slug already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GENERATE_UNIQUE_SLUG - TC-2: Tạo slug duy nhất khi slug đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { title: "Tin Hot" };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findBySlug
        .mockResolvedValueOnce({ id: 1, slug: "tin-hot" })
        .mockResolvedValueOnce({ id: 2, slug: "tin-hot-1" })
        .mockResolvedValueOnce(null);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: tin-hot-2");

      // Act
      const result = await NewsService.generateUniqueSlug(input.title);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(NewsRepository.findBySlug).toHaveBeenNthCalledWith(1, "tin-hot");
      expect(NewsRepository.findBySlug).toHaveBeenNthCalledWith(2, "tin-hot-1");
      expect(NewsRepository.findBySlug).toHaveBeenNthCalledWith(3, "tin-hot-2");
      expect(result).toBe("tin-hot-2");
    });
  });

  describe("getAllPublished", () => {
    it("NewsService - getAllPublished - TC-01: should get published news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_ALL_PUBLISHED - TC-1: Lấy danh sách tin published thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { page: 2, limit: 6 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockItems = [{ id: 1, title: "Tin 1" }];
      NewsRepository.findPublishedPaginated.mockResolvedValue(mockItems);
      NewsRepository.countAll.mockResolvedValue(13);

      // OUTPUT EXPECT
      const expectedOutput = {
        items: mockItems,
        total: 13,
        page: 2,
        totalPages: 3,
      };
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await NewsService.getAllPublished(input);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findPublishedPaginated).toHaveBeenCalledWith(6, 6);
      expect(NewsRepository.countAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedOutput);
    });
  });

  describe("getDetailBySlug", () => {
    it("NewsService - getDetailBySlug - TC-01: should get detail and increase view successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_DETAIL_BY_SLUG - TC-1: Lấy chi tiết bài viết và tăng lượt xem thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { slug: "bai-viet-ca-phe" };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockNews = {
        id: 1,
        slug: "bai-viet-ca-phe",
        title: "Bài viết cà phê",
      };
      NewsRepository.findBySlug.mockResolvedValue(mockNews);
      NewsRepository.increaseView.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockNews, null, 2));

      // Act
      const result = await NewsService.getDetailBySlug(input.slug);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findBySlug).toHaveBeenCalledWith("bai-viet-ca-phe");
      expect(NewsRepository.increaseView).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockNews);
    });

    it("NewsService - getDetailBySlug - TC-02: should throw error when news does not exist", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_DETAIL_BY_SLUG - TC-2: Lỗi khi tin không tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { slug: "not-found" };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findBySlug.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = "Tin không tồn tại";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(NewsService.getDetailBySlug(input.slug)).rejects.toThrow(
        expectedError
      );

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(NewsRepository.increaseView).not.toHaveBeenCalled();
    });
  });

  describe("getFeatured", () => {
    it("NewsService - getFeatured - TC-01: should get featured news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_FEATURED - TC-1: Lấy tin nổi bật thành công"
      );
      console.log("=".repeat(50));

      // Arrange
      const mockNews = [{ id: 1 }, { id: 2 }, { id: 3 }];
      NewsRepository.findFeatured.mockResolvedValue(mockNews);

      const result = await NewsService.getFeatured(3);

      expect(NewsRepository.findFeatured).toHaveBeenCalledWith(3);
      expect(result).toEqual(mockNews);
    });
  });

  describe("createNews", () => {
    it("NewsService - createNews - TC-01: should create news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log("NewsService - CREATE_NEWS - TC-1: Tạo bài viết thành công");
      console.log("=".repeat(50));

      // INPUT
      const input = {
        data: {
          title: "Bài viết mới về cà phê",
          summary: "Tóm tắt bài viết mới",
          content: "<p>Nội dung bài viết mới...</p>",
          tag: "#coffee",
          thumbnail: "uploads/news/thumb.jpg",
        },
        userId: 1,
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findByTitle.mockResolvedValue(null);
      NewsRepository.findBySlug.mockResolvedValue(null);
      const createdNews = {
        id: 10,
        ...input.data,
        slug: "bài-viết-mới-về-cà-phê",
        created_by: 1,
      };
      NewsRepository.create.mockResolvedValue(createdNews);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(createdNews, null, 2));

      // Act
      const result = await NewsService.createNews(input.data, input.userId);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findByTitle).toHaveBeenCalledWith(input.data.title);
      expect(NewsRepository.create).toHaveBeenCalledWith({
        ...input.data,
        slug: "bài-viết-mới-về-cà-phê",
        created_by: 1,
      });
      expect(result).toEqual(createdNews);
    });

    it("NewsService - createNews - TC-02: should throw error when title already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - CREATE_NEWS - TC-2: Lỗi khi tiêu đề bài viết đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        title: "Bài viết trùng tiêu đề",
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findByTitle.mockResolvedValue({
        id: 1,
        title: input.title,
      });

      // OUTPUT EXPECT
      const expectedError = "Tiêu đề bài viết đã tồn tại";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(
        NewsService.createNews(
          {
            title: input.title,
            summary: "summary",
            content: "content",
            tag: "#tag",
            thumbnail: null,
          },
          1
        )
      ).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(NewsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getAllAdmin", () => {
    it("NewsService - getAllAdmin - TC-01: should get all admin news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_ALL_ADMIN - TC-1: Lấy danh sách tin admin thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { page: 2, limit: 10, keyword: "coffee" };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockItems = [{ id: 1, title: "Coffee News" }];
      NewsRepository.findAllAdminPaginated.mockResolvedValue(mockItems);
      NewsRepository.countAll.mockResolvedValue(13);

      // OUTPUT EXPECT
      const expectedOutput = {
        items: mockItems,
        total: 13,
        page: 2,
        totalPages: 2,
      };
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(expectedOutput, null, 2));

      // Act
      const result = await NewsService.getAllAdmin(input);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findAllAdminPaginated).toHaveBeenCalledWith(
        10,
        10,
        "coffee"
      );
      expect(NewsRepository.countAll).toHaveBeenCalledWith("coffee");
      expect(result).toEqual(expectedOutput);
    });
  });

  describe("deleteNews", () => {
    it("NewsService - deleteNews - TC-01: should delete news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log("NewsService - DELETE_NEWS - TC-1: Xóa bài viết thành công");
      console.log("=".repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockResult = { affectedRows: 1 };
      NewsRepository.deleteById.mockResolvedValue(mockResult);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockResult, null, 2));

      // Act
      const result = await NewsService.deleteNews(input.id);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.deleteById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe("updateNews", () => {
    it("NewsService - updateNews - TC-01: should update news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - UPDATE_NEWS - TC-1: Cập nhật bài viết thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        data: {
          title: "Tiêu đề mới",
          summary: "Tóm tắt mới",
          content: "<p>Nội dung mới...</p>",
          tag: "#new",
          thumbnail: "uploads/news/new-thumb.jpg",
        },
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findByTitleExcludeId.mockResolvedValue(null);
      NewsRepository.updateById.mockResolvedValue(true);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: true");

      // Act
      const result = await NewsService.updateNews(input.id, input.data);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", result);

      // Assert
      expect(NewsRepository.findByTitleExcludeId).toHaveBeenCalledWith(
        "Tiêu đề mới",
        1
      );
      expect(NewsRepository.updateById).toHaveBeenCalledWith(1, input.data);
      expect(result).toBe(true);
    });

    it("NewsService - updateNews - TC-02: should throw error when title already exists", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - UPDATE_NEWS - TC-2: Lỗi khi tiêu đề bài viết đã tồn tại"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = {
        id: 1,
        title: "Tiêu đề trùng",
      };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findByTitleExcludeId.mockResolvedValue({
        id: 99,
        title: input.title,
      });

      // OUTPUT EXPECT
      const expectedError = "Tiêu đề bài viết đã tồn tại";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(
        NewsService.updateNews(1, {
          title: "Tiêu đề trùng",
          summary: "summary",
          content: "content",
          tag: "#tag",
          thumbnail: undefined,
        })
      ).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);

      expect(NewsRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("NewsService - getById - TC-01: should get news by id successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_BY_ID - TC-1: Lấy bài viết theo id thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { id: 1 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockNews = { id: 1, title: "Tin 1" };
      NewsRepository.findOne.mockResolvedValue(mockNews);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockNews, null, 2));

      // Act
      const result = await NewsService.getById(1);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockNews);
    });

    it("NewsService - getById - TC-02: should throw error when news not found", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_BY_ID - TC-2: Lỗi khi không tìm thấy bài viết"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { id: 999 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      NewsRepository.findOne.mockResolvedValue(null);

      // OUTPUT EXPECT
      const expectedError = "Không tìm thấy bài viết";
      console.log("✅ OUTPUT EXPECT: Error -", expectedError);

      // Act & Assert
      await expect(NewsService.getById(999)).rejects.toThrow(expectedError);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY: throw error -", expectedError);
    });
  });

  describe("getRelated", () => {
    it("NewsService - getRelated - TC-01: should return empty array when tag is missing", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_RELATED - TC-1: Trả về mảng rỗng khi không có tag"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { tag: "", excludeId: 1 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT: []");

      // Act
      const result = await NewsService.getRelated(input.tag, input.excludeId);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result));

      // Assert
      expect(result).toEqual([]);
      expect(NewsRepository.findRelatedByTag).not.toHaveBeenCalled();
    });

    it("NewsService - getRelated - TC-02: should get related news successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "NewsService - GET_RELATED - TC-2: Lấy tin liên quan thành công"
      );
      console.log("=".repeat(50));

      // INPUT
      const input = { tag: "#coffee", excludeId: 1 };
      console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));

      // Arrange
      const mockNews = [{ id: 2 }, { id: 3 }];
      NewsRepository.findRelatedByTag.mockResolvedValue(mockNews);

      // OUTPUT EXPECT
      console.log("✅ OUTPUT EXPECT:", JSON.stringify(mockNews, null, 2));

      // Act
      const result = await NewsService.getRelated(input.tag, input.excludeId);

      // OUTPUT REALITY
      console.log("🎯 OUTPUT REALITY:", JSON.stringify(result, null, 2));

      // Assert
      expect(NewsRepository.findRelatedByTag).toHaveBeenCalledWith(
        "#coffee",
        1,
        3
      );
      expect(result).toEqual(mockNews);
    });
  });
});
