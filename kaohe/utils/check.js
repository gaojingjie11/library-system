const joi = require('joi');

//用户注册登录的表单校验规则
const userName = joi
  .string()
  .pattern(/^[\S]{1,6}$/)
  .required();
const password = joi
  .string()
  .pattern(/^[\S]{6,12}$/)
  .required();

exports.userCheck = {
  body: {
    userName,
    password,
  },
};

//课程查询参数的校验规则
const page = joi.number().integer().required();
const size = joi.number().integer().required();
exports.findCourseCheck = {
  query: {
    page,
    size,
  },
};

//课程更新参数的校验规则
const title = joi.string();
const outhor = joi.string();
const id = joi.number().integer().required();
const point=joi.number().integer();
const category=joi.string()
exports.updateCourseCheck = {
  query: {
    title,
    outhor,
    id,
    point,
    category
  },
};
exports.addbookCheck = {
  query: {
    title,
    outhor,
    point,
    category
  },
};
//课程删除参数的校验规则
exports.deleteCourseCheck = {
  query: {
    id,
  },
};


const bookid = joi.number().integer().required();
const userid = joi.number().integer().required();

exports.borrowbooklistCheck={
  query:{
      userid,
      page,
      size,
  },
};
exports.returnbookCheck = {
  query: {
    id,
  },
};






exports.updateuserCheck = {
  query: {
    id,
  },
};

//用户删除参数的校验规则
exports.deleteuserCheck = {
  query: {
    id,
  },
};

