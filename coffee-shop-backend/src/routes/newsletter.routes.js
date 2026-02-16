const express = require("express");
const router = express.Router();
const controller = require("../controllers/NewsletterController");

router.post("/", controller.subscribe.bind(controller));

module.exports = router;
