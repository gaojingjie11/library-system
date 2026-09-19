const { randomUUID } = require('crypto');
const Minio = require('minio');
const { HttpError } = require('../utils/http');
const { imageTypes } = require('../middleware/upload');

function createMinioClient() {
  if (process.env.UPLOAD_DRIVER !== 'minio') throw new HttpError(503, '服务必须配置 MinIO 上传');
  if (!process.env.MINIO_PUBLIC_URL) throw new HttpError(503, '请配置永久可访问的 MINIO_PUBLIC_URL');
  if (!process.env.MINIO_HOST || !process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
    throw new HttpError(503, '请完整配置 MinIO 连接信息');
  }
  return new Minio.Client({
    endPoint: process.env.MINIO_HOST,
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: process.env.MINIO_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
  });
}

function publicBase() {
  return new URL(process.env.MINIO_PUBLIC_URL).toString().replace(/\/$/, '');
}

function managedObjectKey(value) {
  if (typeof value !== 'string' || !value || value === '/avatar.svg') return null;
  let base;
  try { base = new URL(publicBase()); } catch { return null; }
  let url;
  try { url = new URL(value); } catch { return null; }
  if (url.origin !== base.origin) return null;
  const basePath = base.pathname.replace(/\/$/, '');
  if (!url.pathname.startsWith(`${basePath}/`)) return null;
  const key = decodeURIComponent(url.pathname.slice(basePath.length + 1));
  return key && !key.includes('..') ? key : null;
}

function createStorage({ getClient = createMinioClient } = {}) {
  async function uploadImage(file) {
    if (!file || !imageTypes[file.mimetype]) throw new HttpError(400, '请选择有效图片');
    const client = getClient();
    const name = randomUUID() + imageTypes[file.mimetype];
    const bucket = process.env.MINIO_BUCKET;
    if (!bucket) throw new HttpError(503, '请配置 MINIO_BUCKET');
    await client.putObject(bucket, name, file.buffer, file.size, { 'Content-Type': file.mimetype });
    return `${publicBase()}/${name}`;
  }

  async function deleteManagedImage(url) {
    const key = managedObjectKey(url);
    if (!key) return false;
    const bucket = process.env.MINIO_BUCKET;
    if (!bucket) return false;
    await getClient().removeObject(bucket, key);
    return true;
  }

  return { uploadImage, deleteManagedImage };
}

const storage = createStorage();
module.exports = { ...storage, createStorage, managedObjectKey };
