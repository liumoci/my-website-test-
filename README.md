# My Personal Website

个人网站项目，托管于 Cloudflare Pages。

## 模块

- **首页** (`/`) - 导航页，快速入口
- **关于我** (`/about/`) - 个人主页
- **博客** (`/blog/`) - 文章列表
- **云盘** (`/drive/`) - 文件分享
- **管理面板** (`/admin/`) - 网站管理（需登录）

## 目录结构

```
meweb/
├── index.html          # 首页（导航页）
├── _redirects          # Cloudflare 重定向规则
├── _headers            # Cloudflare 安全头配置
├── .gitignore          # Git 忽略文件
├── about/
│   └── index.html      # 个人主页
├── blog/
│   ├── index.html      # 博客列表
│   └── posts/          # 博客文章（按需创建）
├── drive/
│   └── index.html      # 云盘页面
├── admin/
│   ├── login.html      # 登录页
│   ├── index.html      # 管理面板主页
│   └── assets/
│       ├── css/
│       │   └── admin.css
│       └── js/
│           ├── auth.js     # 登录验证
│           └── dashboard.js # 面板功能
├── functions/          # Cloudflare Pages Functions（后端）
│   ├── admin/
│   │   └── _middleware.js # 登录验证中间件
│   └── api/
│       ├── login.js    # 登录接口
│       ├── logout.js   # 登出接口
│       ├── check-auth.js # 检查登录状态
│       └── init.js     # 初始化账号
├── assets/
│   ├── css/
│   │   └── style.css   # 全局样式
│   ├── js/
│   │   └── main.js     # 通用脚本
│   └── images/         # 图片资源
└── README.md
```

## 部署

使用 Cloudflare Pages 部署：

1. 将项目推送到 GitHub/GitLab 仓库
2. 在 Cloudflare Pages 中连接仓库
3. 构建命令：无（纯静态）
4. 输出目录：`/`（根目录）

## 本地预览

```bash
# 方法一：使用 Python
python -m http.server 8080

# 方法二：使用 Node.js
npx serve .

# 方法三：VS Code Live Server 插件
```

然后访问 `http://localhost:8080`

## 管理面板

访问路径：`/admin/`

### 技术方案

使用 **Cloudflare Pages Functions + KV** 实现后端验证，安全可靠：
- 密码 SHA-256 加盐哈希存储
- HttpOnly Cookie + Session Token
- 中间件自动验证所有 `/admin/*` 路径

### 首次使用

1. 部署完成后访问 `/admin/login.html`
2. 点击「首次使用？创建账号」
3. 设置你的用户名和密码
4. 创建成功后即可登录

### 配置步骤（必须）

部署前需要在 Cloudflare 配置 KV 存储：

**第一步：创建 KV 命名空间**
1. Cloudflare Dashboard → Workers & Pages → KV
2. 点击「Create a namespace」
3. 名称：`ADMIN_KV`（或自定义）
4. 点击「Add」

**第二步：绑定到 Pages 项目**
1. 进入你的 Pages 项目 → Settings → Functions
2. 找到「KV namespace bindings」
3. 点击「Add binding」
   - Variable name: `ADMIN_KV`（必须和代码中一致）
   - KV namespace: 选择刚才创建的命名空间
4. 点击「Save」
5. 重新部署项目（触发一次新的部署）

**第三步（推荐）：设置初始化密钥**

防止别人抢先创建管理员账号：
1. Pages 项目 → Settings → Environment variables
2. 点「Add variables」
   - Variable name: `INIT_SECRET`
   - Value: 你自己设的一串密钥（比如随机字符串）
   - 勾选「Encrypt」加密存储
3. Save → 重新部署

> 设置密钥后，创建账号时必须输入正确的密钥才能创建。
> 如果不设置 `INIT_SECRET`，则任何人都可以创建第一个账号（不推荐）。

**第四步（推荐）：设置万能重置密钥**

忘记密码时用重置密钥重新设置账号：
1. Pages 项目 → Settings → Environment variables
2. 点「Add variables」
   - Variable name: `RESET_SECRET`
   - Value: 一串万能密钥（作为最后手段）
   - 勾选「Encrypt」加密存储
3. Save → 重新部署

### 重置密钥机制

系统有**两种**重置密钥：

1. **一次性重置密钥**（自动轮换）
   - 首次创建账号时自动生成
   - **用一次就变**，每次重置后自动生成新密钥
   - 可以在管理面板「系统设置」中查看和手动刷新
   - 初始化成功和重置成功时会弹窗显示，请务必保存

2. **万能重置密钥**（环境变量 `RESET_SECRET`）
   - 你手动设置的，始终有效
   - 作为最后手段，万一连一次性密钥也丢了
   - 可选，但建议设置

> 日常用一次性重置密钥就行，万能密钥作为备份保存好。

### 修改密码

目前需要在 KV 中手动操作：
1. Cloudflare Dashboard → KV → 你的命名空间
2. 删除 `system_initialized` 这个 key
3. 删除 `user:你的用户名` 这个 key
4. 重新访问登录页，点击「创建账号」设置新密码

> 后续可以添加修改密码的功能页面
"# my-website-test-" 
"# my-website-test-" 
