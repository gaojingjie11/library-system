# 图书管理系统部署

仓库由 `qianduan` 前端和 `kaohe` 后端组成。Docker Compose 只启动这两个服务，连接服务器上已经运行的 MongoDB 和 MinIO，不会创建 MongoDB 或 MinIO 容器。

## 首次部署

```sh
cp kaohe/.env.example kaohe/.env
```

编辑 `kaohe/.env`，至少设置 MongoDB 密码和一个长度不少于 32 位的 `JWT_SECRET`。MinIO 公开桶配置如下：

```env
UPLOAD_DRIVER=minio
MINIO_HOST=42.193.104.173
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=你的MinIO密码
MINIO_BUCKET=lab-library
MINIO_PUBLIC_URL=http://42.193.104.173:9000/lab-library
```

`.env` 含数据库和 MinIO 凭据，只放在服务器，不提交 Git。

首次初始化示例账号、图书和公开封面：

```sh
cd kaohe
ADMIN_PASSWORD='Admin@26' USER_PASSWORD='Reader@26' npm ci
ADMIN_PASSWORD='Admin@26' USER_PASSWORD='Reader@26' npm run seed
cd ..
docker compose up -d --build
```

初始化脚本会创建 `lab-library` 桶、设置匿名只读下载策略，上传示例封面，并写入 `admin`、`reader` 两个网站账号和 4 本图书。重复执行不会覆盖已有账号或同名图书。建议首次部署后立即修改示例密码并重新运行前端登录验证；密码长度沿用项目规则为 6–12 位。

访问服务器的 91 端口即可打开前端；后端 API 对外端口为 9100。Nginx 将 `/api` 和 `/upload` 转发到后端容器，图书图片由公开 MinIO URL 直接返回。前端正常使用时请求 `http://服务器:91/api/...`，不需要手动改成 9100。

## 更新部署

```sh
git pull
docker compose up -d --build
```

数据不在容器里：MongoDB 保存业务数据，MinIO 保存图片。部署前应分别备份它们。

本机 Docker 服务未运行时无法在开发机执行镜像构建；服务器执行 `docker compose build` 即可验证 Dockerfile。
