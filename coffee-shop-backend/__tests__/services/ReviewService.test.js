const ReviewService = require("../../src/services/ReviewService");
const ReviewRepository = require("../../src/repositories/ReviewRepository");

jest.mock("../../src/repositories/ReviewRepository");

describe("ReviewService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getByProductId", () => {
    it("ReviewService - GET_BY_PRODUCT_ID - TC-1: should return reviews with average rating successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "ReviewService - GET_BY_PRODUCT_ID - TC-1: Lấy review theo product thành công"
      );
      console.log("=".repeat(50));

      const mockReviews = [
        {
          id: 1,
          user_id: 2,
          product_id: 1,
          rating: 5,
          comment: "Ngon",
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
          created_at: new Date("2026-03-15T09:00:00"),
          updated_at: new Date("2026-03-15T11:00:00"),
          first_name: "Tran",
          last_name: "Thi B",
        },
      ];

      ReviewRepository.getByProductId.mockResolvedValue(mockReviews);

      const result = await ReviewService.getByProductId(1);

      expect(ReviewRepository.getByProductId).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        items: [
          {
            id: 1,
            user_id: 2,
            product_id: 1,
            rating: 5,
            comment: "Ngon",
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
            created_at: mockReviews[1].created_at,
            updated_at: mockReviews[1].updated_at,
            full_name: "Tran Thi B",
            is_edited: true,
          },
        ],
        total: 2,
        averageRating: 4.5,
      });
    });

    it("ReviewService - GET_BY_PRODUCT_ID - TC-2: should return empty list and average 0 when no review", async () => {
      ReviewRepository.getByProductId.mockResolvedValue([]);

      const result = await ReviewService.getByProductId(1);

      expect(result).toEqual({
        items: [],
        total: 0,
        averageRating: 0,
      });
    });
  });

  describe("createOrUpdateReview", () => {
    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TC-1: should throw error when rating is invalid", async () => {
      await expect(
        ReviewService.createOrUpdateReview(1, 10, 0, "Bad")
      ).rejects.toThrow("Số sao phải từ 1 đến 5");

      expect(ReviewRepository.hasPurchasedProduct).not.toHaveBeenCalled();
    });

    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TC-2: should throw error when user has not purchased product", async () => {
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(false);

      await expect(
        ReviewService.createOrUpdateReview(1, 10, 5, "Ngon")
      ).rejects.toThrow("Bạn chỉ có thể đánh giá sản phẩm đã mua");

      expect(ReviewRepository.hasPurchasedProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.findByUserAndProduct).not.toHaveBeenCalled();
    });

    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TC-3: should create review successfully when review does not exist", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "ReviewService - CREATE_OR_UPDATE_REVIEW - TC-3: Tạo review mới thành công"
      );
      console.log("=".repeat(50));

      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);
      ReviewRepository.findByUserAndProduct.mockResolvedValue(null);
      ReviewRepository.createReview.mockResolvedValue({ insertId: 1 });

      const result = await ReviewService.createOrUpdateReview(1, 10, 5, "Ngon");

      expect(ReviewRepository.hasPurchasedProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.findByUserAndProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.createReview).toHaveBeenCalledWith(
        1,
        10,
        5,
        "Ngon"
      );
      expect(ReviewRepository.updateReview).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: "Đánh giá sản phẩm thành công",
      });
    });

    it("ReviewService - CREATE_OR_UPDATE_REVIEW - TC-4: should update review successfully when review already exists", async () => {
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);
      ReviewRepository.findByUserAndProduct.mockResolvedValue({
        id: 1,
        user_id: 1,
        product_id: 10,
      });
      ReviewRepository.updateReview.mockResolvedValue({ affectedRows: 1 });

      const result = await ReviewService.createOrUpdateReview(
        1,
        10,
        4,
        "Khá ổn"
      );

      expect(ReviewRepository.updateReview).toHaveBeenCalledWith(
        1,
        10,
        4,
        "Khá ổn"
      );
      expect(ReviewRepository.createReview).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: "Cập nhật đánh giá thành công",
      });
    });
  });

  describe("getMyReview", () => {
    it("ReviewService - GET_MY_REVIEW - TC-1: should return canReview=true and existing review", async () => {
      const mockReview = {
        id: 5,
        rating: 5,
        comment: "Rất ngon",
      };

      ReviewRepository.findByUserAndProduct.mockResolvedValue(mockReview);
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);

      const result = await ReviewService.getMyReview(1, 10);

      expect(ReviewRepository.findByUserAndProduct).toHaveBeenCalledWith(1, 10);
      expect(ReviewRepository.hasPurchasedProduct).toHaveBeenCalledWith(1, 10);

      expect(result).toEqual({
        canReview: true,
        review: {
          id: 5,
          rating: 5,
          comment: "Rất ngon",
        },
      });
    });

    it("ReviewService - GET_MY_REVIEW - TC-2: should return canReview=false and review=null when user has not reviewed", async () => {
      ReviewRepository.findByUserAndProduct.mockResolvedValue(null);
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(false);

      const result = await ReviewService.getMyReview(1, 10);

      expect(result).toEqual({
        canReview: false,
        review: null,
      });
    });

    it("ReviewService - GET_MY_REVIEW - TC-3: should return empty comment when review comment is null", async () => {
      ReviewRepository.findByUserAndProduct.mockResolvedValue({
        id: 7,
        rating: 4,
        comment: null,
      });
      ReviewRepository.hasPurchasedProduct.mockResolvedValue(true);

      const result = await ReviewService.getMyReview(1, 10);

      expect(result).toEqual({
        canReview: true,
        review: {
          id: 7,
          rating: 4,
          comment: "",
        },
      });
    });
  });

  describe("getAllReviews", () => {
    it("ReviewService - GET_ALL_REVIEWS - TC-1: should return all reviews with mapped fields successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "ReviewService - GET_ALL_REVIEWS - TC-1: Lấy tất cả review thành công"
      );
      console.log("=".repeat(50));

      const mockRepositoryResult = {
        items: [
          {
            id: 1,
            user_id: 2,
            product_id: 3,
            product_name: "Coffee",
            rating: "5",
            comment: "Ngon",
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

      ReviewRepository.getAllReviews.mockResolvedValue(mockRepositoryResult);

      const result = await ReviewService.getAllReviews({
        keyword: "coffee",
        page: 1,
        limit: 7,
      });

      expect(ReviewRepository.getAllReviews).toHaveBeenCalledWith({
        keyword: "coffee",
        page: 1,
        limit: 7,
      });

      expect(result).toEqual({
        items: [
          {
            id: 1,
            user_id: 2,
            product_id: 3,
            product_name: "Coffee",
            rating: 5,
            comment: "Ngon",
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
      });
    });

    it("ReviewService - GET_ALL_REVIEWS - TC-2: should return empty items when repository has no data", async () => {
      ReviewRepository.getAllReviews.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 7,
        totalPages: 1,
      });

      const result = await ReviewService.getAllReviews({
        keyword: "",
        page: 1,
        limit: 7,
      });

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 7,
        totalPages: 1,
      });
    });
  });
});
