const FavoriteRepository = require("../repositories/FavoriteRepository");

class FavoriteService {
  async getMyFavorites(userId, queryParams) {
    return await FavoriteRepository.getFavoritesByUser(userId, queryParams);
  }

  async checkFavorite(userId, productId) {
    const favorite = await FavoriteRepository.findByUserAndProduct(
      userId,
      productId
    );
    return !!favorite;
  }

  async addFavorite(userId, productId) {
    const existed = await FavoriteRepository.findByUserAndProduct(
      userId,
      productId
    );

    if (existed) {
      return {
        isFavorite: true,
        message: "Sản phẩm đã có trong danh sách yêu thích",
      };
    }

    await FavoriteRepository.createFavorite(userId, productId);

    return {
      isFavorite: true,
      message: "Đã thêm vào yêu thích",
    };
  }

  async removeFavorite(userId, productId) {
    await FavoriteRepository.deleteFavorite(userId, productId);

    return {
      isFavorite: false,
      message: "Đã bỏ khỏi yêu thích",
    };
  }
}

module.exports = new FavoriteService();
