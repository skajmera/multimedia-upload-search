const express = require('express');
const {
  uploadFile,
  searchFiles,
  getFileById,
  listMyFiles,
  deleteFile,
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

/**
 * @openapi
 * /files/upload:
 *   post:
 *     summary: Upload a multimedia file (image, video, audio, PDF)
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *               fileName: { type: string }
 *               tags: { type: string, description: "Comma-separated tags" }
 *     responses:
 *       201: { description: File uploaded and metadata stored }
 *       400: { description: No file provided or unsupported type }
 */
router.post('/upload', protect, upload.single('file'), uploadFile);

/**
 * @openapi
 * /files/search:
 *   get:
 *     summary: Search uploaded files, ranked by relevance
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Keyword to match against file name and tags
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [image, video, audio, pdf] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [relevance, date, views], default: relevance }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Ranked list of matching files }
 */
router.get('/search', protect, searchFiles);

/**
 * @openapi
 * /files/mine:
 *   get:
 *     summary: List the current user's uploaded files
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Files owned by the current user }
 */
router.get('/mine', protect, listMyFiles);

/**
 * @openapi
 * /files/{id}:
 *   get:
 *     summary: Get a file by id (increments view count)
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File metadata }
 *       404: { description: File not found }
 *   delete:
 *     summary: Delete a file (owner only)
 *     tags: [Files]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: File deleted }
 *       403: { description: Not the owner }
 *       404: { description: File not found }
 */
router.get('/:id', protect, getFileById);
router.delete('/:id', protect, deleteFile);

module.exports = router;
