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
  return { borrow, returnBook };
}
module.exports = { createLendingService };
