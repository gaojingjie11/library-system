# vue_project

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## 本次修复后的本地运行

需要 Node.js 20+。先在后端 `kaohe` 启动 `npm start`，再在此目录执行：

```sh
npm ci
npm run serve
```

前端默认同源请求，开发服务器把 `/api`、`/upload` 转发至 `http://127.0.0.1:3000`。封面图由后端上传到公开 MinIO 桶并返回永久 URL，不使用本地图片目录。

生产部署须将 `/api` 和 `/upload` 代理至后端；图片地址由后端返回公开 MinIO URL。若前后端不在同一域名，可在构建时设置 `VUE_APP_API_BASE_URL`。

数据库管理账号不能直接登录网页。网站普通用户通过注册创建，管理员初始化见后端 README。新数据库没有默认用户或示例图书。

构建：`npm run build`。仓库中原有 `dist/` 是旧产物，本次验证输出到临时目录，部署前必须重新构建，不能直接发布旧 `dist/`。
