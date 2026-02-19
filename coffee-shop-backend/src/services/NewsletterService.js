const newsletterRepository = require("../repositories/NewsletterRepository");

class NewsletterService {
  async subscribe(email) {
    const existed = await newsletterRepository.findByEmail(email);

    if (existed) {
      throw new Error("Email đã tồn tại");
    }

    return newsletterRepository.create(email);
  }

  async getAll() {
    return newsletterRepository.findAll();
  }

  async delete(id) {
    return newsletterRepository.delete(id);
  }
}

module.exports = new NewsletterService();
