const express = require("express");
const router = express.Router();

const ProductController = require("../controllers/ProductController");

// Public route - customer homepage
router.get("/", ProductController.getAll);

module.exports = router;
