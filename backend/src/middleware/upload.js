const multer = require('multer');
const cloudinary = require('../config/cloudinary');

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

// Custom multer storage engine: pipes the incoming multipart stream straight
// into Cloudinary's upload stream instead of buffering the whole file into
// process memory first (multer.memoryStorage() would hold up to 25MB per
// concurrent upload in RAM before it even starts sending to Cloudinary).
// This is an I/O-bound hand-off, not CPU work, so it belongs on the event
// loop as a stream pipe — worker_threads would add complexity for a problem
// that isn't CPU-bound and wouldn't be allowed to touch req/res anyway.
class CloudinaryStreamStorage {
  _handleFile(req, file, cb) {
    const category = categoryFor(file.mimetype);
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'multimedia-search', resource_type: cloudinaryResourceType(category) },
      (err, result) => {
        if (err) {
          const uploadError = new Error(`Cloudinary upload failed: ${err.message}`);
          uploadError.statusCode = 502;
          return cb(uploadError);
        }
        cb(null, { url: result.secure_url, publicId: result.public_id, size: result.bytes });
      }
    );

    file.stream.on('error', (err) => uploadStream.destroy(err));
    file.stream.pipe(uploadStream);
  }

  _removeFile(req, file, cb) {
    cb(null);
  }
}

const fileFilter = (req, file, cb) => {
  const category = categoryFor(file.mimetype);
  if (!category) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', `Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
};

const upload = multer({
  storage: new CloudinaryStreamStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

module.exports = { upload, categoryFor, cloudinaryResourceType, MAX_FILE_SIZE };
