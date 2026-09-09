const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['image', 'video', 'audio', 'pdf'],
      required: true,
    },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

fileSchema.index({ fileName: 'text', tags: 'text' });

module.exports = mongoose.model('File', fileSchema);
