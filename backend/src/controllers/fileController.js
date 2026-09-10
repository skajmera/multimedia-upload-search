const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const File = require('../models/File');
const { categoryFor, cloudinaryResourceType } = require('../middleware/upload');

function parseTags(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file provided (use the "file" form field)');
  }

  // req.file.url / .publicId / .size come from CloudinaryStreamStorage
  // (src/middleware/upload.js), which streams the upload directly to
  // Cloudinary rather than buffering it here first.
  const file = await File.create({
    owner: req.user._id,
    fileName: req.body.fileName || req.file.originalname,
    url: req.file.url,
    publicId: req.file.publicId,
    fileType: categoryFor(req.file.mimetype),
    mimeType: req.file.mimetype,
    size: req.file.size,
    tags: parseTags(req.body.tags),
  });

  res.status(201).json({ success: true, file });
});

// Relevance ranking: blends keyword-match score, recency, and popularity
// so a strong text match with more views/newer upload date ranks higher.
const searchFiles = asyncHandler(async (req, res) => {
  const { query, type, page = 1, limit = 20, sort = 'relevance' } = req.query;

  const filter = {};
  if (type) filter.fileType = type;
  if (query) filter.$text = { $search: query };

  const projection = query ? { score: { $meta: 'textScore' } } : {};

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  let results = await File.find(filter, projection)
    .populate('owner', 'name email')
    .lean();

  const now = Date.now();
  const maxViews = Math.max(1, ...results.map((f) => f.viewCount || 0));

  results = results.map((f) => {
    const textScore = query ? f.score || 0 : 0;
    const recencyDays = (now - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = 1 / (1 + recencyDays / 30); // decays over ~30 days
    const popularityScore = (f.viewCount || 0) / maxViews;

    const relevance = query
      ? textScore * 0.6 + popularityScore * 0.25 + recencyScore * 0.15
      : popularityScore * 0.5 + recencyScore * 0.5;

    return { ...f, relevance };
  });

  if (sort === 'date') {
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sort === 'views') {
    results.sort((a, b) => b.viewCount - a.viewCount);
  } else {
    results.sort((a, b) => b.relevance - a.relevance);
  }

  const total = results.length;
  const start = (pageNum - 1) * limitNum;
  const paginated = results.slice(start, start + limitNum);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    results: paginated,
  });
});

const getFileById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid file id');
  }

  const file = await File.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewCount: 1 } },
    { new: true }
  ).populate('owner', 'name email');

  if (!file) {
    throw new ApiError(404, 'File not found');
  }

  res.json({ success: true, file });
});

const listMyFiles = asyncHandler(async (req, res) => {
  const files = await File.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, files });
});

const deleteFile = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, 'Invalid file id');
  }

  const file = await File.findById(req.params.id);
  if (!file) {
    throw new ApiError(404, 'File not found');
  }
  if (String(file.owner) !== String(req.user._id)) {
    throw new ApiError(403, 'Not authorized to delete this file');
  }

  await cloudinary.uploader.destroy(file.publicId, {
    resource_type: cloudinaryResourceType(file.fileType),
  });
  await file.deleteOne();

  res.json({ success: true, message: 'File deleted' });
});

module.exports = { uploadFile, searchFiles, getFileById, listMyFiles, deleteFile };
