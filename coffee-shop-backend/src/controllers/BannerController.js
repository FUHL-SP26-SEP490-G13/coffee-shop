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
      const { page = 1, limit = 5, keyword = "", status = "" } = req.query;

      const result = await bannerService.getAll({
        page: Number(page),
        limit: Number(limit),
        keyword,
        status,
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Ảnh banner là bắt buộc",
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
      const id = req.params.id;

      // TÁCH type RA - chỉ dùng cho upload, không phải dữ liệu DB
      const { type, ...body } = req.body;

      const data = {
        ...body,
        is_active: body.is_active === true || body.is_active === "true",
      };

      if (req.file) {
        data.image_url = req.file.path;
      }

      await bannerService.update(id, data);

      res.json({ success: true, message: "Cập nhật thành công" });
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

  async getActiveList(req, res, next) {
    try {
      const data = await bannerService.getActiveList();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BannerController();
