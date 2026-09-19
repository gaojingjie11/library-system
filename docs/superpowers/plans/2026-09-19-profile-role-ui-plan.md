# 用户资料、角色管理与界面优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为图书管理系统增加安全的用户身份管理、个人中心和 MinIO 旧图片清理，并统一前端页面的视觉和交互样式。

**Architecture:** 后端把 MinIO 上传和安全删除集中到一个存储服务；个人资料接口只更新当前用户，角色接口只允许管理员修改其他用户并保护最后一个管理员。前端在现有 Vue 组件结构上新增个人中心视图，改造用户管理和图书编辑，使用统一的页面容器、间距、按钮和表格样式，避免大范围重写路由和数据模型。

**Tech Stack:** Node.js、Express、MongoDB、MinIO、Vue 3 Composition API、Element Plus、Less、Node test runner。

---

### Task 1: 抽取 MinIO 图片存储与清理服务

**Files:**
- Create: `kaohe/services/storage.js`
- Create: `kaohe/middleware/upload.js`
- Modify: `kaohe/app.js`
- Modify: `kaohe/controllers/courseController.js`
- Test: `kaohe/tests/integration.test.js`

- [ ] **Step 1: 写存储服务测试替身和失败测试**

在集成测试中注入一个具有 `putObject`、`removeObject` 方法的 MinIO 假客户端，覆盖以下行为：

```js
assert.equal(await deleteManagedImage('/avatar.svg'), false);
assert.equal(await deleteManagedImage('https://example.com/a.png'), false);
assert.equal(await deleteManagedImage(`${process.env.MINIO_PUBLIC_URL}/old.png`), true);
assert.deepEqual(removedObjects, ['old.png']);
```

测试要求只允许删除 `MINIO_PUBLIC_URL` 对应桶中的对象键，并保留 URL 编码后的文件名。

- [ ] **Step 2: 实现 `storage.js`**

导出 `uploadImage(file)` 和 `deleteManagedImage(url)`。`uploadImage` 使用现有 MinIO 环境变量、UUID 文件名和 MIME 后缀，返回公共 URL；未配置 MinIO 时抛出 `HttpError(503, '服务必须配置 MinIO 上传')`。`deleteManagedImage` 解析 `MINIO_PUBLIC_URL`，只接受同一协议、主机、端口和路径前缀的 URL，调用 `removeObject`；空值、`/avatar.svg`、外部 URL 和前缀不匹配的 URL 返回 `false`。

- [ ] **Step 3: 抽取共享的图片上传中间件**

在 `kaohe/middleware/upload.js` 创建并导出现有的 Multer memory storage、5 MB 限制和图片 MIME 白名单。`app.js` 与 `router/user.js` 都引用该模块，避免路由文件反向依赖 `app.js`。

- [ ] **Step 4: 让现有管理员上传接口使用存储服务**

在 `app.js` 保留现有 `/upload` 的管理员权限、Multer 文件大小和格式限制，改为调用 `uploadImage(req.file)`，保持返回 `{ code: 0, data: { message: '上传成功', url } }`。

- [ ] **Step 5: 为登录用户增加头像上传接口**

在 `kaohe/router/user.js` 注册 `POST /avatar`，只使用 `authenticate` 和同一 Multer 配置，调用 `uploadImage` 并返回 URL。普通用户可以上传头像，但不能借此上传图书封面。

- [ ] **Step 6: 在图书更新成功后清理旧封面**

`updateVideoById` 读取旧文档的 `course_img`，将 `course_img` 纳入允许更新字段；数据库更新成功且新旧 URL 不同后调用 `deleteManagedImage(oldUrl)`。删除失败只记录 `console.warn`，不回滚已经成功的数据库更新。

- [ ] **Step 7: 运行后端测试**

Run: `cd kaohe && npm test`

Expected: 现有鉴权、借阅并发、上传配置测试和新增图片存储测试全部 PASS。

- [ ] **Step 8: 提交存储层变更**

```bash
git add kaohe/services/storage.js kaohe/app.js kaohe/router/user.js kaohe/controllers/courseController.js kaohe/tests/integration.test.js
git commit -m "feat: manage MinIO image lifecycle"
```

### Task 2: 实现个人资料和管理员角色接口

**Files:**
- Modify: `kaohe/router/user.js`
- Modify: `kaohe/controllers/userController.js`
- Modify: `kaohe/router/course.js`
- Modify: `kaohe/controllers/courseController.js`
- Test: `kaohe/tests/integration.test.js`

- [ ] **Step 1: 添加资料接口失败测试**

覆盖：普通用户只能更新自己；空昵称返回 400；密码必须为 6 到 12 个非空白字符；`GET /userInfo` 返回 `nickname || name`；头像 URL 变更后调用图片删除替身。

- [ ] **Step 2: 实现 `PATCH /api/v1/user/profile`**

接收 `{ nickname, password, headImg }`，只更新当前 `req.user._id`。昵称存入 `nickname` 字段，登录用的 `name` 不变；密码存入现有 `pwd` 字段的 bcrypt 哈希；头像只接受 `/avatar.svg` 或当前 MinIO 公共地址下的 URL。更新数据库后清理旧头像，并返回 `{ name, nickname, headImg, identity, userid }`。

- [ ] **Step 3: 添加角色接口失败测试**

覆盖：普通用户返回 403；非法身份返回 400；不存在用户返回 404；管理员不能修改自己；两个管理员时允许降级其中一个；最后一个管理员降级返回 409。

- [ ] **Step 4: 实现 `PATCH /api/v1/course/useridentity`**

接收 `{ id, identity }`，使用 `objectId` 校验 ID。查询当前管理员数量，目标是最后一个管理员且新身份为 `user` 时返回 409；目标 ID 等于当前用户时返回 400；其余情况更新 `identity` 并返回新身份。

- [ ] **Step 5: 加强删除用户的管理员保护**

`deleteuserById` 删除最后一个管理员时返回 409，删除操作成功后仍使用 `del: 1` 软删除。删除失败统一返回 404。

- [ ] **Step 6: 运行后端测试并提交**

Run: `cd kaohe && npm test`

Expected: 所有资料、角色、最后管理员保护测试和原有测试 PASS。

```bash
git add kaohe/router/user.js kaohe/controllers/userController.js kaohe/router/course.js kaohe/controllers/courseController.js kaohe/utils/http.js kaohe/tests/integration.test.js
git commit -m "feat: add profile and role management APIs"
```

### Task 3: 增加前端 API 和个人中心

**Files:**
- Modify: `qianduan/src/api/index.js`
- Modify: `qianduan/src/components/Header.vue`
- Modify: `qianduan/src/views/Home.vue`
- Create: `qianduan/src/components/Profile.vue`
- Modify: `qianduan/src/common/base.css`

- [ ] **Step 1: 添加 API 封装**

在 `api/index.js` 增加：

```js
export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('file', file);
  return request({ method: 'post', url: '/api/v1/user/avatar', data: form });
};
export const updateProfile = (data) => request({ method: 'patch', url: '/api/v1/user/profile', data });
export const changeUserIdentity = (data) => request({ method: 'patch', url: '/api/v1/course/useridentity', data });
```

- [ ] **Step 2: 实现 `Profile.vue`**

显示只读用户名，编辑昵称、头像、新密码和确认密码。头像上传先调用 `uploadAvatar`，保存资料时把返回 URL 放入 `updateProfile`；保存失败时保留表单内容。密码确认不一致时不发请求。成功后触发 `updated` 事件并显示成功消息。

- [ ] **Step 3: 接入个人中心导航**

`Header.vue` 的用户菜单增加“个人中心”，通过现有 event bus 发送 `profile`；`Home.vue` 增加 `Profile` 分支并监听 `updated` 事件重新请求 `getUserInfo`，确保顶部头像和昵称立即刷新。

- [ ] **Step 4: 统一基础样式**

在 `base.css` 增加 CSS 变量、统一字体、背景色、圆角、阴影和按钮间距；个人中心使用与图书和用户管理相同的白色内容卡片和响应式宽度。

- [ ] **Step 5: 构建前端**

Run: `cd qianduan && npm run build`

Expected: production build succeeds without Vue or ESLint compilation errors。

### Task 4: 改造管理员用户管理和图书封面编辑

**Files:**
- Modify: `qianduan/src/components/Main2.vue`
- Modify: `qianduan/src/components/Table2.vue`
- Modify: `qianduan/src/components/EditPop.vue`
- Modify: `qianduan/src/components/Main.vue`
- Modify: `qianduan/src/api/index.js`

- [ ] **Step 1: 在用户列表增加身份显示和切换**

`Table2.vue` 增加身份列和按钮，显示 `admin` 为“管理员”、`user` 为“普通用户”。按钮调用父组件传入的 `identityHandle`，当前用户行禁用切换；父组件通过 `getUserInfo` 保存当前用户 ID，并根据列表中管理员数量禁用最后管理员的降级按钮。

- [ ] **Step 2: 在 `Main2.vue` 完成角色更新**

调用 `changeUserIdentity({ id, identity })` 前使用 Element Plus 确认框；成功后刷新当前页用户列表，失败保留页面状态并展示后端错误。现有重置密码和借阅信息功能保持不变。

- [ ] **Step 3: 给图书编辑弹窗增加可选图片**

`EditPop.vue` 增加图片预览和文件校验，选择文件后调用现有管理员 `uploadImage`，把新 URL 和其他字段一起传给 `changeCourse`；没有选择图片时不改变 `course_img`。上传中禁用确认按钮，失败时保留弹窗。

- [ ] **Step 4: 补齐图书更新 API 的图片字段**

`Main.vue` 的 `confirmClick` 将 `course_img` 传入 `changeCourse`；`EditPop.vue` 的提交对象保留图书 ID、标题、作者、评分、分类和可选 `course_img`。

- [ ] **Step 5: 统一管理页面样式**

调整 `Main.vue`、`Main2.vue`、`Table.vue`、`Table2.vue`、`Header.vue`：移除固定定位造成的表头错位，统一内容区内边距、表格行高、按钮间距和图片圆角，增加窄屏横向滚动；保留现有功能和中文文案。

- [ ] **Step 6: 构建前端并提交**

Run: `cd qianduan && npm run build`

Expected: build succeeds and user management, profile, and book editing components compile。

```bash
git add qianduan/src/api/index.js qianduan/src/components qianduan/src/views/Home.vue qianduan/src/common/base.css
git commit -m "feat: add profile UI and role controls"
```

### Task 5: 端到端验证、Docker 构建和部署文档

**Files:**
- Modify: `README.md`
- Modify: `kaohe/README.md`
- Modify: `qianduan/README.md`
- Modify: `kaohe/tests/integration.test.js` if validation exposes a regression

- [ ] **Step 1: 运行后端和前端检查**

```bash
cd kaohe && npm test
cd ../qianduan && npm run build
cd .. && docker compose -p library-system config --quiet
docker compose -p library-system build
```

Expected: all commands exit with status 0。

- [ ] **Step 2: 使用远程服务验证**

在服务器现有 `.env` 下启动 `docker compose -p library-system up -d`，以管理员登录，验证：个人中心修改昵称和头像、修改密码后重新登录、将其他用户切换为管理员/普通用户、替换图书封面，并确认旧对象从 `lab-library` 桶删除。验证普通用户无法调用角色接口，且最后一个管理员不能降级。

- [ ] **Step 3: 更新部署文档**

补充个人中心、角色保护、MinIO 旧图片清理说明，并保留 GitHub Actions 只使用 `SERVER_IP`、`SERVER_SSH_KEY`、`SERVER_USER` 三个 Secret 的说明。

- [ ] **Step 4: 最终提交并推送**

```bash
git add README.md kaohe/README.md qianduan/README.md kaohe/tests/integration.test.js
git commit -m "docs: document profile and image lifecycle features"
git push origin main
```

- [ ] **Step 5: 检查 GitHub Actions**

确认 `Deploy library system` 使用三个既有 Secret 成功运行，服务器上的前端端口为 91、后端端口为 9100，MongoDB 和 MinIO 仍使用服务器已有服务。
