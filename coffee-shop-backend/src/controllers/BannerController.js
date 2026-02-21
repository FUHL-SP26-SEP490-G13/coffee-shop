const bannerService = require("../services/BannerService");

class BannerController {
  async getActive(req, res, next) {
    try {
      const data = await bannerService.getActive();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 5, keyword = "" } = req.query;

      const result = await bannerService.getAll({
        page: Number(page),
        limit: Number(limit),
        keyword,
      });

      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      // CloudinaryStorage trả URL ở req.file.path
      const imageUrl = req.file?.path || null;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng upload ảnh banner (field: image).",
        });
      }

      const payload = {
        ...req.body,
        image_url: imageUrl,
        // is_active từ FormData thường là string -> ép kiểu
        is_active:
          req.body.is_active === true ||
          req.body.is_active === "true" ||
          req.body.is_active === 1 ||
          req.body.is_active === "1",
      };

      await bannerService.create(payload);
      return res.json({ success: true, message: "Tạo banner thành công" });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const bannerId = req.params.id;

      const existingBanner = await bannerService.getById(bannerId);

      if (!existingBanner) {
        return res.status(404).json({
          success: false,
          message: "Banner không tồn tại",
        });
      }

      const payload = {};

      if (req.body.title !== undefined) {
        payload.title = req.body.title;
      }

      if (req.body.subtitle !== undefined) {
        payload.subtitle = req.body.subtitle;
      }

      if (req.body.button_text !== undefined) {
        payload.button_text = req.body.button_text;
      }

      if (req.body.button_link !== undefined) {
        payload.button_link = req.body.button_link;
      }

      if (req.body.is_active !== undefined) {
        payload.is_active =
          req.body.is_active === true ||
          req.body.is_active === "true" ||
          req.body.is_active === 1 ||
          req.body.is_active === "1";
      }

      // 👇 QUAN TRỌNG NHẤT
      if (req.file?.path) {
        payload.image_url = req.file.path;
      }

      await bannerService.update(bannerId, payload);

      return res.json({
        success: true,
        message: "Cập nhật banner thành công",
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await bannerService.delete(req.params.id);
      return res.json({ success: true, message: "Xóa banner thành công" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BannerController();
