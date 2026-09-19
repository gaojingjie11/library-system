const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const Minio = require('minio');
const { client, database, connectToMongoDB } = require('../config/db');

const bucket = process.env.MINIO_BUCKET || 'lab-library';
const publicBase = (process.env.MINIO_PUBLIC_URL || '').replace(/\/$/, '');
const cover = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1sAAAAASUVORK5CYII=', 'base64');
const avatar = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="40" fill="#e5e7eb"/><circle cx="40" cy="29" r="14" fill="#64748b"/><path d="M14 74a26 26 0 0 1 52 0" fill="#64748b"/></svg>');
const minio = new Minio.Client({
  endPoint: process.env.MINIO_HOST,
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

async function ensurePublicBucket() {
  if (!(await minio.bucketExists(bucket))) await minio.makeBucket(bucket, 'us-east-1');
  await minio.setBucketPolicy(bucket, JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Principal: { AWS: ['*'] }, Action: ['s3:GetObject'], Resource: [`arn:aws:s3:::${bucket}/*`] }],
  }));
}

async function uploadCover(key) {
  await minio.putObject(bucket, key, cover, cover.length, { 'Content-Type': 'image/png' });
  return `${publicBase}/${key}`;
}

async function uploadAvatar() {
  await minio.putObject(bucket, 'avatar.svg', avatar, avatar.length, { 'Content-Type': 'image/svg+xml' });
  return `${publicBase}/avatar.svg`;
}

async function ensureUser(name, password, identity, avatar) {
  const users = database.collection('user');
  const existing = await users.findOne({ name, del: 0 });
  if (existing) return existing;
  const result = await users.insertOne({ name, pwd: await bcrypt.hash(password, 10), identity, head_img: avatar, del: 0 });
  return { _id: result.insertedId, name, identity, del: 0 };
}

async function main() {
  if (!process.env.ADMIN_PASSWORD || !process.env.USER_PASSWORD) throw new Error('请通过环境变量提供 ADMIN_PASSWORD 和 USER_PASSWORD');
  if (!publicBase) throw new Error('请配置 MINIO_PUBLIC_URL');
  await connectToMongoDB();
  await ensurePublicBucket();
  const coverKeys = ['cover-library.jpg', 'cover-node.jpg', 'cover-security.jpg', 'cover-database.jpg'];
  const covers = [];
  for (const key of coverKeys) covers.push(await uploadCover(key));
  const avatar = await uploadAvatar();
  const admin = await ensureUser(process.env.ADMIN_NAME || 'admin', process.env.ADMIN_PASSWORD, 'admin', avatar);
  const reader = await ensureUser(process.env.USER_NAME || 'reader', process.env.USER_PASSWORD, 'user', avatar);
  const books = database.collection('book');
  const samples = [
    ['Vue 3 实战', '尤雨溪', '前端', 9.2, covers[0]],
    ['Node.js 服务端开发', 'Ryan Dahl', '后端', 8.8, covers[1]],
    ['Web 安全入门', '安全研究组', '安全', 9.0, covers[2]],
    ['MongoDB 权威指南', 'Kristina Chodorow', '数据库', 8.6, covers[3]],
  ];
  for (const [title, outhor, category, point, course_img] of samples) {
    await books.updateOne({ title }, { $setOnInsert: { title, outhor, category, point, course_img, num: 10, del: 0, borrowings: [] } }, { upsert: true });
  }
  const sampleBook = await books.findOne({ title: samples[0][0] });
  if (!(await books.findOne({ _id: sampleBook._id, 'borrowings.userid': reader._id, 'borrowings.del': 0 }))) {
    await books.updateOne({ _id: sampleBook._id, num: { $gt: 0 } }, { $inc: { num: -1 }, $push: { borrowings: { _id: require('mongodb').ObjectId.createFromTime(Math.floor(Date.now() / 1000)), userid: reader._id, del: 0, borrowTime: new Date() } } });
  }
  console.log(JSON.stringify({ bucket, publicBase, admin: admin.name, reader: reader.name, books: samples.length }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(async () => { await client.close(); });
