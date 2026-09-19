const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');
const { client, database, connectToMongoDB } = require('./config/db');
const { authenticate, requireAdmin } = require('./middleware/auth');
const { asyncHandler, HttpError } = require('./utils/http');
const app = express();
app.use(require('cors')());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/v1/user', require('./router/user'));
app.use('/api/v1/course', require('./router/course'));
const imageTypes = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) { cb(imageTypes[file.mimetype] ? null : new HttpError(400, '仅支持 JPG、PNG、WebP、GIF 图片'), !!imageTypes[file.mimetype]); }
});
app.post('/upload', authenticate, requireAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, '请选择图片');
  const name = randomUUID() + imageTypes[req.file.mimetype];
  let url;
  if (process.env.UPLOAD_DRIVER !== 'minio') throw new HttpError(503, '服务必须配置 MinIO 上传');
  if (!process.env.MINIO_PUBLIC_URL) throw new HttpError(503, '请配置永久可访问的 MINIO_PUBLIC_URL');
  const Minio = require('minio');
  const minio = new Minio.Client({ endPoint: process.env.MINIO_HOST, port: Number(process.env.MINIO_PORT || 9000), useSSL: process.env.MINIO_SSL === 'true', accessKey: process.env.MINIO_ACCESS_KEY, secretKey: process.env.MINIO_SECRET_KEY });
  const bucket = process.env.MINIO_BUCKET;
  await minio.putObject(bucket, name, req.file.buffer, req.file.size, { 'Content-Type': req.file.mimetype });
  url = `${process.env.MINIO_PUBLIC_URL.replace(/\/$/, '')}/${name}`;
  res.send({ code: 0, data: { message: '上传成功', url } });
}));
app.use((err, req, res, next) => {
  const status = err.status || (err.isJoi || err.name === 'ValidationError' || err instanceof multer.MulterError ? 400 : 500);
  res.status(status).send({ code: 1, message: status >= 500 ? '服务暂时不可用，请稍后重试' : err.message });
});
async function start() {
  await connectToMongoDB();
  // Older versions stored loans in a separate collection. Never silently hide those loans.
  if (await database.collection('list').findOne({ del: 0 })) throw new Error('检测到旧版未归还记录，请先迁移 list 到 book.borrowings 后启动');
  const port = Number(process.env.PORT || 3000);
  return app.listen(port, () => console.log(`服务启动在 http://127.0.0.1:${port}`));
}
if (require.main === module) start().catch(async () => { console.error('启动失败：请检查数据库配置和旧版借阅记录'); await client.close(); process.exitCode = 1; });
module.exports = { app, start };
