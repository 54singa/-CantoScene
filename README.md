# 粤见 CantoScene

> 走进真实粤语。
> See it. Hear it. Get Cantonese.

粤见是一款面向粤语初学者的全栈学习 Demo。用户可以学习茶餐厅常用表达、播放 Fish Audio 粤语语音、观看带同步字幕的粤语视频、展开粤拼与普通话释义，并保存收藏、生词和学习进度。影视字幕卡还提供由后端调用 DeepSeek 的“AI 讲解这句”。

## 在线 Demo

- 网站：<https://cantoscene-web.onrender.com>
- API 健康检查：<https://cantoscene-api.onrender.com/api/v1/health>

当前 Demo 使用 Render 托管前后端、Neon PostgreSQL 保存业务数据，并通过 GitHub Releases 提供两段公开演示视频。Render 免费后端休眠后的第一次请求可能需要稍等，后续访问会恢复正常速度。

## Demo 已实现

- React + TypeScript + Vite 前端；
- Fastify + Prisma + PostgreSQL 后端；
- 注册、登录、会话恢复和退出；
- 字幕收藏、生词本、课程与视频学习进度；
- 一条完整的“茶餐厅点餐”课程路径和 15 条 Fish Audio 静态语音；
- 两段粤语视频，其中第二段含 40 条用户校对字幕、粤拼和普通话释义；
- DeepSeek 字幕讲解、结构校验、失败降级和进程内缓存；
- 简体默认显示与香港繁体切换。

## 本地启动

需要 Node.js 22+ 与 pnpm。在项目根目录打开两个终端：

```bash
# 终端 1：前端
pnpm dev

# 终端 2：后端 + 本地持久化 PGlite 数据库
pnpm dev:server:local
```

- 前端：<http://127.0.0.1:5173/>
- API：<http://127.0.0.1:3000/api/v1>
- 健康检查：<http://127.0.0.1:3000/api/v1/health>

后端本地密钥配置见 [`server/.env.example`](server/.env.example)。密钥只放在未提交的 `server/.env` 中。

## 验收命令

```bash
pnpm content:check:audio
pnpm typecheck
pnpm build
pnpm typecheck:server
pnpm --filter @canto-scene/server test
pnpm --filter @canto-scene/server test:integration
pnpm build:server
```

## 生产部署边界

- 生产数据库必须使用标准 PostgreSQL，并执行 Prisma migration；PGlite 仅用于本地开发。
- DeepSeek Key、数据库地址和 JWT Secret 只配置在后端部署平台。
- 两段 MP4 不进入普通 Git：旧视频约 201 MB，新视频约 7.8 MB。当前 Demo 由 GitHub Releases 临时托管，并通过 `VITE_VIDEO_01_URL` 和 `VITE_VIDEO_NESTLE_URL` 注入公开 HTTPS 地址；正式运营前迁移到对象存储或视频 CDN。
- 前端使用 `VITE_API_BASE_URL` 指向生产 API。
- 当前字幕包含不同校对状态；页面会明确显示“自动转写初稿”或“用户校对版”。

完整部署步骤见 [`17-Demo部署准备.md`](17-Demo部署准备.md)。
