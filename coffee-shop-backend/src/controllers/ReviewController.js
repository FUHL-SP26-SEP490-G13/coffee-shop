const ReviewService = require("../services/ReviewService");
const cloudinary = require("../config/cloudinary");

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
    let uploadedImages = [];
    try {
      const userId = req.user.id;
      const { product_id, rating, comment } = req.body;
      
      let deleteImageIds = [];
      if (req.body.deleteImageIds) {
        try {
           deleteImageIds = JSON.parse(req.body.deleteImageIds);
        } catch(e) {
           deleteImageIds = Array.isArray(req.body.deleteImageIds) ? req.body.deleteImageIds : [req.body.deleteImageIds];
        }
      }

      if (!product_id || !rating) {
        return res.status(400).json({
          success: false,
          message: "product_id và rating là bắt buộc",
        });
      }

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const isVideo = file.mimetype && file.mimetype.startsWith("video/");
          const uploadOptions = {
            folder: "reviews",
            resource_type: "auto",
          };
          if (!isVideo) {
            uploadOptions.transformation = [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" },
            ];
          }

          const result = await cloudinary.uploader.upload(file.path, uploadOptions);

          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }

      const result = await ReviewService.createOrUpdateReview(
        userId,
        Number(product_id),
        Number(rating),
        comment || "",
        uploadedImages,
        deleteImageIds
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error("Failed to delete review image:", err);
          }
        }
      }
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

  async replyReview(req, res, next) {
    let uploadedImages = [];
    try {
      const { id } = req.params;
      const { reply_comment } = req.body;
      
      let deleteImageIds = [];
      if (req.body.deleteImageIds) {
        try {
           deleteImageIds = JSON.parse(req.body.deleteImageIds);
        } catch(e) {
           deleteImageIds = Array.isArray(req.body.deleteImageIds) ? req.body.deleteImageIds : [req.body.deleteImageIds];
        }
      }

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const isVideo = file.mimetype && file.mimetype.startsWith("video/");
          const uploadOptions = {
            folder: "reviews",
            resource_type: "auto",
          };
          if (!isVideo) {
            uploadOptions.transformation = [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto" },
            ];
          }

          const result = await cloudinary.uploader.upload(file.path, uploadOptions);

          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      }

      const result = await ReviewService.replyReview(
        Number(id),
        reply_comment || "",
        uploadedImages,
        deleteImageIds
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          try {
            await cloudinary.uploader.destroy(img.public_id);
          } catch (err) {
            console.error("Failed to delete review image:", err);
          }
        }
      }
      return res.status(400).json({
        success: false,
        message: error.message || "Không thể phản hồi đánh giá",
      });
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
