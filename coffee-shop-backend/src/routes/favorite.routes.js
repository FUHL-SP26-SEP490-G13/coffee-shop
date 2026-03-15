const express = require("express");
const router = express.Router();
const FavoriteController = require("../controllers/FavoriteController");
const { authenticate } = require("../middlewares/auth");

router.get("/", authenticate, FavoriteController.getMyFavorites);
router.get("/check/:productId", authenticate, FavoriteController.checkFavorite);
router.post("/", authenticate, FavoriteController.addFavorite);
router.delete("/:productId", authenticate, FavoriteController.removeFavorite);

module.exports = router;
