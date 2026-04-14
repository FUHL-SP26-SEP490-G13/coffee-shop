const NewsService = require("../../src/services/NewsService");
const NewsRepository = require("../../src/repositories/NewsRepository");

const { logTestCase } = require("../utils/logger");

jest.mock("../../src/repositories/NewsRepository");

let pendingLogCase = null;

const logCase = (payload = {}) => {
  pendingLogCase = payload;
};

const logReality = (actual) => {
  const payload = pendingLogCase || {};
  const {
    title,
    method,
    tcid,
    crud,
    scenario,
    input,
    expected,
    outputExpect,
    reality,
  } = payload;

  const nameParts = [title, method, scenario, tcid].filter(Boolean);
  if (crud) nameParts.push(`CRUD: ${crud}`);

  logTestCase({
    name: nameParts.join(" - ") || "Test case",
    input,
    expected: expected !== undefined ? expected : outputExpect,
    actual: actual !== undefined ? actual : reality,
  });

  pendingLogCase = null;
};

describe("NewsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateUniqueSlug", () => {
    it("NewsService - generateUniqueSlug - TC-01: should generate base slug when slug does not exist", async () => {
      const input = { title: "Bài viết mới" };

      NewsRepository.findBySlug.mockResolvedValue(null);

      logCase({
        method: "generateUniqueSlug",
        tcid: "TC-01",
        crud: "TRANSFORM",
        input,
        outputExpect: "Slug cơ bản được tạo khi chưa trùng",
      });

      const result = await NewsService.generateUniqueSlug(input.title);
      logReality(result);

      expect(NewsRepository.findBySlug).toHaveBeenCalledWith("bai-viet-moi");
      expect(result).toBe("bai-viet-moi");
    });

    it("NewsService - generateUniqueSlug - TC-02: should append number when slug already exists", async () => {
      const input = { title: "Tin Hot" };

      NewsRepository.findBySlug
        .mockResolvedValueOnce({ id: 1, slug: "tin-hot" })
        .mockResolvedValueOnce({ id: 2, slug: "tin-hot-1" })
        .mockResolvedValueOnce(null);

      logCase({
        method: "generateUniqueSlug",
        tcid: "TC-02",
        crud: "TRANSFORM",
        input,
        expected: "tin-hot-2",
      });

      const result = await NewsService.generateUniqueSlug(input.title);
      logReality(result);

      expect(NewsRepository.findBySlug).toHaveBeenNthCalledWith(1, "tin-hot");
      expect(NewsRepository.findBySlug).toHaveBeenNthCalledWith(2, "tin-hot-1");
      expect(NewsRepository.findBySlug).toHaveBeenNthCalledWith(3, "tin-hot-2");
      expect(result).toBe("tin-hot-2");
    });

    it("NewsService - generateUniqueSlug - TC-03: should return empty slug when title contains only spaces", async () => {
      const input = { title: "     " };

      NewsRepository.findBySlug.mockResolvedValue(null);

      logCase({
        method: "generateUniqueSlug",
        tcid: "TC-03",
        crud: "TRANSFORM",
        input,
        expected: "",
      });

      const result = await NewsService.generateUniqueSlug(input.title);
      logReality(result);

      expect(NewsRepository.findBySlug).toHaveBeenCalledWith("");
      expect(result).toBe("");
    });
  });

  describe("getAllPublished", () => {
    it("NewsService - getAllPublished - TC-01: should get published news successfully", async () => {
      const input = { page: 2, limit: 6 };
      const mockItems = [{ id: 1, title: "Tin 1" }];

      NewsRepository.findPublishedPaginated.mockResolvedValue(mockItems);
      NewsRepository.countAll.mockResolvedValue(13);

      const expectedOutput = {
        items: mockItems,
        total: 13,
        page: 2,
        totalPages: 3,
      };

      logCase({
        method: "getAllPublished",
        tcid: "TC-01",
        crud: "READ",
        input,
        expected: expectedOutput,
      });

      const result = await NewsService.getAllPublished(input);
      logReality(result);

      expect(NewsRepository.findPublishedPaginated).toHaveBeenCalledWith(6, 6);
      expect(NewsRepository.countAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedOutput);
    });
  });

  describe("getDetailBySlug", () => {
    it("NewsService - getDetailBySlug - TC-01: should get detail and increase view successfully", async () => {
      const input = { slug: "bai-viet-ca-phe" };
      const mockNews = {
        id: 1,
        slug: "bai-viet-ca-phe",
        title: "Bài viết cà phê",
      };

      NewsRepository.findBySlug.mockResolvedValue(mockNews);
      NewsRepository.increaseView.mockResolvedValue(true);

      logCase({
        method: "getDetailBySlug",
        tcid: "TC-01",
        crud: "READ",
        input,
        expected: mockNews,
      });

      const result = await NewsService.getDetailBySlug(input.slug);
      logReality(result);

      expect(NewsRepository.findBySlug).toHaveBeenCalledWith("bai-viet-ca-phe");
      expect(NewsRepository.increaseView).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockNews);
    });

    it("NewsService - getDetailBySlug - TC-02: should throw error when news does not exist", async () => {
      const input = { slug: "not-found" };
      const expectedError = "Tin không tồn tại";

      NewsRepository.findBySlug.mockResolvedValue(null);

      logCase({
        method: "getDetailBySlug",
        tcid: "TC-02",
        crud: "READ",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await NewsService.getDetailBySlug(input.slug);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(NewsRepository.increaseView).not.toHaveBeenCalled();
    });
  });

  describe("getFeatured", () => {
    it("NewsService - getFeatured - TC-01: should get featured news successfully", async () => {
      const input = { limit: 3 };
      const mockNews = [{ id: 1 }, { id: 2 }, { id: 3 }];

      NewsRepository.findFeatured.mockResolvedValue(mockNews);

      logCase({
        method: "getFeatured",
        tcid: "TC-01",
        crud: "READ",
        input,
        expected: mockNews,
      });

      const result = await NewsService.getFeatured(3);
      logReality(result);

      expect(NewsRepository.findFeatured).toHaveBeenCalledWith(3);
      expect(result).toEqual(mockNews);
    });
  });

  describe("createNews", () => {
    it("NewsService - createNews - TC-01: should create news successfully", async () => {
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

      const createdNews = {
        id: 10,
        ...input.data,
        slug: "bai-viet-moi-ve-ca-phe",
        created_by: 1,
      };

      NewsRepository.findByTitle.mockResolvedValue(null);
      NewsRepository.findBySlug.mockResolvedValue(null);
      NewsRepository.create.mockResolvedValue(createdNews);

      logCase({
        method: "createNews",
        tcid: "TC-01",
        crud: "CREATE",
        input,
        expected: createdNews,
      });

      const result = await NewsService.createNews(input.data, input.userId);
      logReality(result);

      expect(NewsRepository.findByTitle).toHaveBeenCalledWith(input.data.title);
      expect(NewsRepository.create).toHaveBeenCalledWith({
        ...input.data,
        slug: "bai-viet-moi-ve-ca-phe",
        created_by: 1,
      });
      expect(result).toEqual(createdNews);
    });

    it("NewsService - createNews - TC-02: should throw error when title already exists", async () => {
      const input = {
        data: {
          title: "Bài viết trùng tiêu đề",
          summary: "summary",
          content: "content",
          tag: "#tag",
          thumbnail: null,
        },
        userId: 1,
      };
      const expectedError = "Tiêu đề bài viết đã tồn tại";

      NewsRepository.findByTitle.mockResolvedValue({
        id: 1,
        title: input.data.title,
      });

      logCase({
        method: "createNews",
        tcid: "TC-02",
        crud: "CREATE",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await NewsService.createNews(input.data, input.userId);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(NewsRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getAllAdmin", () => {
    it("NewsService - getAllAdmin - TC-01: should get all admin news successfully", async () => {
      const input = { page: 2, limit: 10, keyword: "coffee" };
      const mockItems = [{ id: 1, title: "Coffee News" }];

      NewsRepository.findAllAdminPaginated.mockResolvedValue(mockItems);
      NewsRepository.countAll.mockResolvedValue(13);

      const expectedOutput = {
        items: mockItems,
        total: 13,
        page: 2,
        totalPages: 2,
      };

      logCase({
        method: "getAllAdmin",
        tcid: "TC-01",
        crud: "READ",
        input,
        expected: expectedOutput,
      });

      const result = await NewsService.getAllAdmin(input);
      logReality(result);

      expect(NewsRepository.findAllAdminPaginated).toHaveBeenCalledWith(
        10,
        10,
        "coffee",
        ""
      );
      expect(NewsRepository.countAll).toHaveBeenCalledWith("coffee");
      expect(result).toEqual(expectedOutput);
    });
  });

  describe("deleteNews", () => {
    it("NewsService - deleteNews - TC-01: should delete news successfully", async () => {
      const input = { id: 1 };
      const mockResult = { affectedRows: 1 };

      NewsRepository.deleteById.mockResolvedValue(mockResult);

      logCase({
        method: "deleteNews",
        tcid: "TC-01",
        crud: "DELETE",
        input,
        expected: mockResult,
      });

      const result = await NewsService.deleteNews(input.id);
      logReality(result);

      expect(NewsRepository.deleteById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockResult);
    });
  });

  describe("updateNews", () => {
    it("NewsService - updateNews - TC-01: should update news successfully", async () => {
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

      NewsRepository.findByTitleExcludeId.mockResolvedValue(null);
      NewsRepository.updateById.mockResolvedValue(true);

      logCase({
        method: "updateNews",
        tcid: "TC-01",
        crud: "UPDATE",
        input,
        expected: true,
      });

      const result = await NewsService.updateNews(input.id, input.data);
      logReality(result);

      expect(NewsRepository.findByTitleExcludeId).toHaveBeenCalledWith(
        "Tiêu đề mới",
        1
      );
      expect(NewsRepository.updateById).toHaveBeenCalledWith(1, input.data);
      expect(result).toBe(true);
    });

    it("NewsService - updateNews - TC-02: should throw error when title already exists", async () => {
      const input = {
        id: 1,
        data: {
          title: "Tiêu đề trùng",
          summary: "summary",
          content: "content",
          tag: "#tag",
          thumbnail: undefined,
        },
      };
      const expectedError = "Tiêu đề bài viết đã tồn tại";

      NewsRepository.findByTitleExcludeId.mockResolvedValue({
        id: 99,
        title: input.data.title,
      });

      logCase({
        method: "updateNews",
        tcid: "TC-02",
        crud: "UPDATE",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await NewsService.updateNews(input.id, input.data);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
      expect(NewsRepository.updateById).not.toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("NewsService - getById - TC-01: should get news by id successfully", async () => {
      const input = { id: 1 };
      const mockNews = { id: 1, title: "Tin 1" };

      NewsRepository.findOne.mockResolvedValue(mockNews);

      logCase({
        method: "getById",
        tcid: "TC-01",
        crud: "READ",
        input,
        expected: mockNews,
      });

      const result = await NewsService.getById(input.id);
      logReality(result);

      expect(NewsRepository.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockNews);
    });

    it("NewsService - getById - TC-02: should throw error when news not found", async () => {
      const input = { id: 999 };
      const expectedError = "Không tìm thấy bài viết";

      NewsRepository.findOne.mockResolvedValue(null);

      logCase({
        method: "getById",
        tcid: "TC-02",
        crud: "READ",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await NewsService.getById(input.id);
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);
    });
  });

  describe("getRelated", () => {
    it("NewsService - getRelated - TC-01: should return empty array when tag is missing", async () => {
      const input = { tag: "", excludeId: 1 };

      logCase({
        method: "getRelated",
        tcid: "TC-01",
        crud: "READ",
        input,
        expected: [],
      });

      const result = await NewsService.getRelated(input.tag, input.excludeId);
      logReality(result);

      expect(result).toEqual([]);
      expect(NewsRepository.findRelatedByTag).not.toHaveBeenCalled();
    });

    it("NewsService - getRelated - TC-02: should get related news successfully", async () => {
      const input = { tag: "#coffee", excludeId: 1 };
      const mockNews = [{ id: 2 }, { id: 3 }];

      NewsRepository.findRelatedByTag.mockResolvedValue(mockNews);

      logCase({
        method: "getRelated",
        tcid: "TC-02",
        crud: "READ",
        input,
        expected: mockNews,
      });

      const result = await NewsService.getRelated(input.tag, input.excludeId);
      logReality(result);

      expect(NewsRepository.findRelatedByTag).toHaveBeenCalledWith(
        "#coffee",
        1,
        3
      );
      expect(result).toEqual(mockNews);
    });
  });
});
