# MemeSee

MemeSee 是一个前后端分离的社区内容应用，包含用户认证、社区目录、主帖/回复、点赞收藏、通知、媒体上传、首页信息流和搜索索引等能力。

当前仓库是本地开发优先的精简版本：保留可运行应用所需的前端、后端服务、数据库迁移和基础设施编排，已移除旧的 CI、监控面板、烟测脚本、发布脚本和 OpenAPI 生成链路。

## 项目结构

```text
memesee
├─ backend
│  ├─ platform-common       # 公共错误模型、JWT、缓存、日志和请求关联工具
│  ├─ user-service          # 用户注册登录、用户等级/活跃度、内部发帖事件
│  ├─ content-service       # 社区、主帖、回复、互动、通知、媒体、信息流、搜索
│  └─ gateway-service       # Spring Cloud Gateway，统一转发 /api/**
├─ frontend                 # React + Vite 单页应用
├─ db/init                  # MySQL 初始化数据库和应用账号
└─ docker-compose.yml       # 本地基础设施
```

## 技术栈

- Frontend: React 18, Vite 5, Axios, React Markdown, Remark GFM
- Backend: Java 21, Spring Boot 3.3.5, Spring Cloud Gateway 2023.0.3
- Data: MySQL 8.4, Flyway, Spring Data JPA, MyBatis
- Cache & Async: Redis 7.4, RabbitMQ 4.1, Caffeine, Redisson, transactional outbox
- Search & Media: Meilisearch, MinIO, WebP media variants
- Auth: JWT

## 本地依赖

请先准备：

- Docker Desktop / Docker Compose
- JDK 21
- Maven 3.9+
- Node.js 18+ 和 npm

本仓库没有提交 Maven Wrapper，所以需要本机可用的 `mvn` 命令。

## 启动基础设施

在仓库根目录执行：

```powershell
Copy-Item .env.example .env
# 编辑 .env，把所有 replace-with-* 换成强随机值
docker compose up -d
```

默认会启动：

| 服务 | 端口 | 说明 |
| --- | --- | --- |
| MySQL | `127.0.0.1:3307 -> 3306` | 初始化 `memesee_user`、`memesee_content` 两个库 |
| Redis | `127.0.0.1:6379` | 缓存与分布式锁，启用密码 |
| RabbitMQ | `127.0.0.1:5672`, `127.0.0.1:15672` | 媒体变体异步处理队列 |
| MinIO | `127.0.0.1:9000`, `127.0.0.1:9001` | 媒体对象存储 |
| Meilisearch | `127.0.0.1:7700` | 主帖搜索索引 |

数据库初始化脚本位于 `db/init/01-init.sh`。首次启动容器时会根据 `.env` 创建应用数据库和应用用户。

## 启动后端

建议先在后端根目录构建一次公共模块和服务依赖：

```powershell
cd backend
mvn -DskipTests install
```

然后分别在新的终端中从仓库根目录启动三个服务：

```powershell
cd backend/user-service
mvn spring-boot:run
```

```powershell
cd backend/content-service
mvn spring-boot:run
```

```powershell
cd backend/gateway-service
mvn spring-boot:run
```

默认端口：

| 服务 | 地址 |
| --- | --- |
| gateway-service | `http://localhost:8080` |
| user-service | `http://localhost:8081` |
| content-service | `http://localhost:8083` |

前端默认通过 Vite 代理访问网关：`/api/** -> http://127.0.0.1:8080`。

## 启动前端

```powershell
cd frontend
npm install
npm run dev
```

默认访问地址：

```text
http://localhost:5173
```

`frontend/.env.example` 中的 `VITE_API_BASE` 默认为空，表示走同源 `/api` 代理。若前端不通过 Vite 代理访问，可以设置为网关地址，例如：

```text
VITE_API_BASE=http://localhost:8080
```

## 常用配置

默认配置可直接本地运行。需要覆盖时，可通过环境变量设置：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `JWT_SECRET` / `APP_SECURITY_JWT_SECRET` | `change_me_to_a_long_secret_at_least_32_chars` | 用户与内容服务共享的 JWT 密钥 |
| `APP_SECURITY_JWT_EXPIRATION_SECONDS` | `86400` | JWT 有效期 |
| `USER_DB_URL` | `jdbc:mysql://127.0.0.1:3307/memesee_user...` | 用户库连接 |
| `CONTENT_DB_URL` | `jdbc:mysql://127.0.0.1:3307/memesee_content...` | 内容库连接 |
| `USER_DB_USERNAME` / `CONTENT_DB_USERNAME` | `memesee_app` | 数据库用户名 |
| `USER_DB_PASSWORD` / `CONTENT_DB_PASSWORD` | `memesee_app_password` | 数据库密码 |
| `MEMESEE_REDIS_HOST` / `MEMESEE_REDIS_PORT` / `MEMESEE_REDIS_PASSWORD` | `127.0.0.1` / `6379` / 空 | Redis 连接 |
| `MEMESEE_RABBITMQ_HOST` / `MEMESEE_RABBITMQ_PORT` | `127.0.0.1` / `5672` | RabbitMQ 连接 |
| `CONTENT_MEDIA_PROCESSING_ASYNC_ENABLED` | `false` | 是否启用 RabbitMQ 异步生成媒体变体 |
| `CONTENT_MEDIA_PROCESSING_MAX_ATTEMPTS` | `3` | 媒体变体队列最大重试次数，失败后进入 DLQ |
| `CONTENT_MEDIA_MINIO_ENDPOINT` | `http://127.0.0.1:9000` | MinIO API 地址 |
| `CONTENT_MEDIA_MINIO_AUTO_CREATE_BUCKET` | `true` | 是否自动创建媒体 bucket；生产可在预先建好 bucket 后关闭 |
| `CONTENT_MEDIA_MAX_BYTES` | `20971520` | 单个媒体文件业务限制，默认 20 MiB |
| `CONTENT_MEDIA_DIRECT_DELIVERY_ENABLED` | `false` | 是否让响应中的已生成图片变体使用对象存储/CDN 直出 URL |
| `CONTENT_MEDIA_PUBLIC_BASE_URL` | 空 | 直出 URL 前缀，通常指向公开 bucket 或 CDN 路径 |
| `CONTENT_SEARCH_MEILISEARCH_URL` | `http://127.0.0.1:7700` | Meilisearch 地址 |
| `USER_SERVICE_URL` | `http://localhost:8081` | 内容服务调用用户服务 |
| `CONTENT_SERVICE_URL` | `http://localhost:8083` | 网关转发内容服务 |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | 网关 CORS 主来源 |
| `USER_INTERNAL_SERVICE_TOKEN` / `APP_SECURITY_INTERNAL_SERVICE_TOKEN` | `change_me_internal_service_token` | 内部接口凭证 |

线上启动建议启用 `prod` profile：

```powershell
$env:SPRING_PROFILES_ACTIVE="prod"
```

`application-prod.yml` 不为数据库密码、Redis 密码、JWT 密钥、内部服务令牌、MinIO 密钥和 Meilisearch Key 提供默认值，缺失时服务会启动失败。

## 功能模块

- 用户：注册、登录、当前用户资料、阅读/互动活跃度上报、等级进度。
- 社区：内容服务启动时自动补齐默认社区目录，包括 `daily`、`article`、`tech`、`news`、`game`、`animation`、`comic`、`gallery`。
- 内容：主帖、回复、媒体附件、浏览量、热度、最近回复排序。
- 互动：主帖和回复的点赞、收藏、个人互动列表。
- 通知：互动与回复相关通知、已读状态、未读数量缓存。
- 信息流：`/api/feed` 基于 `main_post_feed_items` 投影表查询，支持社区过滤、关键词和排序。
- 搜索：主帖索引写入 Meilisearch，可通过内部接口重建索引。
- 媒体：上传图片到 MinIO，生成 WebP 优先的缩略图、小图、中图和展示图，支持 RabbitMQ 异步处理、处理状态、失败重试和可选 CDN/对象存储直出。

## 主要接口

所有公开接口建议经由网关 `http://localhost:8080` 调用。

| 模块 | 路径 |
| --- | --- |
| 用户 | `POST /api/users/register`, `POST /api/users/login`, `GET /api/users/me` |
| 社区 | `GET /api/communities`, `GET /api/communities/{communitySlug}` |
| 信息流 | `GET /api/feed` |
| 主帖 | `GET/POST /api/main-posts`, `GET/PUT/DELETE /api/main-posts/{mainPostId}` |
| 回复 | `GET/POST /api/main-posts/{mainPostId}/sub-posts`, `PUT/DELETE /api/sub-posts/{subPostId}` |
| 互动 | `/api/main-posts/{id}/likes`, `/api/main-posts/{id}/favorites`, `/api/sub-posts/{id}/likes`, `/api/sub-posts/{id}/favorites` |
| 媒体 | `POST /api/media-assets`, `GET /api/media-assets/{assetId}`, `GET /api/media-assets/{assetId}/binary` |
| 通知 | `GET /api/notifications`, `PATCH /api/notifications/read-state` |

内部维护接口需要请求头 `X-Internal-Service-Token`：

```powershell
curl -X POST "http://localhost:8083/internal/feed/main-posts/rebuild" `
  -H "X-Internal-Service-Token: change_me_internal_service_token"

curl -X POST "http://localhost:8083/internal/search/main-posts/rebuild" `
  -H "X-Internal-Service-Token: change_me_internal_service_token"

curl -X POST "http://localhost:8083/internal/media-assets/variants/retry-failed?limit=20" `
  -H "X-Internal-Service-Token: change_me_internal_service_token"

curl -X POST "http://localhost:8083/internal/media-assets/123/variants/retry" `
  -H "X-Internal-Service-Token: change_me_internal_service_token"
```

## 本地注册提示

注册接口要求邀请码。当前迁移只创建 `invite_codes` 表，不会预置邀请码。开发环境可手动插入一条：

```sql
INSERT INTO invite_codes
  (code, max_uses, used_count, disabled, expires_at, created_at, used_at, used_by)
VALUES
  ('MEMESEE', 100, 0, false, NULL, UTC_TIMESTAMP(6), NULL, NULL);
```

然后前端注册时使用 `DEV2026`。

## 数据与迁移注意

- 两个后端服务都启用 Flyway，应用启动时会自动执行各自的 `src/main/resources/db/migration`。
- `content-service` 的 `V14__reset_content_and_add_media_asset_variants.sql` 会清空已有内容、互动、通知和媒体记录，用于切换媒体变体模型；不要直接用于需要保留旧内容数据的环境。
- MinIO bucket 默认为 `memesee-post-images`，内容服务会按配置自动创建。
- 媒体变体队列使用死信队列 `memesee.media.variant-processing.dlq`。如果已上线环境中存在旧的同名 RabbitMQ 队列，修改 DLX 参数后需要删除旧队列再让服务自动重建。

## 生产图片直出与 CDN

默认 `CONTENT_MEDIA_DIRECT_DELIVERY_ENABLED=false`，前端会通过网关访问 `GET /api/media-assets/{assetId}/binary`，适合本地开发和未配置公开对象存储的环境。上线后建议改为对象存储或 CDN 直出，减少后端带宽占用并提升大图打开速度：

```env
CONTENT_MEDIA_DIRECT_DELIVERY_ENABLED=true
CONTENT_MEDIA_PUBLIC_BASE_URL=https://cdn.example.com/memesee-post-images
```

`CONTENT_MEDIA_PUBLIC_BASE_URL` 必须指向可公开读取的 bucket 根路径或 CDN 前缀。对象 key 会追加在该前缀后，例如响应中的 `displayUrl` 会变成 `https://cdn.example.com/memesee-post-images/main-posts/.../display.webp`。

如果暂时不用独立 CDN，也可以用 Nginx 反代 MinIO 的 bucket 路径：

```nginx
location /media/ {
  proxy_pass http://minio:9000/memesee-post-images/;
  proxy_set_header Host $host;
  expires 365d;
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

此时可设置 `CONTENT_MEDIA_PUBLIC_BASE_URL=https://example.com/media`。MinIO 控制台端口、RabbitMQ 管理端口、数据库端口不要暴露到公网；只开放前端、网关和经过反代的媒体读取路径。若 bucket 设置为公开读取，建议仅放置帖子图片这类允许公开访问的对象。

## 服务器部署与更新

生产部署推荐使用 `docker-compose.prod.yml`。服务器只需要保留 `.env`、Docker 数据卷和 Nginx 配置；本地写完新版本后提交到 Git，服务器执行部署脚本即可更新。

首次部署到 `memesee.world`：

```bash
sudo mkdir -p /opt
cd /opt
git clone <你的仓库地址> memesee
cd /opt/memesee
cp deploy/.env.production.example .env
```

编辑 `.env`，替换所有 `replace-with-...`，并确认：

```env
FRONTEND_ORIGIN=https://memesee.world
CONTENT_MEDIA_DIRECT_DELIVERY_ENABLED=true
CONTENT_MEDIA_PUBLIC_BASE_URL=https://memesee.world/media
```

启动或更新：

```bash
cd /opt/memesee
bash deploy/deploy.sh
```

`deploy/deploy.sh` 会执行：

- `git pull --ff-only`
- `docker compose -f docker-compose.prod.yml up -d --build`
- 自动安装 Nginx 站点配置
- 若存在 `/etc/letsencrypt/live/memesee.world/fullchain.pem`，自动使用 HTTPS 配置；否则先使用 HTTP 配置
- 检查网关和前端本地端口是否可用

申请 HTTPS 证书可在首次 HTTP 配置生效后执行：

```bash
sudo certbot --nginx -d memesee.world -d www.memesee.world
bash deploy/deploy.sh
```

生产流量路径：

```text
浏览器 -> Nginx :443
  /        -> 127.0.0.1:3000 -> frontend 容器
  /api/    -> 127.0.0.1:8080 -> gateway-service 容器
  /media/  -> 127.0.0.1:9000 -> MinIO bucket: memesee-post-images
```

`minio-init` 容器会自动创建 `memesee-post-images` bucket，并设置匿名下载权限，让 `https://memesee.world/media/...` 可以直接读取帖子图片。MinIO 管理端口仍然只绑定 `127.0.0.1`，不要直接暴露到公网。

之后每次本地开发完成：

```bash
git add .
git commit -m "你的更新说明"
git push
```

服务器执行：

```bash
cd /opt/memesee
bash deploy/deploy.sh
```

## 上线前检查

- 复制 `.env.example` 为 `.env` 后替换所有 `replace-with-...`，不要沿用示例密钥。
- 生产后端使用 `SPRING_PROFILES_ACTIVE=prod`，确保 `APP_SECURITY_JWT_SECRET`、`APP_SECURITY_INTERNAL_SERVICE_TOKEN`、数据库密码、Redis 密码、RabbitMQ 密码、MinIO 密钥和 Meilisearch Key 都已设置。
- 只对公网暴露前端站点、网关入口和可选的 `/media/` 反代路径；MySQL、Redis、RabbitMQ、MinIO API/Console、Meilisearch 继续绑定内网或 `127.0.0.1`。
- 图片链路以 `mediaAssets` 的 `thumb/small/medium/display/original` 为准；旧 Redis 媒体缓存 key 不再读取，旧测试图片或旧帖子可直接清空重建。
- 第一次上线或修改 RabbitMQ 队列参数后，若 RabbitMQ 已有同名旧队列，需要删除旧队列再启动内容服务，让队列以当前 DLX 参数重建。

## 清空本地测试数据

本项目现在以新上传媒体的多尺寸 WebP 链路为准。若本地旧测试图片或旧帖子影响排查，可以直接清空本地 Docker 数据卷：

```powershell
.\scripts\reset-local-data.ps1 -ConfirmReset
```

这个命令会删除本地 MySQL、Redis、RabbitMQ、MinIO、Meilisearch 数据卷并重新启动基础设施。线上服务器不要使用该脚本。

## 常用命令

```powershell
# 查看基础设施状态
docker compose ps

# 停止基础设施
docker compose down

# 停止并清空本地数据卷
docker compose down -v

# 停止并清空本地数据卷，然后重启基础设施
.\scripts\reset-local-data.ps1 -ConfirmReset

# 后端构建，需在仓库根目录执行
cd backend
mvn -DskipTests install

# 前端生产构建，需在仓库根目录执行
cd ..\frontend
npm run build
```
