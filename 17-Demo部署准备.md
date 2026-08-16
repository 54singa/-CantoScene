# 粤见 CantoScene｜Demo 部署准备

> 目标：以最少平台和最少手工操作发布一版可公开访问、可演示核心流程的 Demo。

## 1. 推荐组合

| 部分 | 推荐平台 | 原因 |
|---|---|---|
| 代码托管 | GitHub | 保存代码、文档和部署配置；MP4 不进普通 Git |
| 前端 | Render Static Site | 与后端共用一个 Blueprint，减少 Demo 期平台账号和配置 |
| 后端 | Render | 可长期运行 Fastify 服务并连接外部 PostgreSQL |
| 数据库 | Neon PostgreSQL | 标准 PostgreSQL，兼容现有 Prisma migration |
| 视频 | GitHub Releases（Demo 临时方案） | 无需支付方式；大文件不进入 Git 历史，后续通过环境变量迁移到对象存储 |

平台可以替换，但必须保留“标准 PostgreSQL + 后端私有密钥 + 视频对象存储”三个边界。

## 1.1 当前线上环境（2026-08-16）

- 前端：<https://cantoscene-web.onrender.com>
- 后端：<https://cantoscene-api.onrender.com>
- 健康检查：<https://cantoscene-api.onrender.com/api/v1/health>
- 数据库：Neon PostgreSQL，生产密钥仅保存在 Render 环境变量中；
- 视频：GitHub Release `demo-media-v1`，两个公开直链由 `VITE_VIDEO_01_URL` 与 `VITE_VIDEO_NESTLE_URL` 注入；
- 部署：GitHub `main` → Render Blueprint 手动同步；前端和后端均由根目录 `render.yaml` 管理。

GitHub Releases 仅用于低流量 Demo。正式公开运营前应迁移到支持视频分发的对象存储或 CDN，前端代码无需修改，只替换两个视频环境变量。

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

仓库根目录已提供 `render.yaml`。在 Render 选择 **Blueprint** 并连接 GitHub 仓库后，平台会自动使用新加坡区、免费 Web Service、构建命令、启动命令和健康检查配置。首次创建时只需在 Render 页面私密填写 `DATABASE_URL` 与 `DEEPSEEK_API_KEY`。

Blueprint 实际执行：

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

## 8. 当前部署状态

- [x] GitHub 仓库已创建并推送 `main`；
- [x] Neon PostgreSQL 已创建并完成 migration 与 Demo seed；
- [x] Render 后端已部署并通过健康检查；
- [x] Render 静态前端已部署，SPA 直接刷新正常；
- [x] 两个 MP4 已发布到 GitHub Release，并验证支持浏览器播放与 Range 请求；
- [x] DeepSeek Key 已仅配置在 Render 后端环境变量中；
- [x] 使用新账号完成公开地址上的注册、刷新保持登录、收藏、生词本、进度、学习汇总、退出与重新登录验收；
- [ ] 正式运营前把视频从 GitHub Releases 迁移到生产对象存储／CDN。

## 9. 公网验收记录（2026-08-16）

最终验收使用全新、无个人信息的测试账号，通过真实 Chrome 浏览器访问 Render 公网地址完成。以下项目全部通过：

- 首页封面、课程列表、课程详情和 Fish Audio 课程音频；
- 影视列表封面、两段视频元数据与播放资源；
- DeepSeek 字幕讲解及前端结果展示；
- 注册、刷新后恢复会话、退出与重新登录；
- 字幕收藏、收藏列表、生词本、视频进度和“我的学习”汇总；
- 所有验收路径均返回正常响应，没有非预期 HTTP 错误。

验收期间修复了跨站 refresh cookie 与 CORS 写请求方法两个生产配置问题，并分别增加集成测试和 CORS 预检测试。GitHub Releases 视频托管、Render 免费实例冷启动和未精修的旧视频字幕仍属于已知 Demo 限制。
