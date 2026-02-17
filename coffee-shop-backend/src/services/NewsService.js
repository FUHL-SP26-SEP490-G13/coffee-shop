const NewsRepository = require("../repositories/NewsRepository");
const slugify = require("slugify");

class NewsService {

  async getAllPublished({ page = 1, limit = 6 }) {
    const offset = (page - 1) * limit;
    console.log("PAGE:", page, "OFFSET:", offset);

    const news = await NewsRepository.findPublishedPaginated(limit, offset);
    const total = await NewsRepository.count({ is_published: 1 });

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

  async getAllAdmin() {
    return NewsRepository.findAllAdmin();
  }

  async deleteNews(id) {
    return NewsRepository.deleteById(id);
  }

  async updateNews(id, data) {
    return NewsRepository.update({ id }, data);
  }

  async createNews(data, userId) {
    const slug = slugify(data.title, { lower: true, strict: true });

    return NewsRepository.create({
      ...data,
      slug,
      created_by: userId,
      is_published: 1,
    });
  }
}

module.exports = new NewsService();
