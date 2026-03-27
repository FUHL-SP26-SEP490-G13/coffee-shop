const express = require("express");
const router = express.Router();
const qrOrderController = require("../controllers/QrOrderController");

// /api/qr-order
router.post("/checkout", qrOrderController.checkout);

module.exports = router;
