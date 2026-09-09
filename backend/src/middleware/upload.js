const multer = require('multer');

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const MIME_TO_CATEGORY = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'application/pdf': 'pdf',
};

function categoryFor(mimetype) {
  return MIME_TO_CATEGORY[mimetype];
}

// Cloudinary resource_type only distinguishes image/video/raw; audio is
// uploaded as "video" (Cloudinary's category for anything with an audio track).
function cloudinaryResourceType(category) {
  if (category === 'video' || category === 'audio') return 'video';
  if (category === 'pdf') return 'raw';
  return 'image';
}

const fileFilter = (req, file, cb) => {
  const category = categoryFor(file.mimetype);
  if (!category) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = { upload, categoryFor, cloudinaryResourceType, MAX_FILE_SIZE };
