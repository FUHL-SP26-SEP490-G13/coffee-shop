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

      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const imageUrl = req.file?.path || null;

      if (!imageUrl) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "image",
              message: "Ảnh quảng cáo là bắt buộc",
            },
          ],
        });
      }

      const payload = {
        ...req.body,
        image_url: imageUrl,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
      };

      await bannerService.create(payload);

      return res.json({
        success: true,
        message: "Tạo quảng cáo thành công",
      });
    } catch (err) {
      if (err.message === "Tiêu đề quảng cáo đã tồn tại") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "title",
              message: "Tiêu đề quảng cáo đã tồn tại",
            },
          ],
        });
      }

      if (err.message === "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "end_date",
              message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
            },
          ],
        });
      }

      if (err.message === "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "start_date",
              message: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ",
            },
          ],
        });
      }

      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const id = req.params.id;
      const { type, ...body } = req.body;

      const data = {
        ...body,
        start_date: body.start_date,
        end_date: body.end_date,
      };

      if (req.file) {
        data.image_url = req.file.path;
      }

      await bannerService.update(id, data);

      return res.json({
        success: true,
        message: "Cập nhật thành công",
      });
    } catch (err) {
      if (err.message === "Tiêu đề quảng cáo đã tồn tại") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "title",
              message: "Tiêu đề quảng cáo đã tồn tại",
            },
          ],
        });
      }

      if (err.message === "Không tìm thấy quảng cáo") {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quảng cáo",
        });
      }

      if (err.message === "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "end_date",
              message: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu",
            },
          ],
        });
      }

      if (err.message === "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "start_date",
              message: "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ",
            },
          ],
        });
      }

      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      await bannerService.delete(req.params.id);
      return res.json({ success: true, message: "Xóa quảng cáo thành công" });
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
