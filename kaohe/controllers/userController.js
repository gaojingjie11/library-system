const { database } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecretKey } = require('../config/jwtSecretKey');
const { HttpError, text } = require('../utils/http');
const { deleteManagedImage, managedObjectKey, uploadImage } = require('../services/storage');

const NAME_TAKEN = '该用户名已经存在';
exports.registerController = async (req, res) => {
  const userName = text(req.body.userName, '用户名');
  const password = text(req.body.password, '密码');
  const users = database.collection('user');
  // 只查活跃账号：已删除的用户名可以重新注册
  if (await users.findOne({ name: userName, del: 0 })) throw new HttpError(409, NAME_TAKEN);
  const document = { name: userName, pwd: await bcrypt.hash(password, 10), head_img: '/avatar.svg', identity: 'user', del: 0 };
  try {
    await users.insertOne(document);
  } catch (error) {
    // 上面的查重和插入分两步，并发时都会通过。真正的唯一性由 user_name_active_unique 索引保证
    if (error.code === 11000) throw new HttpError(409, NAME_TAKEN);
    throw error;
  }
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
  res.send({ code: 0, data: { name: user.name, nickname: user.nickname || user.name, headImg: user.head_img || '/avatar.svg', identity: user.identity, userid: user._id } });
};
exports.avatarController = async (req, res) => {
  if (!req.file) throw new HttpError(400, '请选择图片');
  res.send({ code: 0, data: { message: '上传成功', url: await uploadImage(req.file) } });
};
exports.updateProfileController = async (req, res) => {
  const body = req.body || {};
  const update = {};
  if (Object.prototype.hasOwnProperty.call(body, 'nickname')) {
    const nickname = text(body.nickname, '昵称');
    if (nickname.length > 30) throw new HttpError(400, '昵称不能超过 30 个字符');
    update.nickname = nickname;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'password')) {
    const password = text(body.password, '密码');
    if (!/^\S{6,12}$/.test(password)) throw new HttpError(400, '密码必须为 6 到 12 个非空白字符');
    update.pwd = await bcrypt.hash(password, 10);
  }
  if (Object.prototype.hasOwnProperty.call(body, 'headImg')) {
    if (body.headImg !== '/avatar.svg' && !managedObjectKey(body.headImg)) throw new HttpError(400, '头像地址无效');
    update.head_img = body.headImg;
  }
  if (!Object.keys(update).length) throw new HttpError(400, '没有提供任何需要更新的资料');
  const users = database.collection('user');
  const current = await users.findOne({ _id: req.user._id, del: 0 }, { projection: { head_img: 1 } });
  if (!current) throw new HttpError(404, '未找到对应的用户');
  const result = await users.updateOne({ _id: req.user._id, del: 0 }, { $set: update });
  if (!result.matchedCount) throw new HttpError(404, '未找到对应的用户');
  if (update.head_img && update.head_img !== current.head_img) {
    try { await deleteManagedImage(current.head_img); } catch (error) { console.warn('旧头像清理失败', error.message); }
  }
  const saved = await users.findOne({ _id: req.user._id, del: 0 }, { projection: { _id: 1, name: 1, nickname: 1, head_img: 1, identity: 1 } });
  res.send({ code: 0, data: { name: saved.name, nickname: saved.nickname || saved.name, headImg: saved.head_img || '/avatar.svg', identity: saved.identity, userid: saved._id } });
};
