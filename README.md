# My Personal Website

个人网站项目，托管于 Cloudflare Pages + KV。

## 模块

- **首页** (`/`) - 导航页，动态加载导航卡片和链接
- **个人主页** (`/about/`) - 清新可爱风格，头像+表情、小计划、时光进度、技术栈、社交按钮
- **博客** (`/blog/`) - Firefly 风格三栏布局，文章列表+详情
- **云盘** (`/drive/`) - 文件跳转模式，支持提取密码
- **留言箱** (`/guestbook/`) - 毛玻璃风格，多级回复、站长回复、黑名单
- **管理面板** (`/admin/`) - 网站管理（需登录）

## 功能特性

### 个人主页
- 头像 URL + 头像旁表情（emoji选择器）
- 渐变艺术字名字 + 位置/学校标签
- 小计划/待办列表
- 时光进度条（今天/本周/本月/今年）
- 自我介绍（支持HTML）+ 技术栈图标 + 引用语
- 彩色社交按钮（QQ、邮箱、GitHub、Telegram、B站、博客、网易云、留言箱）
- 自定义背景图 URL、遮罩透明度、高斯模糊
- **所有图片用 URL，不存 base64 到 KV**

### 博客
- Firefly 清新风格三栏布局
- 文章卡片（封面+标题+摘要+标签）
- 文章详情页
- 在线编辑器 + Word/TXT 文档上传
- 批量操作 + 回收站
- 自定义背景图 URL、透明度、联系方式

### 云盘
- 文件列表跳转模式
- 自定义标题、描述、提取密码
- 批量上传/删除/编辑

### 留言箱
- 多级回复（用户可回复用户，站长可回复所有人）
- 站长标记
- IP 黑名单
- 自定义背景色、主题色、背景图 URL
- 批量拉黑/删除

### 管理面板
- 📊 概览 - 访问量、文章数、文件数统计
- 📝 博客管理 - 文章 CRUD、在线编辑、文件上传、批量操作、回收站
- 👤 个人主页 - 头像 URL、表情、昵称、位置、学校、简介、引用语、小计划、技能、背景设置、联系方式
- ☁️ 网盘管理 - 页面设置、文件列表管理
- 💬 留言管理 - 留言列表、设置（背景图 URL）、黑名单、批量模式
- 🔗 导航管理 - 链接管理、卡片管理、背景设置
- 📈 访问统计 - Cloudflare Analytics 数据
- ⚙️ 系统设置 - 网站名称、修改密码、重置密钥、一键跑路模式

### 一键跑路模式
- 开启后除管理面板外所有页面显示"站长已跑路"+ 404 图案
- 在系统设置中实时开关

## 目录结构

```
meweb/
├── index.html              # 首页（导航页）
├── _redirects              # Cloudflare 重定向规则
├── _headers                # Cloudflare 安全头配置
├── .gitignore              # Git 忽略文件
├── about/
│   └── index.html          # 个人主页（清新可爱风格）
├── blog/
│   ├── index.html          # 博客列表页（三栏布局）
│   └── posts/
│       ├── index.html      # 文章详情页
│       └── example.html    # 示例文章
├── drive/
│   └── index.html          # 云盘页面（跳转模式）
├── guestbook/
│   └── index.html          # 留言箱页面
├── admin/
│   ├── login.html          # 登录页
│   ├── index.html          # 管理面板主页
│   └── assets/
│       ├── css/
│       │   └── admin.css   # 管理面板样式
│       └── js/
│           ├── auth.js     # 登录/初始化/重置密码
│           └── dashboard.js # 面板核心逻辑
├── nav-admin/              # 独立导航管理（备用）
├── functions/              # Cloudflare Pages Functions（后端）
│   ├── _middleware.js      # 全站中间件（一键跑路模式）
│   ├── admin/
│   │   └── _middleware.js  # 管理面板登录验证
│   ├── nav-admin/
│   │   └── _middleware.js  # 导航管理登录验证
│   └── api/                # API接口
│       ├── login.js, logout.js, check-auth.js, init.js
│       ├── reset.js, reset-secret.js, change-password.js
│       ├── settings.js, site-status.js, analytics.js
│       ├── profile.js, blog-settings.js
│       ├── nav.js, nav-login.js
│       ├── messages.js + messages/ (子路由)
│       ├── drive-settings.js + drive-settings/
│       ├── drive-items.js + drive-items/
│       └── posts.js + posts/
├── assets/
│   ├── css/
│   │   ├── style.css       # 全局样式
│   │   └── guestbook.css   # 留言箱样式
│   ├── js/
│   │   ├── main.js         # 通用脚本
│   │   ├── about.js        # 个人主页逻辑（备用）
│   │   └── guestbook.js    # 留言箱逻辑
│   └── images/             # 图片资源
├── README.md
└── 目录结构说明.md
```

## 部署

使用 Cloudflare Pages 部署：

1. 将项目推送到 GitHub/GitLab 仓库
2. 在 Cloudflare Pages 中连接仓库
3. 构建命令：无（纯静态）
4. 输出目录：`/`（根目录）

### 配置 KV 存储（必须）

1. 创建 KV 命名空间，名称 `ADMIN_KV`
2. 在 Pages 项目 → Settings → Functions → KV namespace bindings 中绑定
   - Variable name: `ADMIN_KV`
3. 重新部署

### 环境变量（推荐）

| 变量名 | 说明 |
|--------|------|
| `INIT_SECRET` | 初始化密钥，防止他人抢先创建账号 |
| `RESET_SECRET` | 万能重置密钥，忘记密码时使用 |

## 本地预览

```bash
python -m http.server 8080
# 或
npx serve .
```

> 注意：本地预览时后端 API（Functions）无法运行，管理面板等需要登录的功能不可用。

## 管理面板

访问路径：`/admin/`

### 技术方案
- Cloudflare Pages Functions + KV
- 密码 SHA-256 加盐哈希存储
- HttpOnly Cookie + Session Token
- 中间件自动验证所有 `/admin/*` 路径

### 首次使用
1. 部署完成后访问 `/admin/login.html`
2. 点击「首次使用？创建账号」
3. 设置用户名和密码（如设置了 INIT_SECRET 需输入密钥）
4. 创建成功后即可登录

## 性能注意事项

- **图片一律用 URL**，不要上传 base64 到 KV
- KV 单个 value 建议不超过 100KB
- 头像、背景图等使用外部图床或 CDN 链接
