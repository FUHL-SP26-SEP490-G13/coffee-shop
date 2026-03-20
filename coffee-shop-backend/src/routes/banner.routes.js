const express = require("express");
const router = express.Router();

const controller = require("../controllers/BannerController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const upload = require("../middlewares/upload");
const { ROLES_STRING } = require("../config/constants");
const validate = require("../middlewares/validate");
const {
  createBannerSchema,
  updateBannerSchema,
} = require("../validators/bannerValidation");

/**
 * @swagger
 * tags:
 *   - name: Banners
 *     description: Banner management endpoints
 */

/**
 * @swagger
 * /banners/active:
 *   get:
 *     tags:
 *       - Banners
 *     summary: Get active banners
 *     description: Retrieve active banners for display
 *     responses:
 *       200:
 *         description: Active banners retrieved successfully
 */

/**
 * @swagger
 * /banners/active-list:
 *   get:
 *     tags:
 *       - Banners
 *     summary: Get active banners list
 *     description: Retrieve list of active banners with details
 *     responses:
 *       200:
 *         description: Banners list retrieved successfully
 */

/**
 * @swagger
 * /banners/admin:
 *   get:
 *     tags:
 *       - Banners
 *     summary: Get all banners
 *     description: Retrieve all banners (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Banners retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags:
 *       - Banners
 *     summary: Create banner
 *     description: Create a new banner (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /banners/admin/{id}:
 *   put:
 *     tags:
 *       - Banners
 *     summary: Update banner
 *     description: Update an existing banner (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags:
 *       - Banners
 *     summary: Delete banner
 *     description: Delete a banner (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

// PUBLIC
router.get("/active", controller.getActive.bind(controller));
router.get("/active-list", controller.getActiveList.bind(controller));

// ADMIN
router.get(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  controller.getAll.bind(controller)
);

router.post(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  upload.single("image"),
  validate(createBannerSchema),
  controller.create.bind(controller)
);

router.put(
  "/admin/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  upload.single("image"),
  validate(updateBannerSchema),
  controller.update.bind(controller)
);

router.delete(
  "/admin/:id",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  controller.delete.bind(controller)
);

module.exports = router;
