const ReviewService = require("../../src/services/ReviewService");
const ReviewRepository = require("../../src/repositories/ReviewRepository");

jest.mock("../../src/repositories/ReviewRepository");

const logCase = ({ tcid, crud, scenario, input, expected }) => {
  console.log("\n" + "=".repeat(70));
  console.log(`ReviewService - ${scenario} - ${tcid} - CRUD: ${crud}`);
  console.log("=".repeat(70));
  console.log("\n📝 INPUT:", JSON.stringify(input, null, 2));
  console.log("✅ OUTPUT EXPECT:", JSON.stringify(expected, null, 2));
};

const logReality = (value) => {
  console.log("🎯 OUTPUT REALITY:", JSON.stringify(value, null, 2));
};

describe("ReviewService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByProductId", () => {
    it("ReviewService - GET_BY_PRODUCT_ID - TCID: REV-SVC-RD-001 - CRUD: READ", async () => {
      const mockReviews = [
        {
          id: 1,
          user_id: 2,
          product_id: 1,
          rating: 5,
          comment: "Ngon",
          images: JSON.stringify([{ url: "https://cdn/review-1.jpg" }]),
          created_at: new Date("2026-03-15T10:00:00"),
          updated_at: new Date("2026-03-15T10:00:00"),
          first_name: "Nguyen",
          last_name: "Van A",
        },
        {
          id: 2,
          user_id: 3,
          product_id: 1,
          rating: 4,
          comment: "Ổn",
          images: null,
          created_at: new Date("2026-03-15T09:00:00"),
          updated_at: new Date("2026-03-15T11:00:00"),
          first_name: "Tran",
          last_name: "Thi B",
        },
      ];
      const input = { productId: 1 };
      const expected = {
        items: [
          {
            id: 1,
            user_id: 2,
            product_id: 1,
            rating: 5,
            comment: "Ngon",
            images: [{ url: "https://cdn/review-1.jpg" }],
            created_at: mockReviews[0].created_at,
            updated_at: mockReviews[0].updated_at,
            full_name: "Nguyen Van A",
            is_edited: false,
          },
          {
            id: 2,
            user_id: 3,
            product_id: 1,
            rating: 4,
            comment: "Ổn",
            images: [],
            created_at: mockReviews[1].created_at,
            updated_at: mockReviews[1].updated_at,
            full_name: "Tran Thi B",
            is_edited: true,
          },
        ],
        total: 2,
        averageRating: 4.5,
      };
      logCase({
        tcid: "REV-SVC-RD-001",
        crud: "READ",
        scenario: "lấy review theo product",
        input,
        expected,
      });

      ReviewRepository.getByProductId.mockResolvedValue(mockReviews);

      const result = await ReviewService.getByProductId(1);
      logReality(result);

      expect(ReviewRepository.getByProductId).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });

    it("ReviewService - GET_BY_PRODUCT_ID - TCID: REV-SVC-RD-002 - CRUD: READ", async () => {
      const input = { productId: 1 };
      const expected = {
        items: [],
        total: 0,
        averageRating: 0,
      };
      logCase({
        tcid: "REV-SVC-RD-002",
        crud: "READ",
        scenario: "không có review",
        input,
        expected,
      });

      ReviewRepository.getByProductId.mockResolvedValue([]);

      const result = await ReviewService.getByProductId(1);
      logReality(result);

      expect(result).toEqual(expected);
    });
  });

  describe("createOrUpdateReview", () => {
    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TCID: REV-SVC-CR-001 - CRUD: CREATE", async () => {
      const input = { userId: 1, productId: 10, rating: 0, comment: "Bad" };
      const expectedError = "Số sao phải từ 1 đến 5";
      logCase({
        tcid: "REV-SVC-CR-001",
        crud: "CREATE",
        scenario: "lỗi rating không hợp lệ",
        input,
        expected: { error: expectedError },
      });

      let actualError = null;
      try {
        await ReviewService.createOrUpdateReview(1, 10, 0, "Bad");
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);

      expect(ReviewRepository.hasPurchasedProduct).not.toHaveBeenCalled();
    });

    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TCID: REV-SVC-CR-002 - CRUD: CREATE", async () => {
      const input = { userId: 1, productId: 10, rating: 5, comment: "Ngon" };
      const expectedError = "Bạn chỉ có thể đánh giá sản phẩm đã mua";
      logCase({
        tcid: "REV-SVC-CR-002",
        crud: "CREATE",
        scenario: "lỗi chưa mua sản phẩm",
        input,
        expected: { error: expectedError },
      });

      ReviewRepository.hasPurchasedProduct.mockResolvedValue(false);

      let actualError = null;
      try {
        await ReviewService.createOrUpdateReview(1, 10, 5, "Ngon");
      } catch (error) {
        actualError = error.message;
      }
      logReality({ error: actualError });

      expect(actualError).toContain(expectedError);

      expect(ReviewRepository.hasPurchasedProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.findByUserAndProduct).not.toHaveBeenCalled();
    });

    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TCID: REV-SVC-CR-003 - CRUD: CREATE", async () => {
      const input = { userId: 1, productId: 10, rating: 5, comment: "Ngon" };
      const expected = { message: "Đánh giá sản phẩm thành công" };
      logCase({
        tcid: "REV-SVC-CR-003",
        crud: "CREATE",
        scenario: "tạo review mới",
        input,
        expected,
      });

      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);
      ReviewRepository.findByUserAndProduct.mockResolvedValue(null);
      ReviewRepository.createReview.mockResolvedValue({ insertId: 1 });

      const result = await ReviewService.createOrUpdateReview(1, 10, 5, "Ngon");
      logReality(result);

      expect(ReviewRepository.hasPurchasedProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.findByUserAndProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.createReview).toHaveBeenCalledWith(
        1,
        10,
        5,
        "Ngon",
        []
      );
      expect(ReviewRepository.updateReview).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TCID: REV-SVC-UP-001 - CRUD: UPDATE", async () => {
      const input = {
        userId: 1,
        productId: 10,
        rating: 4,
        comment: "Khá ổn",
      };
      const expected = { message: "Cập nhật đánh giá thành công" };
      logCase({
        tcid: "REV-SVC-UP-001",
        crud: "UPDATE",
        scenario: "cập nhật review đã tồn tại",
        input,
        expected,
      });

      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);
      ReviewRepository.findByUserAndProduct.mockResolvedValue({
        id: 1,
        user_id: 1,
        product_id: 10,
        images: JSON.stringify([{ public_id: "old_1", url: "https://cdn/old.jpg" }]),
      });
      ReviewRepository.updateReview.mockResolvedValue({ affectedRows: 1 });

      const result = await ReviewService.createOrUpdateReview(
        1,
        10,
        4,
        "Khá ổn"
      );
      logReality(result);

      expect(ReviewRepository.updateReview).toHaveBeenCalledWith(
        1,
        10,
        4,
        "Khá ổn",
        [{ public_id: "old_1", url: "https://cdn/old.jpg" }]
      );
      expect(ReviewRepository.createReview).not.toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe("getMyReview", () => {
    it("ReviewService - GET_MY_REVIEW - TCID: REV-SVC-RD-003 - CRUD: READ", async () => {
      const mockReview = {
        id: 5,
        rating: 5,
        comment: "Rất ngon",
        images: JSON.stringify([{ url: "https://cdn/review-5.jpg" }]),
      };
      const input = { userId: 1, productId: 10 };
      const expected = {
        canReview: true,
        review: {
          id: 5,
          rating: 5,
          comment: "Rất ngon",
          images: [{ url: "https://cdn/review-5.jpg" }],
        },
      };
      logCase({
        tcid: "REV-SVC-RD-003",
        crud: "READ",
        scenario: "lấy review của tôi khi đã có review",
        input,
        expected,
      });

      ReviewRepository.findByUserAndProduct.mockResolvedValue(mockReview);
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);

      const result = await ReviewService.getMyReview(1, 10);
      logReality(result);

      expect(ReviewRepository.findByUserAndProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.hasPurchasedProduct).toHaveBeenCalledWith(1, 10);

      expect(result).toEqual(expected);
    });

    it("ReviewService - GET_MY_REVIEW - TCID: REV-SVC-RD-004 - CRUD: READ", async () => {
      const input = { userId: 1, productId: 10 };
      const expected = {
        canReview: false,
        review: null,
      };
      logCase({
        tcid: "REV-SVC-RD-004",
        crud: "READ",
        scenario: "chưa có review của user",
        input,
        expected,
      });

      ReviewRepository.findByUserAndProduct.mockResolvedValue(null);
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(false);

      const result = await ReviewService.getMyReview(1, 10);
      logReality(result);

      expect(result).toEqual(expected);
    });

    it("ReviewService - GET_MY_REVIEW - TCID: REV-SVC-RD-005 - CRUD: READ", async () => {
      const input = { userId: 1, productId: 10 };
      const expected = {
        canReview: true,
        review: {
          id: 7,
          rating: 4,
          comment: "",
          images: [],
        },
      };
      logCase({
        tcid: "REV-SVC-RD-005",
        crud: "READ",
        scenario: "comment null trả về chuỗi rỗng",
        input,
        expected,
      });

      ReviewRepository.findByUserAndProduct.mockResolvedValue({
        id: 7,
        rating: 4,
        comment: null,
        images: null,
      });
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);

      const result = await ReviewService.getMyReview(1, 10);
      logReality(result);

      expect(result).toEqual(expected);
    });
  });

  describe("getAllReviews", () => {
    it("ReviewService - GET_ALL_REVIEWS - TCID: REV-SVC-RD-006 - CRUD: READ", async () => {
      const mockRepositoryResult = {
        items: [
          {
            id: 1,
            user_id: 2,
            product_id: 3,
            product_name: "Coffee",
            rating: "5",
            comment: "Ngon",
            images: JSON.stringify([{ url: "https://cdn/admin-review-1.jpg" }]),
            created_at: new Date("2026-03-15T10:00:00"),
            updated_at: new Date("2026-03-15T10:00:00"),
            first_name: "Nguyen",
            last_name: "Van A",
          },
          {
            id: 2,
            user_id: 4,
            product_id: 5,
            product_name: "Milk Tea",
            rating: "4",
            comment: null,
            images: null,
            created_at: new Date("2026-03-15T09:00:00"),
            updated_at: new Date("2026-03-15T11:00:00"),
            first_name: "Tran",
            last_name: "Thi B",
          },
        ],
        total: 2,
        page: 1,
        limit: 7,
        totalPages: 1,
      };
      const input = {
        keyword: "coffee",
        page: 1,
        limit: 7,
      };
      const expected = {
        items: [
          {
            id: 1,
            user_id: 2,
            product_id: 3,
            product_name: "Coffee",
            rating: 5,
            comment: "Ngon",
            images: [{ url: "https://cdn/admin-review-1.jpg" }],
            created_at: mockRepositoryResult.items[0].created_at,
            updated_at: mockRepositoryResult.items[0].updated_at,
            full_name: "Nguyen Van A",
            is_edited: false,
          },
          {
            id: 2,
            user_id: 4,
            product_id: 5,
            product_name: "Milk Tea",
            rating: 4,
            comment: "",
            images: [],
            created_at: mockRepositoryResult.items[1].created_at,
            updated_at: mockRepositoryResult.items[1].updated_at,
            full_name: "Tran Thi B",
            is_edited: true,
          },
        ],
        total: 2,
        page: 1,
        limit: 7,
        totalPages: 1,
      };
      logCase({
        tcid: "REV-SVC-RD-006",
        crud: "READ",
        scenario: "admin lấy danh sách review",
        input,
        expected,
      });

      ReviewRepository.getAllReviews.mockResolvedValue(mockRepositoryResult);

      const result = await ReviewService.getAllReviews(input);
      logReality(result);

      expect(ReviewRepository.getAllReviews).toHaveBeenCalledWith({
        keyword: "coffee",
        page: 1,
        limit: 7,
      });

      expect(result).toEqual(expected);
    });

    it("ReviewService - GET_ALL_REVIEWS - TCID: REV-SVC-RD-007 - CRUD: READ", async () => {
      const input = {
        keyword: "",
        page: 1,
        limit: 7,
      };
      const expected = {
        items: [],
        total: 0,
        page: 1,
        limit: 7,
        totalPages: 1,
      };
      logCase({
        tcid: "REV-SVC-RD-007",
        crud: "READ",
        scenario: "không có dữ liệu review",
        input,
        expected,
      });

      ReviewRepository.getAllReviews.mockResolvedValue(expected);

      const result = await ReviewService.getAllReviews(input);
      logReality(result);

      expect(result).toEqual(expected);
    });
  });
});
