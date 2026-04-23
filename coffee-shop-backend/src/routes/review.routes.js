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

const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");
const MANAGER_AND_STAFF = [ROLES_STRING.MANAGER, ROLES_STRING.STAFF];
router.post("/admin/:id/reply", authenticate, authorize(MANAGER_AND_STAFF), upload.array("reply_images", 4), ReviewController.replyReview);

module.exports = router;
