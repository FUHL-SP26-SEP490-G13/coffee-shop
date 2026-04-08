const express = require('express');
const router = express.Router();

const CartController = require('../controllers/CartController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, CartController.getMyCart);
router.put('/sync', authenticate, CartController.replaceCart);
router.post('/merge', authenticate, CartController.mergeCart);

module.exports = router;