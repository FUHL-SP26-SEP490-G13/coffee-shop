const NewsService = require("../services/NewsService");
const response = require("../utils/response");

class NewsController {
  async create(req, res, next) {
    try {
      const file = req.file;

      const data = {
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        tag: req.body.tag || null,
        thumbnail: file ? file.path : null,
      };

      const news = await NewsService.createNews(data, req.user.id);
      //const news = await NewsService.createNews(data, 1);

      return response.success(res, news, "Tạo tin thành công", 201);
    } catch (error) {
      if (error.message === "Tiêu đề bài viết đã tồn tại") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "title",
              message: "Tiêu đề bài viết đã tồn tại",
            },
          ],
        });
      }

      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 6 } = req.query;

      const news = await NewsService.getAllPublished({
        page: parseInt(page),
        limit: parseInt(limit),
      });

      return response.success(res, news, "Lấy tin thành công");
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req, res, next) {
    try {
      const news = await NewsService.getDetailBySlug(req.params.slug);
      return response.success(res, news, "Lấy chi tiết thành công");
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(req, res, next) {
    try {
      const news = await NewsService.getFeatured(3);
      return response.success(res, news);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await NewsService.deleteNews(req.params.id);
      return response.success(res, null, "Đã xóa");
    } catch (error) {
      next(error);
    }
  }

  async getAllAdmin(req, res, next) {
    try {
      const { page = 1, limit = 7, keyword = "" } = req.query;

      const news = await NewsService.getAllAdmin({
        page: parseInt(page),
        limit: parseInt(limit),
        keyword,
      });

      return response.success(res, news);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const news = await NewsService.getById(req.params.id);
      return response.success(res, news);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const file = req.file;

      await NewsService.updateNews(req.params.id, {
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
        tag: req.body.tag || null,
        thumbnail: file ? file.path : undefined,
      });

      return response.success(res, null, "Cập nhật thành công");
    } catch (error) {
      if (error.message === "Tiêu đề bài viết đã tồn tại") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: [
            {
              field: "title",
              message: "Tiêu đề bài viết đã tồn tại",
            },
          ],
        });
      }

      next(error);
    }
  }

  async getRelated(req, res, next) {
    try {
      const { tag, excludeId } = req.query;

      const news = await NewsService.getRelated(tag, excludeId);

      return response.success(res, news);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NewsController();
