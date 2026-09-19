const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
let mongod, db, client, server, base, uploadDir, admin, user, other, book, service;
const secret = 'local-test-only-secret-with-at-least-32-characters';
const token = (u) => 'Bearer ' + jwt.sign({ _id: u._id.toString() }, secret);
async function request(route, { who, method = 'GET', body, rawBody } = {}) {
  const headers = {};
  if (who) headers.authorization = token(who);
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + route, { method, headers, body: rawBody || (body ? JSON.stringify(body) : undefined) });
  return { status: response.status, body: await response.json() };
}
before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_USER = '';
  process.env.MONGODB_DATABASE = 'lab_regression';
  process.env.JWT_SECRET = secret;
  process.env.UPLOAD_DRIVER = 'local';
  process.env.PUBLIC_BASE_URL = '';
  uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lab-uploads-'));
  process.env.UPLOAD_DIR = uploadDir;
  const config = require('../config/db');
  client = config.client; db = config.database;
  await config.connectToMongoDB();
  const { app } = require('../app');
  server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  base = `http://127.0.0.1:${server.address().port}`;
  service = require('../services/lending').createLendingService(db);
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  await client?.close();
  await mongod?.stop();
  if (uploadDir) await fs.rm(uploadDir, { recursive: true, force: true });
});
beforeEach(async () => {
  await db.dropDatabase();
  const pwd = await bcrypt.hash('123456', 4);
  admin = { _id: new ObjectId(), name: 'admin', identity: 'admin', del: 0, pwd };
  user = { _id: new ObjectId(), name: 'reader', identity: 'user', del: 0, pwd };
  other = { _id: new ObjectId(), name: 'other', identity: 'user', del: 0, pwd };
  await db.collection('user').insertMany([admin, user, other]);
  book = { _id: new ObjectId(), title: 'Book', outhor: 'Author', num: 1, del: 0, point: 8, category: 'Novel', course_img: '/cover.png', borrowings: [] };
  await db.collection('book').insertOne(book);
});
test('all protected routes reject anonymous requests; ordinary users cannot manage', async () => {
  for (const route of ['find', 'update', 'delete', 'borrowbook', 'borrowbooklist', 'returnbook', 'allborrowbooklist', 'usershow', 'userupdate', 'userdelete']) {
    assert.equal((await request('/api/v1/course/' + route)).status, 401, route);
  }
  for (const route of ['update', 'delete', 'allborrowbooklist', 'usershow', 'userupdate', 'userdelete']) {
    assert.equal((await request('/api/v1/course/' + route, { who: user })).status, 403, route);
  }
  assert.equal((await request('/api/v1/course/add', { method: 'POST', who: user, body: {} })).status, 403);
  assert.equal((await request('/upload', { method: 'POST' })).status, 401);
  assert.equal((await request('/upload', { method: 'POST', who: user })).status, 403);
});
test('login and every authenticated request reject deleted users and forged roles', async () => {
  const login = await request('/api/v1/user/login', { method: 'POST', body: { userName: 'reader', password: '123456' } });
  assert.equal(login.status, 200);
  await db.collection('user').updateOne({ _id: user._id }, { $set: { del: 1 } });
  assert.equal((await request('/api/v1/user/login', { method: 'POST', body: { userName: 'reader', password: '123456' } })).status, 401);
  assert.equal((await request('/api/v1/user/userInfo', { who: user })).status, 401);
  const response = await fetch(base + '/api/v1/course/usershow', { headers: { authorization: 'Bearer ' + jwt.sign({ _id: other._id.toString(), identity: 'admin' }, secret) } });
  assert.equal(response.status, 403);
});
test('user list includes no password hash or unapproved fields', async () => {
  await db.collection('user').updateOne({ _id: user._id }, { $set: { password: 'private', internalSecret: 'private' } });
  const result = await request('/api/v1/course/usershow', { who: admin });
  assert.equal(result.status, 200);
  assert.equal(result.body.data.total, 3);
  for (const row of result.body.data.list) assert.deepEqual(Object.keys(row).sort(), ['_id', 'identity', 'name']);
});
test('author search uses outhor and treats regex metacharacters literally', async () => {
  await db.collection('book').insertOne({ ...book, _id: new ObjectId(), outhor: 'A.b' });
  const result = await request('/api/v1/course/find?outhor=A.b', { who: user });
  assert.equal(result.body.data.total, 1);
  assert.equal(result.body.data.list[0].outhor, 'A.b');
  assert.equal((await request('/api/v1/course/find?outhor=missing', { who: user })).body.data.total, 0);
});
test('standalone database: 20 simultaneous borrows of last copy have exactly one winner', async () => {
  const results = await Promise.all(Array.from({ length: 20 }, () => service.borrow(book._id, user._id).then(() => true, () => false)));
  assert.equal(results.filter(Boolean).length, 1);
  const result = await db.collection('book').findOne({ _id: book._id });
  assert.equal(result.num, 0);
  assert.equal(result.borrowings.length, 1);
});
test('invalid user, impersonation, and deleted book do not consume stock', async () => {
  const p = '/api/v1/course/borrowbook?bookid=' + book._id;
  assert.equal((await request(p + '&userid=invalid', { who: user })).status, 400);
  assert.equal((await request(p + '&userid=' + other._id, { who: user })).status, 403);
  assert.equal((await db.collection('book').findOne({ _id: book._id })).num, 1);
  await db.collection('book').updateOne({ _id: book._id }, { $set: { del: 1 } });
  assert.equal((await request(p, { who: user })).status, 409);
  assert.equal((await db.collection('book').findOne({ _id: book._id })).num, 1);
});
test('failed loan ledger update never decrements stock', async () => {
  await db.collection('book').updateOne({ _id: book._id }, { $set: { borrowings: 'invalid-array' } });
  await assert.rejects(service.borrow(book._id, user._id));
  const result = await db.collection('book').findOne({ _id: book._id });
  assert.equal(result.num, 1);
  assert.equal(result.borrowings, 'invalid-array');
});
test('failed stock update never marks loan returned; retry succeeds', async () => {
  const loan = await service.borrow(book._id, user._id);
  await db.collection('book').updateOne({ _id: book._id }, { $set: { num: 'invalid-number' } });
  await assert.rejects(service.returnBook(loan._id, user));
  assert.equal((await db.collection('book').findOne({ _id: book._id })).borrowings[0].del, 0);
  await db.collection('book').updateOne({ _id: book._id }, { $set: { num: 0 } });
  await service.returnBook(loan._id, user);
  assert.equal((await db.collection('book').findOne({ _id: book._id })).num, 1);
});
test('return is owner-only, admins can return, duplicate concurrent return increments once', async () => {
  const loan = await service.borrow(book._id, user._id);
  await assert.rejects(service.returnBook(loan._id, other));
  const result = await Promise.all(Array.from({ length: 10 }, () => service.returnBook(loan._id, admin).then(() => true, () => false)));
  assert.equal(result.filter(Boolean).length, 1);
  const doc = await db.collection('book').findOne({ _id: book._id });
  assert.equal(doc.num, 1);
  assert.equal(doc.borrowings[0].del, 1);
});
test('loan list retains API shape, ownership, pagination, and excludes returned loans', async () => {
  const loan = await service.borrow(book._id, user._id);
  const own = await request('/api/v1/course/borrowbooklist?page=1&size=5', { who: user });
  assert.equal(own.body.data.total, 1);
  assert.equal(own.body.data.list[0]._id, loan._id.toString());
  assert.equal(own.body.data.list[0].bookid, book._id.toString());
  assert.equal((await request('/api/v1/course/borrowbooklist?userid=' + user._id, { who: other })).status, 403);
  assert.equal((await request('/api/v1/course/allborrowbooklist', { who: admin })).body.data.list[0].name, 'reader');
  assert.equal((await request('/api/v1/course/find', { who: user })).body.data.list[0].borrowings, undefined);
  assert.equal((await request('/api/v1/course/returnbook?id=' + loan._id, { who: user })).status, 200);
  assert.equal((await request('/api/v1/course/borrowbooklist', { who: user })).body.data.total, 0);
});
test('admin upload refuses when MinIO is not configured instead of writing locally', async () => {
  const data = new FormData();
  data.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aU1sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'cover.png');
  const result = await request('/upload', { who: admin, method: 'POST', rawBody: data });
  assert.equal(result.status, 503);
  assert.equal(result.body.message, '服务暂时不可用，请稍后重试');
});
