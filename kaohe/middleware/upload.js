const multer = require('multer');
const { HttpError } = require('../utils/http');

const imageTypes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    cb(imageTypes[file.mimetype] ? null : new HttpError(400, '仅支持 JPG、PNG、WebP、GIF 图片'), !!imageTypes[file.mimetype]);
  }
});

module.exports = { upload, imageTypes };
