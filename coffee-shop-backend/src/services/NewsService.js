const NewsRepository = require("../repositories/NewsRepository");
const cloudinary = require("../config/cloudinary");
const slugify = require("slugify");
const ErrorResponse = require("../utils/ErrorResponse");

class NewsService {
  async generateUniqueSlug(title) {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    while (await NewsRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    return slug;
  }

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
    if (!news) throw new ErrorResponse(404, "Tin không tồn tại");

    await NewsRepository.increaseView(news.id);

    return news;
  }

  async getFeatured(limit = 3) {
    return NewsRepository.findFeatured(limit);
  }

  async createNews(data, userId) {
    const existedTitle = await NewsRepository.findByTitle(data.title);
    if (existedTitle) {
      throw new ErrorResponse(400, "Tiêu đề bài viết đã tồn tại");
    }

    const slug = await this.generateUniqueSlug(data.title);

    const news = await NewsRepository.create({
      ...data,
      slug,
      created_by: userId,
    });

    return news;
  }

  async getAllAdmin({ page = 1, limit = 7, keyword = "" }) {
    const offset = (page - 1) * limit;

    const items = await NewsRepository.findAllAdminPaginated(
      limit,
      offset,
      keyword
    );

    const total = await NewsRepository.countAll(keyword);

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

  async updateNews(id, { title, summary, content, tag, thumbnail }) {
    const existedTitle = await NewsRepository.findByTitleExcludeId(title, id);
    if (existedTitle) {
      throw new ErrorResponse(400, "Tiêu đề bài viết đã tồn tại");
    }

    await NewsRepository.updateById(id, {
      title,
      summary,
      content,
      tag,
      thumbnail,
    });

    return true;
  }

  async getById(id) {
    const news = await NewsRepository.findOne({ id });
    if (!news) throw new ErrorResponse(404, "Không tìm thấy bài viết");

    return news;
  }

  async getRelated(tag, excludeId) {
    if (!tag) return [];
    return NewsRepository.findRelatedByTag(tag, excludeId, 3);
  }
}

module.exports = new NewsService();
