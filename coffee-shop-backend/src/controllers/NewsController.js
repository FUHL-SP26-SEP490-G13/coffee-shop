const NewsService = require("../services/NewsService");
const response = require("../utils/response");

class NewsController {
  async create(req, res, next) {
    try {
      const thumbnailUrl = req.file?.path || null;

      const news = await NewsService.createNews(
        {
          ...req.body,
          thumbnail: thumbnailUrl,
        },
        req.user.id
      );

      return response.success(res, news, "Tạo tin thành công", 201);
    } catch (error) {
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
      const { page = 1, limit = 10, title = "" } = req.query;

      const news = await NewsService.getAllAdmin({
        page: parseInt(page),
        limit: parseInt(limit),
        title,
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
      const data = {
        title: req.body.title,
        summary: req.body.summary,
        content: req.body.content,
      };

      // CHỈ khi có upload file mới
      if (req.file) {
        data.thumbnail = req.file.path;
      }

      await NewsService.updateNews(req.params.id, data);

      return response.success(res, null, "Cập nhật thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NewsController();
