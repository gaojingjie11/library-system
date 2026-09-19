const { client, database, connectToMongoDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const { userCheck } = require('../utils/check');
const joi = require('joi');
(async () => {
  try {
    const credentials = { userName: process.env.ADMIN_NAME, password: process.env.ADMIN_PASSWORD };
    const { error } = joi.object(userCheck.body).validate(credentials);
    if (error) throw new Error('请提供 ADMIN_NAME（1–6 位非空字符）和 ADMIN_PASSWORD（6–12 位非空字符）');
    await connectToMongoDB();
    const users = database.collection('user');
    if (await users.findOne({ name: credentials.userName, del: 0 })) throw new Error('用户名已存在；本命令不会覆盖或提升已有账号');
    await users.insertOne({ name: credentials.userName, pwd: await bcrypt.hash(credentials.password, 10), identity: 'admin', head_img: '/avatar.svg', del: 0 });
    console.log('管理员账号已创建');
  } catch (error) {
    console.error(error.name === 'MongoServerError' ? '数据库操作失败' : error.message);
    process.exitCode = 1;
  } finally { await client.close(); }
})();
