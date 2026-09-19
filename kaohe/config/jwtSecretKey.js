require('./db');
const jwtSecretKey = process.env.JWT_SECRET;
if (!jwtSecretKey || jwtSecretKey.length < 32) {
  throw new Error('请在 .env 配置至少 32 位随机 JWT_SECRET');
}
module.exports = { jwtSecretKey };
