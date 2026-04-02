const express = require("express");
const router = express.Router();
const AiController = require("../controllers/AiController");

router.post("/chat", AiController.chat);

module.exports = router;