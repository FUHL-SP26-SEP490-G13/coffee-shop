const newsletterRepository = require("../repositories/NewsletterRepository");
const ErrorResponse = require("../utils/ErrorResponse");

class NewsletterService {
  async subscribe(email) {
    const existed = await newsletterRepository.findByEmail(email);

    if (existed) {
      throw new ErrorResponse(400, "Email đã tồn tại");
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
