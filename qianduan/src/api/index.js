import request from '../utils/request';

/**
 * 注册接口
 */
export const getRegister = (data) => {
  return request({ method: 'post', url: '/api/v1/user/register', data });
};

/**
 * 登录接口
 */
export const getLogin = (data) => {
  return request({ method: 'post', url: '/api/v1/user/login', data });
};

/**
 * 获取用户信息接口
 */
export const getUserInfo = () => {
  return request({ method: 'get', url: '/api/v1/user/userInfo' });
};


/**
 * 课程列表数据接口
 */
export const getCourse = (data) => {
  return request({ method: 'get', url: '/api/v1/course/find', data });
};


/**
 * 课程修改接口
 */
export const changeCourse = (data) => {
  return request({ method: 'get', url: '/api/v1/course/update', data });
};

/**
 * 课程添加接口
 */
export const addCourse = (data) => {
  return request({ method: 'post', url: '/api/v1/course/add', data });
};
/**
 * 课程删除接口
 */
export const deleteCourse = (data) => {
  return request({ method: 'get', url: '/api/v1/course/delete', data });
};




/**
 * 借阅图书接口
 */
export const getBorrowBook=(data)=>{
  return request({method:'get',url:'/api/v1/course/borrowbook',data});
}
/**
 * 借阅图书列表接口
 */
export const borrowbooklist=(data)=>{
  return request({method:'get',url:'/api/v1/course/borrowbooklist',data});
}
/**
 * 归还图书接口
 */
export const returnbook=(data)=>{
  return request({method:'get',url:'/api/v1/course/returnbook',data});
}
/**
 * 全部借阅图书列表接口
 */
export const allborrowbooklist=(data)=>{
  return request({method:'get',url:'/api/v1/course/allborrowbooklist',data});
}




/**
 * 用户列表数据接口
 */
export const getuser = (data) => {
  return request({ method: 'get', url: '/api/v1/course/usershow', data });
};

/**
 * 用户重置密码修改接口
 */
export const changesuer = (data) => {
  return request({ method: 'get', url: '/api/v1/course/userupdate', data });
};

/**
 * 用户删除接口
 */
export const deleteuser = (data) => {
  return request({ method: 'get', url: '/api/v1/course/userdelete', data });
};
