const NewsService = require("../services/NewsService");
const response = require("../utils/response");

class NewsController {
  async create(req, res, next) {
    try {
      const news = await NewsService.createNews(req.body, req.user.id);
      return response.success(res, news, "Tạo tin thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const news = await NewsService.getAllPublished();
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
}

module.exports = new NewsController();
