# 粤见 CantoScene｜Demo 部署准备

> 目标：以最少平台和最少手工操作发布一版可公开访问、可演示核心流程的 Demo。

## 1. 推荐组合

| 部分 | 推荐平台 | 原因 |
|---|---|---|
| 代码托管 | GitHub | 保存代码、文档和部署配置；MP4 不进普通 Git |
| 前端 | Vercel | 直接构建 Vite，配置简单 |
| 后端 | Render | 可长期运行 Fastify 服务并连接外部 PostgreSQL |
| 数据库 | Neon PostgreSQL | 标准 PostgreSQL，兼容现有 Prisma migration |
| 视频 | Cloudflare R2 或其他公开对象存储 | 适合 201 MB 视频与 Range 请求，不拖慢 Git 和应用部署 |

平台可以替换，但必须保留“标准 PostgreSQL + 后端私有密钥 + 视频对象存储”三个边界。

## 2. 上线顺序

1. 创建空 GitHub 仓库并推送当前分支；
2. 创建 PostgreSQL 数据库，取得生产 `DATABASE_URL`；
3. 上传两段 MP4，取得两个公开 HTTPS 地址；
4. 部署后端，运行 migration 和种子导入；
5. 部署前端，填写 API 与视频环境变量；
6. 把实际前端域名写入后端 `FRONTEND_ORIGIN`，重启后端；
7. 使用新账号完成一次公开地址端到端验收。

## 3. 后端环境变量

```dotenv
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
DATABASE_URL=postgresql://...
FRONTEND_ORIGIN=https://你的前端域名
JWT_ACCESS_SECRET=至少32位的随机字符串
DEEPSEEK_API_KEY=你的DeepSeek密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=30000
```

不要把真实值写入 GitHub 文件、截图或前端环境变量。

## 4. 前端环境变量

```dotenv
VITE_API_BASE_URL=https://你的后端域名/api/v1
VITE_VIDEO_01_URL=https://视频存储域名/01.mp4
VITE_VIDEO_NESTLE_URL=https://视频存储域名/nestle-coffee-cantonese.mp4
```

这些地址会进入前端构建产物，所以只能放公开访问地址，不能包含私有密钥或长期签名参数。

## 5. 后端部署命令

```bash
pnpm install --frozen-lockfile
pnpm build:server
pnpm --filter @canto-scene/server db:deploy
pnpm --filter @canto-scene/server db:seed
pnpm --filter @canto-scene/server start
```

种子命令应在首次部署或内容版本更新时显式运行，不应在每个请求或每次应用启动时重复执行。

## 6. 前端部署命令

```bash
pnpm install --frozen-lockfile
pnpm build
```

发布目录为 `dist`。单页应用平台需要把未知前端路径回退到 `index.html`，否则直接刷新 `/watch/nestle-coffee` 会返回 404。

## 7. 上线验收路径

1. 首页能完整显示并看到两张影视卡；
2. 茶餐厅课程中的字词、例句和对话能播放语音；
3. 第二段视频可播放，点击字幕可看到粤拼和普通话；
4. 点击“AI 讲解这句”能返回 DeepSeek 结果，失败时只出现降级提示；
5. 新用户可以注册、刷新后保持登录；
6. 收藏一句字幕后，在收藏页和我的学习中都能看到记录；
7. 退出再登录后收藏和进度仍存在；
8. 直接刷新课程、登录和视频详情路径不出现平台 404。

## 8. 当前尚需项目负责人提供

- 一个空的 GitHub 仓库地址；
- 选定部署平台并完成账号登录；
- 视频对象存储空间，或可公开访问且支持视频播放的 HTTPS 地址。

DeepSeek Key 已由项目负责人本地配置；部署时只需在后端平台重新添加，不要发送到聊天中。
