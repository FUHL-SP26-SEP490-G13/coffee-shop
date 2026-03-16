const FavoriteService = require("../services/FavoriteService");
const response = require("../utils/response");

class FavoriteController {
  async getMyFavorites(req, res, next) {
    try {
      const userId = req.user.id;
      const { keyword = "", page = 1, limit = 4 } = req.query;

      const favorites = await FavoriteService.getMyFavorites(userId, {
        keyword,
        page: Number(page),
        limit: Number(limit),
      });

      return response.success(
        res,
        favorites,
        "Lấy danh sách yêu thích thành công"
      );
    } catch (error) {
      console.error("getMyFavorites error:", error);
      next(error);
    }
  }

  async checkFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const isFavorite = await FavoriteService.checkFavorite(
        userId,
        Number(productId)
      );

      return response.success(
        res,
        { isFavorite },
        "Kiểm tra yêu thích thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  async addFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { product_id } = req.body;

      if (!product_id) {
        return res.status(400).json({
          success: false,
          message: "product_id là bắt buộc",
        });
      }

      const result = await FavoriteService.addFavorite(
        userId,
        Number(product_id)
      );

      return response.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async removeFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const result = await FavoriteService.removeFavorite(
        userId,
        Number(productId)
      );

      return response.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FavoriteController();
