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
        images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
        created_at: item.created_at,
        updated_at: item.updated_at,
        reply_comment: item.reply_comment || "",
        reply_images: item.reply_images ? (typeof item.reply_images === 'string' ? JSON.parse(item.reply_images) : item.reply_images) : [],
        replied_at: item.replied_at,
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

  async createOrUpdateReview(userId, productId, rating, comment = "", newImages = [], deleteImageIds = []) {
    // Only throw if rating is provided but invalid. If they don't provide rating, let controller block or set default.
    // Wait, requirement: star is mandatory, comment and image optional.
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
      let currentImages = [];
      if (existed.images) {
        try {
          currentImages = typeof existed.images === 'string' ? JSON.parse(existed.images) : existed.images;
        } catch(e) {}
      }

      currentImages = currentImages.filter(img => !deleteImageIds.includes(img.public_id));
      const finalImages = [...currentImages, ...newImages];

      if (finalImages.length > 4) {
        throw new Error("Tối đa 3 ảnh và 1 video cho mỗi bài đánh giá");
      }

      await ReviewRepository.updateReview(userId, productId, rating, comment, finalImages);
      return {
        message: "Cập nhật đánh giá thành công",
      };
    }

    if (newImages.length > 4) {
      throw new Error("Tối đa 3 ảnh và 1 video cho mỗi bài đánh giá");
    }

    await ReviewRepository.createReview(userId, productId, rating, comment, newImages);

    return {
      message: "Đánh giá sản phẩm thành công",
    };
  }

  async replyReview(id, replyComment, newImages = [], deleteImageIds = []) {
    const existed = await ReviewRepository.findById(id);
    if (!existed) {
      throw new Error("Không tìm thấy đánh giá này");
    }

    let currentImages = [];
    if (existed.reply_images) {
      try {
        currentImages = typeof existed.reply_images === 'string' ? JSON.parse(existed.reply_images) : existed.reply_images;
      } catch(e) {}
    }

    currentImages = currentImages.filter(img => !deleteImageIds.includes(img.public_id));
    const finalImages = [...currentImages, ...newImages];

    if (finalImages.length > 4) {
      throw new Error("Tối đa 4 tệp đính kèm cho mỗi phản hồi");
    }

    await ReviewRepository.replyReview(id, replyComment, finalImages);
    return {
      message: "Phản hồi đánh giá thành công",
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
            images: review.images ? (typeof review.images === 'string' ? JSON.parse(review.images) : review.images) : [],
          }
        : null,
    };
  }

  async getAllReviews(queryParams) {
    const result = await ReviewRepository.getAllReviews(queryParams);

    return {
      ...result,
      items: result.items.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.product_id,
        product_name: item.product_name,
        category_name: item.category_name,
        rating: Number(item.rating),
        comment: item.comment || "",
        images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
        created_at: item.created_at,
        updated_at: item.updated_at,
        reply_comment: item.reply_comment || "",
        reply_images: item.reply_images ? (typeof item.reply_images === 'string' ? JSON.parse(item.reply_images) : item.reply_images) : [],
        replied_at: item.replied_at,
        full_name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
        is_edited:
          item.updated_at &&
          item.created_at &&
          new Date(item.updated_at).getTime() !==
            new Date(item.created_at).getTime(),
      })),
    };
  }
  async getPublicReviews() {
    const rows = await ReviewRepository.getPublicReviews(30);
    return rows.map((item) => ({
      id: item.id,
      rating: Number(item.rating),
      comment: item.comment || "",
      images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
      created_at: item.created_at,
      full_name: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
    }));
  }
}

module.exports = new ReviewService();
