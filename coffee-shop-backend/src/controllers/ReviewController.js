const ReviewService = require("../services/ReviewService");

class ReviewController {
  async getByProductId(req, res, next) {
    try {
      const { productId } = req.params;
      const data = await ReviewService.getByProductId(Number(productId));

      return res.status(200).json({
        success: true,
        data,
        message: "Lấy danh sách đánh giá thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrUpdate(req, res, next) {
    try {
      const userId = req.user.id;
      const { product_id, rating, comment } = req.body;

      if (!product_id || !rating) {
        return res.status(400).json({
          success: false,
          message: "product_id và rating là bắt buộc",
        });
      }

      const result = await ReviewService.createOrUpdateReview(
        userId,
        Number(product_id),
        Number(rating),
        comment || ""
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || "Không thể đánh giá sản phẩm",
      });
    }
  }

  async getMyReview(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const data = await ReviewService.getMyReview(userId, Number(productId));

      return res.status(200).json({
        success: true,
        data,
        message: "Lấy đánh giá của bạn thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { keyword = "", page = 1, limit = 7 } = req.query;

      const data = await ReviewService.getAllReviews({
        keyword,
        page: Number(page),
        limit: Number(limit),
      });

      return res.status(200).json({
        success: true,
        data,
        message: "Lấy danh sách review thành công",
      });
    } catch (error) {
      next(error);
    }
  }
  async getPublicReviews(req, res, next) {
    try {
      const data = await ReviewService.getPublicReviews();
      return res.status(200).json({
        success: true,
        data,
        message: "Lấy danh sách review public thành công",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReviewController();
