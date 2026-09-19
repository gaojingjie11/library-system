const { database } = require('../config/db');
const bcrypt = require('bcryptjs');
const { HttpError, objectId, pagination, text } = require('../utils/http');
const { createLendingService } = require('../services/lending');
const { deleteManagedImage } = require('../services/storage');
const lending = createLendingService(database);
const ok = (res, data) => res.send({ code: 0, data });
const literalRegex = (value) => ({ $regex: value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' });
function point(value) {
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < 0 || n > 10) throw new HttpError(400, '评分必须在 0 到 10 之间');
  return n;
}
exports.listVideo = async (req, res) => {
  const { skip, size } = pagination(req.query.page, req.query.size);
  const query = { del: 0 };
  for (const field of ['category', 'title', 'outhor']) {
    const value = req.query[field] ?? (field === 'outhor' ? req.query.author : undefined);
    if (value) query[field] = literalRegex(text(value, field));
  }
  if (req.query.minPoint !== undefined && req.query.minPoint !== '') query.point = { $gte: point(req.query.minPoint) };
  if (req.query.maxPoint !== undefined && req.query.maxPoint !== '') query.point = { ...query.point, $lte: point(req.query.maxPoint) };
  const books = database.collection('book');
  const list = await books.find(query, { projection: { borrowings: 0 } }).sort({ _id: 1 }).skip(skip).limit(size).toArray();
  ok(res, { list, total: await books.countDocuments(query) });
};
exports.addbook = async (req, res) => {
  const book = {};
  for (const field of ['course_img', 'title', 'outhor', 'category']) book[field] = text(req.body[field], field);
  book.point = point(text(String(req.body.point ?? ''), '评分'));
  const books = database.collection('book');
  if (await books.findOne({ title: book.title, outhor: book.outhor, del: 0 })) throw new HttpError(409, '该图书已经存在');
  await books.insertOne({ ...book, del: 0, num: 100, borrowings: [] });
  ok(res, { message: '插入成功！' });
};
exports.updateVideoById = async (req, res) => {
  const id = objectId(req.query._id);
  const update = {};
  for (const field of ['title', 'outhor', 'category']) if (req.query[field] !== undefined) update[field] = text(req.query[field], field);
  if (req.query.course_img !== undefined) update.course_img = text(req.query.course_img, '图片地址');
  if (req.query.point !== undefined) update.point = point(req.query.point);
  if (!Object.keys(update).length) throw new HttpError(400, '没有提供任何需要更新的字段');
  const books = database.collection('book');
  const current = await books.findOne({ _id: id, del: 0 }, { projection: { course_img: 1 } });
  if (!current) throw new HttpError(404, '未找到指定ID的图书');
  const result = await books.updateOne({ _id: id, del: 0 }, { $set: update });
  if (!result.matchedCount) throw new HttpError(404, '未找到指定ID的图书');
  if (update.course_img && update.course_img !== current.course_img) {
    try { await deleteManagedImage(current.course_img); } catch (error) { console.warn('旧图书封面清理失败', error.message); }
  }
  ok(res, { message: '修改成功！' });
};
exports.deleteVideoById = async (req, res) => {
  const result = await database.collection('book').updateOne({ _id: objectId(req.query._id), del: 0 }, { $set: { del: 1 } });
  if (!result.matchedCount) throw new HttpError(404, '未找到指定ID的图书');
  ok(res, { message: '删除成功' });
};
exports.borrowbook = async (req, res) => {
  if (req.query.userid !== undefined && !objectId(req.query.userid, '用户ID').equals(req.user._id)) throw new HttpError(403, '只能为自己借阅');
  await lending.borrow(objectId(req.query.bookid, '图书ID'), req.user._id);
  ok(res, { message: '借阅成功' });
};
exports.returnbook = async (req, res) => {
  await lending.returnBook(objectId(req.query.id, '借阅ID'), req.user);
  ok(res, { message: '归还成功' });
};
async function listLoans(req, res, all) {
  const { skip, size } = pagination(req.query.page, req.query.size);
  let userid;
  if (!all) {
    userid = req.query.userid ? objectId(req.query.userid, '用户ID') : req.user._id;
    if (req.user.identity !== 'admin' && !userid.equals(req.user._id)) throw new HttpError(403, '只能查看自己的借阅');
  }
  const match = { 'borrowings.del': 0 };
  if (userid) match['borrowings.userid'] = userid;
  const pipeline = [
    { $unwind: '$borrowings' }, { $match: match },
    { $lookup: { from: 'user', localField: 'borrowings.userid', foreignField: '_id', as: 'borrower' } },
    { $project: { _id: '$borrowings._id', bookid: '$_id', userid: '$borrowings.userid', borrowTime: '$borrowings.borrowTime', title: 1, outhor: 1, point: 1, category: 1, course_img: 1, name: { $arrayElemAt: ['$borrower.name', 0] } } },
    { $sort: { _id: 1 } },
    { $facet: { list: [{ $skip: skip }, { $limit: size }], count: [{ $count: 'total' }] } }
  ];
  const [result] = await database.collection('book').aggregate(pipeline).toArray();
  ok(res, { list: result.list, total: result.count[0]?.total || 0 });
}
exports.listbook = (req, res) => listLoans(req, res, false);
exports.alllistbook = (req, res) => listLoans(req, res, true);
exports.usershow = async (req, res) => {
  const { skip, size } = pagination(req.query.page1, req.query.size1);
  const query = { del: 0 };
  if (req.query.name) query.name = literalRegex(text(req.query.name, '用户名'));
  const users = database.collection('user');
  const list = await users.find(query, { projection: { _id: 1, name: 1, nickname: 1, head_img: 1, identity: 1 } }).sort({ _id: 1 }).skip(skip).limit(size).toArray();
  ok(res, { list, total: await users.countDocuments(query) });
};
exports.updateuserById = async (req, res) => {
  const result = await database.collection('user').updateOne({ _id: objectId(req.query.id), del: 0 }, { $set: { pwd: await bcrypt.hash('123456', 10) } });
  if (!result.matchedCount) throw new HttpError(404, '未找到对应的用户');
  ok(res, { message: '重置成功' });
};
let roleMutation = Promise.resolve();
function withRoleMutation(task) {
  const next = roleMutation.then(task, task);
  roleMutation = next.catch(() => {});
  return next;
}
exports.updateUserIdentity = async (req, res) => withRoleMutation(async () => {
  const id = objectId(req.body?.id, '用户ID');
  const identity = req.body?.identity;
  if (!['admin', 'user'].includes(identity)) throw new HttpError(400, '身份必须是 admin 或 user');
  if (id.equals(req.user._id)) throw new HttpError(400, '不能修改自己的身份');
  const users = database.collection('user');
  const target = await users.findOne({ _id: id, del: 0 }, { projection: { identity: 1 } });
  if (!target) throw new HttpError(404, '未找到对应的用户');
  if (target.identity === 'admin' && identity === 'user' && await users.countDocuments({ identity: 'admin', del: 0 }) <= 1) {
    throw new HttpError(409, '系统至少需要保留一个管理员');
  }
  await users.updateOne({ _id: id, del: 0 }, { $set: { identity } });
  ok(res, { message: '身份修改成功', id, identity });
});
exports.deleteuserById = async (req, res) => {
  return withRoleMutation(async () => {
    const id = objectId(req.query.id, '用户ID');
    const users = database.collection('user');
    const target = await users.findOne({ _id: id, del: 0 }, { projection: { identity: 1 } });
    if (!target) throw new HttpError(404, '未找到对应的用户');
    if (target.identity === 'admin' && await users.countDocuments({ identity: 'admin', del: 0 }) <= 1) throw new HttpError(409, '系统至少需要保留一个管理员');
    const result = await users.updateOne({ _id: id, del: 0 }, { $set: { del: 1 } });
    if (!result.matchedCount) throw new HttpError(404, '未找到对应的用户');
    ok(res, { message: '删除成功' });
  });
};
