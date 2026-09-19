const jwt = require('jsonwebtoken');
const { database } = require('../config/db');
const { jwtSecretKey } = require('../config/jwtSecretKey');
const { asyncHandler, objectId, HttpError } = require('../utils/http');
const authenticate = asyncHandler(async (req, res, next) => {
  const match = /^Bearer ([^ ]+)$/i.exec(req.headers.authorization || '');
  if (!match) throw new HttpError(401, '身份认证失败');
  let claims, id;
  try {
    claims = jwt.verify(match[1], jwtSecretKey, { algorithms: ['HS256'] });
    id = objectId(claims._id);
  } catch { throw new HttpError(401, '身份认证失败'); }
  const user = await database.collection('user').findOne({ _id: id, del: 0 }, { projection: { _id: 1, name: 1, nickname: 1, head_img: 1, identity: 1 } });
  if (!user) throw new HttpError(401, '身份认证失败');
  req.user = user;
  next();
});
function requireAdmin(req, res, next) {
  if (req.user?.identity !== 'admin') return next(new HttpError(403, '需要管理员权限'));
  next();
}
module.exports = { authenticate, requireAdmin };
