const { ObjectId } = require('mongodb');
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
function objectId(value, label = 'ID') {
  if (typeof value !== 'string' || !/^[a-fA-F0-9]{24}$/.test(value)) throw new HttpError(400, `无效的${label}`);
  return new ObjectId(value);
}
function pagination(page = '1', size = '5') {
  const p = Number(page), s = Number(size);
  if (!Number.isSafeInteger(p) || p < 1 || !Number.isSafeInteger(s) || s < 1 || s > 100) throw new HttpError(400, '无效的分页参数');
  return { page: p, size: s, skip: (p - 1) * s };
}
function text(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new HttpError(400, `${label}不能为空`);
  return value.trim();
}
module.exports = { HttpError, asyncHandler, objectId, pagination, text };
