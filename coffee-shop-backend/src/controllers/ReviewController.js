const ReviewService = require("../services/ReviewService");
const cloudinary = require("../config/cloudinary");
const ProductService = require("../services/ProductService");
const NotificationService = require("../services/NotificationService");
const ReviewRepository = require("../repositories/ReviewRepository");

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

      try {
        const product = await ProductService.getProductById(product_id);
        const UserRepository = require("../repositories/UserRepository");
        const user = await UserRepository.findByIdWithRole(userId);
        
        let userName = "Khách";
        if (user) {
          if (user.first_name || user.last_name) {
            userName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
          } else if (user.username) {
            userName = user.username;
          }
        }
        
        const notificationPayload = {
          type: "new_review",
          title: "Đánh giá mới",
          message: `Khách ${userName} đã đánh giá sản phẩm ${product.name}`,
          link: `/admin/reviews?keyword=${encodeURIComponent(product.name)}`,
          entity_type: "review",
          entity_id: product_id,
        };

        const managerNotification = await NotificationService.createForManager(notificationPayload);
        const staffNotification = await NotificationService.createForStaffs(notificationPayload);

        const notification = managerNotification?.notification || staffNotification?.notification;
        const recipients = [
          ...(managerNotification?.recipient ? [managerNotification.recipient] : []),
          ...(Array.isArray(staffNotification?.recipients) ? staffNotification.recipients : []),
        ];

        const io = req.app.get("io");
        if (io && notification && recipients.length > 0) {
          for (const recipient of recipients) {
            io.to(`user-${recipient.user_id}`).emit("admin:notification", {
              recipient_id: recipient.id,
              user_id: recipient.user_id,
              is_read: recipient.is_read,
              read_at: recipient.read_at,
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              link: notification.link,
              entity_type: notification.entity_type,
              entity_id: notification.entity_id,
              created_at: notification.created_at,
            });
          }
        }
      } catch (err) {
        console.error("Failed to notify admin about review:", err);
      }

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

      try {
        const review = await ReviewRepository.findById(id);
        if (review && review.user_id) {
          let link = `/products/${review.product_id}`;
          let prodName = "";
          try {
            const prod = await ProductService.getProductById(review.product_id);
            if (prod) {
              if (prod.slug) link = `/${prod.slug}`;
              prodName = prod.name;
            }
          } catch(e) {}

          const notificationPayload = {
            type: "review_reply",
            title: "Phản hồi đánh giá",
            message: prodName ? `Người bán đã phản hồi bình luận của bạn về sản phẩm ${prodName}` : "Người bán đã phản hồi bình luận sản phẩm của bạn",
            link: link,
            entity_type: "review",
            entity_id: review.product_id,
          };
          
          const customerNotification = await NotificationService.createForUsers(notificationPayload, [review.user_id]);
          
          const io = req.app.get("io");
          const recipient = customerNotification?.recipients?.[0];
          
          if (io && customerNotification?.notification && recipient) {
            io.to(`user-${review.user_id}`).emit("customer:notification", {
              recipient_id: recipient.id,
              user_id: recipient.user_id,
              is_read: recipient.is_read,
              read_at: recipient.read_at,
              id: customerNotification.notification.id,
              type: customerNotification.notification.type,
              title: customerNotification.notification.title,
              message: customerNotification.notification.message,
              link: customerNotification.notification.link,
              entity_type: customerNotification.notification.entity_type,
              entity_id: customerNotification.notification.entity_id,
              created_at: customerNotification.notification.created_at,
            });
          }
        }
      } catch (err) {
        console.error("Failed to notify customer about review reply:", err);
      }

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
