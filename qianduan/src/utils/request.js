import router from '@/router/index';
import axios from 'axios';
import { ElMessage } from 'element-plus';

export const service = axios.create({ baseURL: process.env.VUE_APP_API_BASE_URL || '', timeout: 15000 });
service.interceptors.request.use((config) => {
  if (!/\/(login|register)$/.test(config.url)) config.headers.authorization = localStorage.getItem('token');
  return config;
});
function rejectRequest(error) {
  const message = error.response?.data?.message || error.message || '请求失败';
  ElMessage.error(message);
  if (error.response?.status === 401 && !/\/(login|register)$/.test(error.config?.url || '')) {
    localStorage.removeItem('token');
    router.replace('/login');
  }
  return Promise.reject(error);
}
service.interceptors.response.use((res) => {
  if (res.data.code === 0) return res.data.data;
  return rejectRequest(new Error(res.data.message || '请求失败'));
}, rejectRequest);
export default (options) => service({ ...options, ...(options.method === 'get' ? { params: options.data } : {}) });
export const uploadImage = (file) => {
  const data = new FormData();
  data.append('file', file);
  return service.post('/upload', data);
};
