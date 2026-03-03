const NewsRepository = require("../repositories/NewsRepository");
const cloudinary = require("../config/cloudinary");
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

    await NewsRepository.increaseView(news.id);

    return news;
  }

  async getFeatured(limit = 3) {
    return NewsRepository.findFeatured(limit);
  }

  async createNews(data, userId, files = []) {
    const slug = slugify(data.title, { lower: true, strict: true });

    const news = await NewsRepository.create({
      ...data,
      slug,
      created_by: userId,
    });

    if (files.length) {
      await NewsRepository.insertImages(news.id, files);
    }

    return news;
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

  async updateNews(
    id,
    { title, summary, content, newFiles = [], deleteImageIds = [] }
  ) {
    // update nội dung
    await NewsRepository.updateById(id, {
      title,
      summary,
      content,
    });

    // xoá ảnh
    if (deleteImageIds.length) {
      const deleted = await NewsRepository.deleteImagesByIds(deleteImageIds);

      for (const img of deleted) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }

    // thêm ảnh mới
    if (newFiles.length) {
      await NewsRepository.insertImages(id, newFiles);
    }

    return true;
  }

  async getById(id) {
    const news = await NewsRepository.findOne({ id });
    if (!news) throw new Error("Không tìm thấy bài viết");

    const images = await NewsRepository.getImagesByNewsId(id);
    return { ...news, images };
  }
}

module.exports = new NewsService();
