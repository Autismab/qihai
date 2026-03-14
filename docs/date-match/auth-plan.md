# Date Match Auth 方案（MVP 正式化版）

## 目标

把项目从“demo 可跑”的 email-only 骨架，推进到“轻量但更正式”的 MVP auth：

- 有明确的注册 / 登录边界
- 密码不再明文或伪登录，而是哈希存储
- session 读取入口统一，业务层不再关心 cookie 细节
- 未登录用户的导航体验更清晰
- 仍然保持低复杂度，避免过早引入重型认证框架

这相当于先把火箭的一子级做扎实：先飞稳，再加复杂载荷。

## 当前落地方案

### 1. 认证模型

当前采用 **email + password + httpOnly session cookie**：

- 注册：`POST /api/auth/signup`
- 登录：`POST /api/auth/signin`
- 退出：`POST /api/auth/signout`
- 当前用户：`GET /api/auth/me`

实现特征：

- 邮箱统一做 trim + lowercase 归一化
- 注册时校验邮箱格式、密码最短长度、昵称长度
- 用户密码使用 **Node.js 内置 `crypto.scrypt`** 哈希
- 登录时使用安全比较校验密码哈希
- 登录成功后写入 `date-match-session` cookie

### 2. Session 结构

cookie 不再只是 `userId.signature`，而是：

- payload：`{ userId, issuedAt, version }`
- 先将 payload 做 base64url 编码
- 再用 `AUTH_SESSION_SECRET` 做 HMAC-SHA256 签名
- 最终格式：`payload.signature`

这样做的好处：

- 保持无数据库 session store 的轻量方案
- 可以为后续 session version / rotation / 过期控制留下结构空间
- current user 读取逻辑更清晰

### 3. 统一读取入口

认证工具集中在 `src/lib/auth.ts`：

- `createAuthSession()`
- `clearAuthSession()`
- `getCurrentSession()`
- `getCurrentUser()`
- `requireCurrentUser()`
- `ensureCurrentUser()`
- `registerWithPassword()`
- `signInWithPassword()`
- `getAuthErrorMessage()`

这意味着后续页面、server component、route handler 只拿“当前用户”，不碰底层 cookie 编解码。

### 4. 当前用户状态处理

`getCurrentSession()` 现在会统一做这些事情：

- 解析 cookie
- 验签
- 读取数据库中的 user / profile / preference
- 如果用户不存在，自动清理坏 session
- 如果用户状态不是 `ACTIVE`，视为未登录并清 session

这让 session 读取不再是“只要 cookie 长得像就算登录”，而是和数据库状态绑定。

### 5. Demo 兼容策略

当前仍保留 demo bootstrap，原因很现实：开发速度。

- `ensureDemoBootstrap()` 继续负责初始化题库和 demo 用户
- `ensureCurrentUser()` 在本地开发场景下仍可自动回退到 demo 用户
- 演示账号支持首次密码初始化，默认登录体验不被打断

这保证现在 onboarding / dashboard / match 流程继续可用，不会因为 auth 正式化而失去可演示性。

## 前端交互改进

### 登录 / 注册页

- 登录页增加密码输入
- 注册页增加密码输入
- 文案明确说明当前是“轻量正式版 auth”
- 增加返回首页入口
- 登录页给出开发环境演示账号提示

### 首页未登录体验

首页现在会根据 session 区分两种导航状态：

- **已登录**：显示“继续我的流程 / 查看当前匹配 / 退出登录”
- **未登录**：显示“创建账号 / 我已经有账号”

同时明确告诉用户：

- 介绍页可匿名浏览
- Dashboard / Onboarding 需要先登录

这比之前“所有人都看到同一套 CTA”更像真实产品。

## 为什么这版合理

如果现在就接入 Auth.js、OAuth、邮箱验证码、找回密码、数据库 session、风控限流，MVP 开发速度会明显下降。

当前方案的优势是：

- 比 email-only demo 登录靠谱很多
- 没有新增重依赖
- 保留统一 current user 入口
- 升级路径明确

本质上，它已经不是纯 demo，而是一个可以承载真实业务迭代的轻量 auth 底座。

## 当前限制

仍然有这些限制，别自欺欺人：

- 还没有邮箱验证
- 还没有忘记密码 / 重置密码
- 还没有登录限流与暴力破解防护
- 还没有 CSRF token 机制（当前主要依赖 sameSite=lax + JSON API）
- session 仍是签名 cookie，不是数据库持久化 session
- `ensureCurrentUser()` 里的 demo 自动兜底只适合开发，不适合直接上线

## 后续升级路径

### Phase 1：补 middleware 守卫

建议新增：

- `/dashboard`
- `/onboarding/*`
- `/match/*`

未登录时统一跳转 `/auth/signin`，避免每个页面各自处理。

### Phase 2：补 auth 风控

建议补：

- 登录失败次数限制
- 按 IP / email 的基础限流
- 注册频率控制
- 审计日志

### Phase 3：补账户完整能力

建议补：

- 邮箱验证
- 忘记密码
- 重置密码 token
- password change / session rotation

### Phase 4：升级为标准 auth 平台

如果后续要接第三方登录或邮件魔法链接，可以迁移到：

- **Auth.js / NextAuth**
- 或继续保持自研轻量 auth，但把 session 存到数据库

因为 current user 入口已经统一，所以这次替换不会波及业务层。

## 结论

现在的 Date Match auth 已从：

**“用 email 随便 upsert 一下的 demo 入口”**

推进到：

**“带密码哈希、输入校验、统一 session 解析和更清晰未登录体验的 MVP 认证底座”**。

这一步不花哨，但方向是对的。先把基础做硬，后面所有匹配、资料、周配逻辑才站得住。
