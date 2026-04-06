const express = require("express");
const router = express.Router();
const ReviewController = require("../controllers/ReviewController");
const { authenticate } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

router.get("/product/:productId", ReviewController.getByProductId);
router.get("/me/:productId", authenticate, ReviewController.getMyReview);
router.post("/", authenticate, upload.array("images", 4), ReviewController.createOrUpdate);

router.get("/public", ReviewController.getPublicReviews);
router.get("/", authenticate, ReviewController.getAll);

module.exports = router;
