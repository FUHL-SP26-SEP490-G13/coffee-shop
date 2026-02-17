const NewsRepository = require("../repositories/NewsRepository");
const slugify = require("slugify");

class NewsService {
  async getAllPublished({ page = 1, limit = 6 }) {
    const offset = (page - 1) * limit;

    const news = await NewsRepository.findPublishedPaginated(limit, offset);
    const total = await NewsRepository.countAll();

    return {
      items: news,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDetailBySlug(slug) {
    const news = await NewsRepository.findBySlug(slug);
    if (!news) throw new Error("Tin không tồn tại");
    return news;
  }

  async getFeatured(limit = 3) {
    return NewsRepository.findFeatured(limit);
  }

  async createNews(data, userId) {
    const slug = slugify(data.title, { lower: true, strict: true });

    return NewsRepository.create({
      ...data,
      slug,
      created_by: userId,
    });
  }

  async getAllAdmin({ page = 1, limit = 10, title = "" }) {
    const offset = (page - 1) * limit;

    const items = await NewsRepository.findAllAdminPaginated(
      limit,
      offset,
      title
    );

    const total = await NewsRepository.countAll(title);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteNews(id) {
    return NewsRepository.deleteById(id);
  }

  async updateNews(id, data) {
    return NewsRepository.updateById(id, data);
  }

  async getById(id) {
    const news = await NewsRepository.findOne({ id });
    if (!news) throw new Error("Không tìm thấy bài viết");
    return news;
  }
}

module.exports = new NewsService();
