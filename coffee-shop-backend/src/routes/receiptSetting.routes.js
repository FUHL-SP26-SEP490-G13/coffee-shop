const express = require("express");
const router = express.Router();

const controller = require("../controllers/ReceiptSettingController");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/authorize");
const { ROLES_STRING } = require("../config/constants");
const validate = require("../middlewares/validate");
const upload = require("../middlewares/upload");
const parseJsonFields = require("../middlewares/parseJsonFields");
const {
  upsertReceiptSettingSchema,
} = require("../validators/receiptSettingValidator");

router.get("/", controller.getActive.bind(controller));

router.put(
  "/admin",
  authenticate,
  authorize([ROLES_STRING.MANAGER]),
  upload.single("logo"),
  parseJsonFields(["header_lines", "footer_lines"]),
  validate(upsertReceiptSettingSchema),
  controller.upsertActive.bind(controller)
);

/**
 * @swagger
 * tags:
 *   - name: Receipt Setting API
 *     description: Auto-generated endpoints documentation
 */

/**
 * @swagger
 * /receipt-settings/:
 *   get:
 *     tags:
 *       - Receipt Setting API
 *     summary: Get resource
 *     description: Auto-generated documentation for existing route
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /receipt-settings/admin:
 *   put:
 *     tags:
 *       - Receipt Setting API
 *     summary: Update admin
 *     description: Auto-generated documentation for existing route
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

module.exports = router;
