const NewsRepository = require("../repositories/NewsRepository");
const slugify = require("slugify");

class NewsService {
  async createNews(data, userId) {
    const slug = slugify(data.title, { lower: true, strict: true });

    return NewsRepository.create({
      ...data,
      slug,
      created_by: userId,
    });
  }

  async getAllPublished() {
    return NewsRepository.findPublished();
  }

  async getDetailBySlug(slug) {
    const news = await NewsRepository.findBySlug(slug);
    if (!news) throw new Error("Tin không tồn tại");
    return news;
  }

  async getFeatured(limit = 3) {
    return NewsRepository.findFeatured(limit);
  }
}

module.exports = new NewsService();
