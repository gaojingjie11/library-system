const { database } = require('./db');

// 活跃账号（del: 0）的用户名必须唯一。用 partial 索引而不是普通唯一索引，
// 是因为账号是软删除的：已删除的账号不应该继续占用用户名。
const USER_NAME = {
  key: { name: 1 },
  options: { name: 'user_name_active_unique', unique: true, partialFilterExpression: { del: 0 } }
};

// 借阅台账查询索引：按"某用户尚未归还的记录"过滤，删除账号时批量归还走这条索引。
const BOOK_LOAN = {
  key: { 'borrowings.userid': 1, 'borrowings.del': 1 },
  options: { name: 'book_borrowings_user_del' }
};

// 历史数据里若已有重名活跃账号，唯一索引会创建失败。先查出来给出明确提示，
// 而不是让服务抛一个看不懂的 E11000。
async function assertNoDuplicateNames() {
  const duplicates = await database.collection('user').aggregate([
    { $match: { del: 0 } },
    { $group: { _id: '$name', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $project: { _id: 0, name: '$_id', count: 1 } }
  ]).toArray();
  if (duplicates.length) {
    const detail = duplicates.map((d) => `${d.name}(${d.count} 个)`).join('、');
    throw new Error(`存在重复的活跃账号，无法建立用户名唯一索引：${detail}。请先合并或删除多余账号后重启`);
  }
}

async function ensureIndexes() {
  await assertNoDuplicateNames();
  await database.collection('user').createIndex(USER_NAME.key, USER_NAME.options);
  await database.collection('book').createIndex(BOOK_LOAN.key, BOOK_LOAN.options);
}

module.exports = { ensureIndexes };
