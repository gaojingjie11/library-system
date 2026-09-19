const { ObjectId } = require('mongodb');
const { HttpError } = require('../utils/http');

// The stock and loan ledger share one document: MongoDB standalone supports this atomic update.
function createLendingService(database) {
  const books = database.collection('book');
  async function borrow(bookid, userid) {
    const loan = { _id: new ObjectId(), userid, del: 0, borrowTime: new Date() };
    const result = await books.updateOne(
      { _id: bookid, del: 0, num: { $gt: 0 } },
      { $inc: { num: -1 }, $push: { borrowings: loan } }
    );
    if (!result.modifiedCount) throw new HttpError(409, '图书不存在、已删除或已借完');
    return loan;
  }
  async function returnBook(id, user) {
    const match = { _id: id, del: 0 };
    if (user.identity !== 'admin') match.userid = user._id;
    const result = await books.updateOne(
      { borrowings: { $elemMatch: match } },
      { $inc: { num: 1 }, $set: { 'borrowings.$.del': 1, 'borrowings.$.returnTime': new Date() } }
    );
    if (!result.modifiedCount) throw new HttpError(404, '借阅记录不存在、已归还或无权操作');
  }

  // 删除账号前调用：把该用户所有未归还的借阅逐条归还，库存才不会被他永久占用。
  // 逐条走 returnBook 而不是一次 $set 多条，是为了让每一步都是单文档原子操作
  //（standalone 无事务），且重复执行天然幂等——已归还的记录会被 del: 0 条件挡掉。
  async function returnAllFor(userid) {
    const open = await books.aggregate([
      { $match: { borrowings: { $elemMatch: { userid, del: 0 } } } },
      { $unwind: '$borrowings' },
      { $match: { 'borrowings.userid': userid, 'borrowings.del': 0 } },
      { $project: { _id: '$borrowings._id' } }
    ]).toArray();
    let returned = 0;
    for (const loan of open) {
      try {
        await returnBook(loan._id, { identity: 'admin' });
        returned += 1;
      } catch {
        // 并发下已被他人归还，忽略即可
      }
    }
    return returned;
  }

  return { borrow, returnBook, returnAllFor };
}
module.exports = { createLendingService };
