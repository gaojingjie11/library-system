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

仓库包含 GitHub Actions 自动部署工作流。向 `main` 推送后，Actions 会通过 SSH 登录服务器，在 `/opt/library-system` 拉取代码并重建 Docker Compose。当前工作流只需要这三个 Repository Secrets：`SERVER_IP`、`SERVER_SSH_KEY`、`SERVER_USER`。SSH 端口固定为 22，服务器目录固定为 `/opt/library-system`，主机指纹由 Actions 运行时读取，不需要额外的 `SERVER_KNOWN_HOSTS`。

现有服务器密钥可以复用：将对应私钥完整内容保存为 `SERVER_SSH_KEY`，将服务器目标用户的公钥保留在 `~/.ssh/authorized_keys`。私钥只进入 GitHub Secret，不进入仓库。Secret 必须配置在当前的 `library-system` 仓库，其他仓库的同名 Secret 不会共享。

## 用户资料和图片生命周期

登录用户可以在“个人中心”修改昵称、头像和密码，登录用户名保持不变。管理员可以在“用户管理”中把其他用户设置为管理员或普通用户，但不能修改自己的身份，系统始终保留至少一个管理员。

头像和图书封面保存到服务器 MinIO 的公开桶。替换成功后，后端会删除旧的本桶图片；默认头像和外部图片不会被误删。MongoDB 只保存图片的公开 URL。

数据不在容器里：MongoDB 保存业务数据，MinIO 保存图片。部署前应分别备份它们。

本机 Docker 服务未运行时无法在开发机执行镜像构建；服务器执行 `docker compose build` 即可验证 Dockerfile。
