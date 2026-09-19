const express = require('express');
const multer = require('multer');
const { client, database, connectToMongoDB } = require('./config/db');
const { authenticate, requireAdmin } = require('./middleware/auth');
const { asyncHandler, HttpError } = require('./utils/http');
const { upload } = require('./middleware/upload');
const { uploadImage } = require('./services/storage');
const app = express();
app.use(require('cors')());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/api/v1/user', require('./router/user'));
app.use('/api/v1/course', require('./router/course'));
app.post('/upload', authenticate, requireAdmin, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, '请选择图片');
  res.send({ code: 0, data: { message: '上传成功', url: await uploadImage(req.file) } });
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
