# CantoScene API

粤见 MVP 后端，使用 Fastify、TypeScript、Prisma 和 PostgreSQL。

## 零安装本地启动（推荐）

不需要预先安装 Docker 或 PostgreSQL。项目使用 PGlite 启动仅供本地开发的 PostgreSQL 兼容数据库，并自动完成迁移和种子数据导入：

```bash
pnpm dev:server:local
```

启动后：

- API：`http://127.0.0.1:3000/api/v1`
- 本地数据库端口：`127.0.0.1:5433`
- 持久化数据：`server/.data/pglite`（已忽略，不进入 Git）

另开一个终端启动前端：

```bash
pnpm dev
```

健康检查：`GET http://127.0.0.1:3000/api/v1/health`。

首次启动自动导入：

- 3 门课程；
- 14 个课节；
- 5 条茶餐厅示范表达；
- 1 个真实测试视频；
- 350 条开发测试字幕。

当前 350 条字幕来自自动转写，虽然本地种子数据允许公开读取以便联调，但仍属于待校对测试内容，不能直接作为正式课程发布。

## 标准 PostgreSQL 启动

部署或已有 PostgreSQL 时：

1. 将 `.env.example` 复制为 `.env` 并填写 `DATABASE_URL`；
2. 创建空数据库；
3. 执行 `pnpm --filter @canto-scene/server db:deploy`；
4. 执行 `pnpm --filter @canto-scene/server db:seed`；
5. 执行 `pnpm dev:server`。

PGlite 只用于本地开发。生产环境使用标准 PostgreSQL，并执行同一份 Prisma 迁移。

## 当前接口

- `GET /api/v1/health`
- `GET /api/v1/courses`
- `GET /api/v1/courses/:courseSlug`
- `GET /api/v1/lessons/:lessonId`
- `GET /api/v1/videos`
- `GET /api/v1/videos/:videoSlug`
- `GET /api/v1/videos/:videoId/subtitles`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `PATCH /api/v1/me/preferences`
- `GET/PUT/PATCH/DELETE /api/v1/me/favorites/...`
- `GET/POST/PATCH/DELETE /api/v1/me/wordbook/...`
- `PUT /api/v1/me/lesson-progress/:lessonId`
- `PUT /api/v1/me/video-progress/:videoId`
- `GET /api/v1/me/learning-summary`

内容管理和 DeepSeek 后台任务接口会在后续批次实现。

## 数据库命令

```bash
pnpm --filter @canto-scene/server db:generate
pnpm --filter @canto-scene/server db:migrate
pnpm --filter @canto-scene/server db:deploy
pnpm --filter @canto-scene/server db:studio
```

## 验收命令

```bash
pnpm --filter @canto-scene/server typecheck
pnpm --filter @canto-scene/server test
pnpm --filter @canto-scene/server test:integration
pnpm --filter @canto-scene/server build
```

API Key 只能写入未提交的 `.env` 或部署平台密钥管理中，不能写入前端、数据库业务表或 Git。
