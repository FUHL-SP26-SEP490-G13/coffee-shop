
console.log("🔥 NEWS ROUTES LOADED FROM:", __filename);


const express = require('express');
const router = express.Router();

const NewsController = require('../controllers/NewsController');
const { authenticate } = require('../middlewares/auth');
const { isManager } = require('../middlewares/authorize');

// CỤ THỂ TRƯỚC
router.get('/featured', NewsController.getFeatured);

// Public
router.get('/', NewsController.getAll);
router.get('/:slug', NewsController.getDetail);

// Manager only
router.post('/', authenticate, isManager, NewsController.create);

module.exports = router;
