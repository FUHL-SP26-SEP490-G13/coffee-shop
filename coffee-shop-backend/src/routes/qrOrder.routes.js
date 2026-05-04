const express = require("express");
const router = express.Router();
const qrOrderController = require("../controllers/QrOrderController");

// /api/qr-order
router.post("/checkout", qrOrderController.checkout);          // Cash payment - save order immediately
router.post("/validate", qrOrderController.validateCart);      // PayOS step 1 - validate cart, return totals (no DB)
router.post("/confirm", qrOrderController.confirmAfterPayment); // PayOS step 2 - save order after payment confirmed

module.exports = router;
