const ReviewRepository = require("../repositories/ReviewRepository");

class ReviewService {
  async getByProductId(productId) {
    const reviews = await ReviewRepository.getByProductId(productId);

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
          reviews.length
        : 0;

    return {
      items: reviews.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        rating: Number(item.rating),
        comment: item.comment || "",
        created_at: item.created_at,
        updated_at: item.updated_at,
        full_name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
        is_edited:
          item.updated_at &&
          item.created_at &&
          new Date(item.updated_at).getTime() !==
            new Date(item.created_at).getTime(),
      })),
      total: reviews.length,
      averageRating: Number(averageRating.toFixed(1)),
    };
  }

  async createOrUpdateReview(userId, productId, rating, comment = "") {
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Số sao phải từ 1 đến 5");
    }

    const hasPurchased = await ReviewRepository.hasPurchasedProduct(
      userId,
      productId
    );

    if (!hasPurchased) {
      throw new Error("Bạn chỉ có thể đánh giá sản phẩm đã mua");
    }

    const existed = await ReviewRepository.findByUserAndProduct(
      userId,
      productId
    );

    if (existed) {
      await ReviewRepository.updateReview(userId, productId, rating, comment);
      return {
        message: "Cập nhật đánh giá thành công",
      };
    }

    await ReviewRepository.createReview(userId, productId, rating, comment);

    return {
      message: "Đánh giá sản phẩm thành công",
    };
  }

  async getMyReview(userId, productId) {
    const review = await ReviewRepository.findByUserAndProduct(
      userId,
      productId
    );
    const hasPurchased = await ReviewRepository.hasPurchasedProduct(
      userId,
      productId
    );

    return {
      canReview: hasPurchased,
      review: review
        ? {
            id: review.id,
            rating: Number(review.rating),
            comment: review.comment || "",
          }
        : null,
    };
  }
}

module.exports = new ReviewService();
