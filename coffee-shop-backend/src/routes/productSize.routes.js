const express = require('express');
const router = express.Router();
const ProductSizeController = require('../controllers/ProductSizeController');
const { authenticate } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const { productIdSchema, productSizeIdSchema } = require('../validators/productSizeValidator');

// Lấy tất cả size của 1 sản phẩm
router.get('/product/:productId', validate(productIdSchema, 'params'), ProductSizeController.getByProductId);

// Lấy 1 size theo id
router.get('/:id', validate(productSizeIdSchema, 'params'), ProductSizeController.getById);

// Thêm mới size cho sản phẩm
router.post('/', authenticate, authorize(['admin']), ProductSizeController.create);

// Cập nhật size
router.put('/:id', authenticate, authorize(['admin']), ProductSizeController.update);

// Xóa size
router.delete('/:id', authenticate, authorize(['admin']), ProductSizeController.delete);

module.exports = router;
