# 图书管理后端

Node.js 20+、Express、MongoDB。支持 standalone，无需副本集。

## 启动

```sh
npm ci
# 首次部署：复制 .env.example 到 .env 并填写配置；已有 .env 不要覆盖。
npm run check:db
npm start
```

本次本地 `.env` 已配置新 MongoDB，连接信息不进 Git。`MONGODB_DATABASE` 默认 `test`，数据库账号与网站账号相互独立。新服务器原先只有系统库，无业务用户或图书。

普通用户可以从前端注册。首次管理员初始化需显式执行（创建新网站账号，不修改数据库管理账号）：

```sh
ADMIN_NAME=admin ADMIN_PASSWORD='自行设置6到12位密码' npm run create:admin
```

账号名需 1–6 位非空字符，密码需 6–12 位非空字符，沿用原有注册规则。命令拒绝覆盖或提升已有账号。启动服务不会自动创建管理员或示例图书。

## 上传

本项目强制使用 MinIO，图片不会落到本地磁盘。部署配置使用 `42.193.104.173:9000`，桶名为 `lab-library`，`MINIO_PUBLIC_URL` 为 `http://42.193.104.173:9000/lab-library`。上传接口只保存永久公开 URL，因此浏览器可以直接读取图片。

执行 `npm run seed` 会创建桶（如果不存在）、设置只读公开策略并上传示例封面。生产环境也可以在 MinIO 控制台手动设置相同的公开下载策略。不要把 MinIO 管理密码提交到 Git。

## 初始化示例数据

新库可以执行：

```sh
ADMIN_PASSWORD='6到12位管理员密码' USER_PASSWORD='6到12位用户密码' npm run seed
```

脚本幂等：同名账号和图书不会覆盖，借阅示例也不会重复添加。它只写入业务数据库和指定 MinIO 桶，不创建 MongoDB 或 MinIO 容器。

## 借阅数据和权限

- `user` 保存账号；只有未删除用户可登录和访问接口。每次请求从数据库读取实际角色。
- `book` 保存图书、库存 `num` 和内嵌借阅数组 `borrowings`。每条借阅包含 `_id`、`userid`、`del`、`borrowTime`，归还后补充 `returnTime`。
- 借书以 `num > 0` 条件原子扣库存并追加记录；还书原子标记已归还并加库存。并发或写入失败不会造成只更新一半；重复归还不会重复加库存。
- 管理接口和上传需管理员；普通用户仅能为自己借书、查看和归还自己的记录。用户列表只返回公开字段。
- 登录用户可以通过 `/api/v1/user/profile` 修改昵称、头像 URL 和密码；头像先通过 `/api/v1/user/avatar` 上传到 MinIO。管理员可以通过 `/api/v1/course/useridentity` 修改其他用户的 `admin`/`user` 身份，不能修改自己的身份，且系统至少保留一个管理员。
- 图书封面和头像替换成功后，后端会尝试删除旧的 MinIO 对象；只删除当前 `MINIO_PUBLIC_URL` 桶中的对象，删除失败不会回滚已经保存的资料。
- 此版本面向新空库。旧项目 `list` 中若存在未归还记录，启动会拒绝，避免静默丢失借阅。旧库需先离线备份并迁移至 `book.borrowings`，不能直接混用两种存储格式。
- 历史记录仍保留在图书文档中；单文档有 MongoDB 大小上限，长期大规模使用需设计历史归档。

## 验证

```sh
npm test
npm run check:db
```

`npm test` 自动启动独立的临时本地 MongoDB，首次运行从 MongoDB 官方下载测试二进制，不连接 `.env` 中的远程库。覆盖权限、作者搜索、密码字段过滤、并发借书、重复归还、写入失败和“未配置 MinIO 时不落本地盘”。远程初始化后另行验证了公开 MinIO 图片返回 200。`check:db` 仅做连接和元数据读取。
