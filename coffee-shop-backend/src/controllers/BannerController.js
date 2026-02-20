const bannerService = require("../services/BannerService");

class BannerController {
  async getActive(req, res) {
    const data = await bannerService.getActive();
    res.json({ success: true, data });
  }

  async getAll(req, res) {
    const data = await bannerService.getAll();
    res.json({ success: true, data });
  }

  async create(req, res) {
    await bannerService.create(req.body);
    res.json({ success: true, message: "Tạo banner thành công" });
  }

  async update(req, res) {
    await bannerService.update(req.params.id, req.body);
    res.json({ success: true, message: "Cập nhật banner thành công" });
  }
}

module.exports = new BannerController();
