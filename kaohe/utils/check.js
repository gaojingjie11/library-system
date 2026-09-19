const joi = require('joi');

// 用户注册/登录的表单校验规则（唯一一处真正接入路由的规则表，见 router/user.js）。
// 历史遗留的 findCourseCheck / updateCourseCheck / borrowbooklistCheck 等规则从未被引用，
// 且把 _id 写成 joi.number().integer()，与实际 ObjectId 字符串类型不符，已删除。
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
