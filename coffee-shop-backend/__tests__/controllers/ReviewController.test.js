const ReviewController = require("../../src/controllers/ReviewController");
const ReviewService = require("../../src/services/ReviewService");

jest.mock("../../src/services/ReviewService");

describe("ReviewController", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: null,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe("getByProductId", () => {
    it("ReviewController - GET_BY_PRODUCT_ID - TC-1: should return reviews by product successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "ReviewController - GET_BY_PRODUCT_ID - TC-1: Lấy danh sách đánh giá theo sản phẩm thành công"
      );
      console.log("=".repeat(50));

      req.params = { productId: "1" };

      const mockData = {
        items: [
          {
            id: 1,
            user_id: 2,
            product_id: 1,
            rating: 5,
            comment: "Ngon",
            full_name: "Nguyen Van A",
            is_edited: false,
          },
        ],
        total: 1,
        averageRating: 5,
      };

      ReviewService.getByProductId.mockResolvedValue(mockData);

      await ReviewController.getByProductId(req, res, next);

      expect(ReviewService.getByProductId).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        message: "Lấy danh sách đánh giá thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - GET_BY_PRODUCT_ID - TC-2: should call next when service throws error", async () => {
      const mockError = new Error("Lỗi lấy danh sách đánh giá");
      req.params = { productId: "1" };

      ReviewService.getByProductId.mockRejectedValue(mockError);

      await ReviewController.getByProductId(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("createOrUpdate", () => {
    it("ReviewController - CREATE_OR_UPDATE - TC-1: should create review successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "ReviewController - CREATE_OR_UPDATE - TC-1: Tạo hoặc cập nhật đánh giá thành công"
      );
      console.log("=".repeat(50));

      req.user = { id: 1 };
      req.body = {
        product_id: 10,
        rating: 5,
        comment: "Cà phê rất ngon",
      };

      const mockResult = {
        message: "Đánh giá sản phẩm thành công",
      };

      ReviewService.createOrUpdateReview.mockResolvedValue(mockResult);

      await ReviewController.createOrUpdate(req, res, next);

      expect(ReviewService.createOrUpdateReview).toHaveBeenCalledWith(
        1,
        10,
        5,
        "Cà phê rất ngon"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: "Đánh giá sản phẩm thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - CREATE_OR_UPDATE - TC-2: should update review successfully", async () => {
      req.user = { id: 1 };
      req.body = {
        product_id: 10,
        rating: 4,
        comment: "Khá ổn",
      };

      const mockResult = {
        message: "Cập nhật đánh giá thành công",
      };

      ReviewService.createOrUpdateReview.mockResolvedValue(mockResult);

      await ReviewController.createOrUpdate(req, res, next);

      expect(ReviewService.createOrUpdateReview).toHaveBeenCalledWith(
        1,
        10,
        4,
        "Khá ổn"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: "Cập nhật đánh giá thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - CREATE_OR_UPDATE - TC-3: should return 400 when product_id is missing", async () => {
      req.user = { id: 1 };
      req.body = {
        rating: 5,
        comment: "Ngon",
      };

      await ReviewController.createOrUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "product_id và rating là bắt buộc",
      });
      expect(ReviewService.createOrUpdateReview).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - CREATE_OR_UPDATE - TC-4: should return 400 when rating is missing", async () => {
      req.user = { id: 1 };
      req.body = {
        product_id: 10,
        comment: "Ngon",
      };

      await ReviewController.createOrUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "product_id và rating là bắt buộc",
      });
      expect(ReviewService.createOrUpdateReview).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - CREATE_OR_UPDATE - TC-5: should call next when service throws error", async () => {
      req.user = { id: 1 };
      req.body = {
        product_id: 10,
        rating: 5,
        comment: "Ngon",
      };

      const mockError = new Error("Bạn chỉ có thể đánh giá sản phẩm đã mua");
      ReviewService.createOrUpdateReview.mockRejectedValue(mockError);

      await ReviewController.createOrUpdate(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("getMyReview", () => {
    it("ReviewController - GET_MY_REVIEW - TC-1: should return my review successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "ReviewController - GET_MY_REVIEW - TC-1: Lấy đánh giá của user thành công"
      );
      console.log("=".repeat(50));

      req.user = { id: 1 };
      req.params = { productId: "10" };

      const mockData = {
        canReview: true,
        review: {
          id: 1,
          rating: 5,
          comment: "Ngon",
        },
      };

      ReviewService.getMyReview.mockResolvedValue(mockData);

      await ReviewController.getMyReview(req, res, next);

      expect(ReviewService.getMyReview).toHaveBeenCalledWith(1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        message: "Lấy đánh giá của bạn thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - GET_MY_REVIEW - TC-2: should call next when service throws error", async () => {
      req.user = { id: 1 };
      req.params = { productId: "10" };

      const mockError = new Error("Lỗi lấy đánh giá của bạn");
      ReviewService.getMyReview.mockRejectedValue(mockError);

      await ReviewController.getMyReview(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("ReviewController - GET_ALL - TC-1: should return all reviews successfully", async () => {
      console.log("\n" + "=".repeat(50));
      console.log(
        "ReviewController - GET_ALL - TC-1: Lấy danh sách review thành công"
      );
      console.log("=".repeat(50));

      req.query = {
        keyword: "coffee",
        page: "1",
        limit: "7",
      };

      const mockData = {
        items: [
          {
            id: 1,
            product_name: "Coffee",
            rating: 5,
            comment: "Ngon",
            full_name: "Nguyen Van A",
          },
        ],
        total: 1,
        page: 1,
        limit: 7,
        totalPages: 1,
      };

      ReviewService.getAllReviews.mockResolvedValue(mockData);

      await ReviewController.getAll(req, res, next);

      expect(ReviewService.getAllReviews).toHaveBeenCalledWith({
        keyword: "coffee",
        page: 1,
        limit: 7,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        message: "Lấy danh sách review thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - GET_ALL - TC-2: should use default query params", async () => {
      req.query = {};

      const mockData = {
        items: [],
        total: 0,
        page: 1,
        limit: 7,
        totalPages: 1,
      };

      ReviewService.getAllReviews.mockResolvedValue(mockData);

      await ReviewController.getAll(req, res, next);

      expect(ReviewService.getAllReviews).toHaveBeenCalledWith({
        keyword: "",
        page: 1,
        limit: 7,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        message: "Lấy danh sách review thành công",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("ReviewController - GET_ALL - TC-3: should call next when service throws error", async () => {
      req.query = {
        keyword: "coffee",
        page: "1",
        limit: "7",
      };

      const mockError = new Error("Lỗi lấy danh sách review");
      ReviewService.getAllReviews.mockRejectedValue(mockError);

      await ReviewController.getAll(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
