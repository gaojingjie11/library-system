const { database } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecretKey } = require('../config/jwtSecretKey');
const { HttpError, text } = require('../utils/http');

exports.registerController = async (req, res) => {
  const userName = text(req.body.userName, '用户名');
  const password = text(req.body.password, '密码');
  const users = database.collection('user');
  if (await users.findOne({ name: userName })) throw new HttpError(409, '该用户名已经存在');
  await users.insertOne({ name: userName, pwd: await bcrypt.hash(password, 10), head_img: '/avatar.svg', identity: 'user', del: 0 });
  res.send({ code: 0, data: { message: '注册成功' } });
};
exports.loginController = async (req, res) => {
  const userName = text(req.body.userName, '用户名');
  const password = text(req.body.password, '密码');
  const user = await database.collection('user').findOne({ name: userName, del: 0 });
  if (!user || !await bcrypt.compare(password, user.pwd)) throw new HttpError(401, '用户名或密码错误');
  const token = jwt.sign({ _id: user._id.toString() }, jwtSecretKey, { expiresIn: '24h', algorithm: 'HS256' });
  res.send({ code: 0, data: { message: '登录成功', token: 'Bearer ' + token } });
};
exports.userInfoController = async (req, res) => {
  const user = req.user;
  res.send({ code: 0, data: { name: user.name, headImg: user.head_img, identity: user.identity, userid: user._id } });
};
