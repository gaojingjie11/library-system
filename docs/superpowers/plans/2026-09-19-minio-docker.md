# MinIO 与 Docker 部署实施计划

目标：只用现有 MongoDB / MinIO，初始化远程示例数据，构建可部署的前后端镜像。

设计：前端 Node 构建、Nginx 提供静态文件并代理 /api、/upload。后端 Node 非 root 运行；图片仅保存 MinIO 公开只读桶并返回永久 URL。MongoDB 和 MinIO 均使用 .env，不打入镜像；Compose 只定义 backend 与 frontend。

- [x] app.js 强制 MinIO 写入并拒绝本地落盘；seed.js 创建公开只读 `lab-library` 桶，上传头像和示例封面，插入 2 个网站账号、4 本示例书和 1 条借阅；重复执行不覆盖已有数据。
- [x] 两仓库新增 Dockerfile/.dockerignore；前端新增 nginx.conf，工作区根新增 compose.yaml 与部署说明；镜像不包含 .env、测试或旧 dist。
- [x] 本地回归覆盖未配置 MinIO 时拒绝写本地盘；远程验证实际对象、登录、图书查询及公开图片响应；compose 配置验证通过。Docker daemon 未在本机运行，未执行镜像构建。
