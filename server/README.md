# CantoScene API

粤见 MVP 后端，使用 Fastify、TypeScript、Prisma 和 PostgreSQL。

## 本地启动

1. 将 `.env.example` 复制为 `.env`，填写本地 PostgreSQL 连接信息；
2. 创建空数据库 `canto_scene`；
3. 执行 `pnpm --filter @canto-scene/server db:deploy`；
4. 执行 `pnpm dev:server`；
5. 访问 `GET http://127.0.0.1:3000/api/v1/health`。

## 当前接口

- `GET /api/v1/health`
- `GET /api/v1/courses`
- `GET /api/v1/courses/:courseSlug`
- `GET /api/v1/lessons/:lessonId`
- `GET /api/v1/videos`
- `GET /api/v1/videos/:videoSlug`
- `GET /api/v1/videos/:videoId/subtitles`

用户认证、收藏、生词本、学习进度和内容管理接口会在下一批实现。

## 数据库命令

```bash
pnpm --filter @canto-scene/server db:generate
pnpm --filter @canto-scene/server db:migrate
pnpm --filter @canto-scene/server db:deploy
pnpm --filter @canto-scene/server db:studio
```

API Key 只能写入未提交的 `.env` 或部署平台密钥管理中，不能写入前端、数据库业务表或 Git。
