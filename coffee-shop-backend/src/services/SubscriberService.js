const subscriberRepository = require("../repositories/SubscriberRepository");

class SubscriberService {
  async subscribe(email) {
    const existed = await subscriberRepository.findByEmail(email);

    if (existed) {
      throw new Error("Email đã tồn tại");
    }

    return subscriberRepository.create(email);
  }

  async getAll() {
    return subscriberRepository.findAll();
  }

  async delete(id) {
    return subscriberRepository.delete(id);
  }
}

module.exports = new SubscriberService();
