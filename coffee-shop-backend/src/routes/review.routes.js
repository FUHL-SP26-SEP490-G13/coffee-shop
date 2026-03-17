const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/ReviewController");
const { authenticate } = require("../middlewares/auth");

router.get("/product/:productId", ReviewController.getByProductId);
router.get("/me/:productId", authenticate, ReviewController.getMyReview);
router.post("/", authenticate, ReviewController.createOrUpdate);

router.get("/", authenticate, ReviewController.getAll);

module.exports = router;
