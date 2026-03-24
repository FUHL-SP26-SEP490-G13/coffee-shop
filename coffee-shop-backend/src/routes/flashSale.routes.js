const express = require("express");
const router = express.Router();
const FlashSaleController = require("../controllers/FlashSaleController");
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { ROLES_STRING } = require('../config/constants');

// Public route
router.get("/current", FlashSaleController.getCurrentActive);

// Admin routes
router.get("/admin/list", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.getAll);
router.post("/admin", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.create);
router.get("/admin/:id", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.getById);
router.put("/admin/:id", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.update);
router.delete("/admin/:id", authenticate, authorize([ROLES_STRING.MANAGER]), FlashSaleController.delete);

module.exports = router;
