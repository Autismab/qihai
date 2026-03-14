# date-match 开发向测试报告

- 测试时间：2026-03-13
- 测试环境：本地 Next.js dev / Prisma SQLite（`dev.db`）
- Build 验证：`npm run build` 通过

## 本次覆盖范围

已检查页面：

- `/`
- `/onboarding/profile`
- `/onboarding/preferences`
- `/onboarding/survey`
- `/dashboard`
- `/match/current`

已检查 API：

- `POST /api/me/bootstrap`
- `GET/POST /api/me/profile`
- `GET/POST /api/me/preferences`
- `GET/POST /api/me/survey`

---

## 结论摘要

1. **页面路由均可正常返回 200**，基础 UI 骨架可访问。
2. **核心 API 链路在单实例 dev 环境下可跑通**：bootstrap -> profile -> preferences -> survey 的读写链路正常。
3. **`npm run build` 成功**，当前代码可完成生产构建。
4. **已验收 survey -> dashboard 联动链路**：问卷保存后，`surveyCompletion`、`overallCompletion`、`nextActions`、`poolStatus` 会随资料状态实时变化。
5. 发现 1 个联动层面的边界问题并已修复：
   - **dashboard 原先直接用 `surveyAnswers.length` 计算问卷完成度**，理论上在题库调整或异常数据场景下可能把完成度抬到 100% 以上，并连带拉高 `overallCompletion`。

---

## 详细测试记录

### 1) Build 验证

执行命令：

```bash
npm run build
```

结果：通过。

说明：

- Next.js 16.1.6 build 成功
- TypeScript 检查通过
- 关键页面与 `/api/me/*` 路由均被正确识别

---

### 2) 页面访问检查

在本地 dev 服务下访问以下页面，均返回 HTTP 200：

- `/`
- `/onboarding/profile`
- `/onboarding/preferences`
- `/onboarding/survey`
- `/dashboard`
- `/match/current`

说明：

- 当前这些页面多数是静态展示或客户端发起请求，**页面壳本身没有阻塞性错误**。
- 但页面是否真正可用，还取决于其依赖的 `/api/me/*` 是否已先完成 bootstrap。

---

### 3) API 链路检查

#### 3.1 正常链路

按以下顺序测试：

1. `POST /api/me/bootstrap`
2. `POST /api/me/profile`
3. `POST /api/me/preferences`
4. `POST /api/me/survey`
5. 再次 `GET` 各接口验证写入结果

结果：**链路可跑通**。

验证到的现象：

- bootstrap 可创建 demo user，并写入问卷题目
- profile 可保存昵称、性别、出生年份、城市、bio
- preferences 可保存目标性别、关系目标、年龄区间、城市偏好、weeklyActive
- survey 可保存答案，并在后续 GET 中读出

---

#### 3.2 全新库场景复现

复现步骤：

1. 删除本地 `dev.db`
2. 重新执行 `prisma db push`
3. 启动 dev server
4. 直接请求以下接口（**不先调用 bootstrap**）：
   - `GET /api/me/profile`
   - `GET /api/me/preferences`
   - `GET /api/me/survey`

结果：以上接口均返回 **404**：

```json
{"error":"Demo user not initialized"}
```

这意味着：

- 当前系统默认依赖 `POST /api/me/bootstrap` 先创建 demo user
- 但页面实现上并不一致：
  - `onboarding/profile` 会先调用 bootstrap
  - `onboarding/survey` 也会先调用 bootstrap
  - `onboarding/preferences` **不会**先调用 bootstrap

所以如果用户直接打开 `/onboarding/preferences`，在新库/新环境下就会出现：

- 页面本身 200
- 但依赖接口返回 404
- 前端缺少明确错误提示或自动自愈逻辑

---

## 发现的问题

### 问题 1：bootstrap 前置依赖不一致

**严重度：中**

#### 现象

在空数据库场景下，`/api/me/profile`、`/api/me/preferences`、`/api/me/survey` 都依赖 demo user 已存在；否则返回 404。

但前端页面只在部分页面执行 bootstrap：

- profile：有 bootstrap
- survey：有 bootstrap
- preferences：无 bootstrap

#### 复现路径

1. 清空 `dev.db`
2. 运行 `npx prisma db push`
3. 启动 `npm run dev`
4. 直接打开 `/onboarding/preferences`
5. 观察其依赖的 `GET /api/me/preferences` 返回 404

#### 风险

- 页面行为取决于访问顺序，不稳定
- 开发联调时容易误判为“偶发错误”
- 后续如果接入真实鉴权，这种隐式初始化模式会更难维护

#### 建议修复

优先级从高到低建议：

1. **最佳方案**：将 demo user 初始化从页面侧前置，收敛到 API 层或统一 session 初始化逻辑。
   - 例如在 `getDemoUser()` 中做 `findUnique + upsert/create` 兜底
   - 或让 `GET /api/me/*` 在未初始化时自动完成 demo user 初始化
2. 次优方案：所有 onboarding 页面进入时统一先调用 bootstrap
3. 同时补一个明确错误 UI，而不是仅靠状态文案

---

### 问题 2：profile 接口原先无法清空 nickname

**严重度：低**

#### 现象

原实现中：

```ts
if (body.nickname) {
  await prisma.user.update(...)
}
```

这会导致：

- 当用户传空字符串 `""` 时，不会执行 update
- 旧昵称会被保留，无法清空

#### 复现路径

1. 先保存一个非空 nickname
2. 再提交 `nickname: ""`
3. 重新 GET `/api/me/profile`
4. 发现 nickname 仍是旧值

#### 已修复

已将逻辑调整为：

- 只要请求体显式包含 `nickname` 字段，就执行更新
- 空字符串会被写成 `null`

修复文件：

- `src/app/api/me/profile/route.ts`

---

## 其他观察

### 1) dashboard 已接真实聚合，match/current 仍是占位

当前状态：

- `dashboard` **已经接上真实聚合逻辑**（`getDashboardSnapshot()`），会直接读取 Prisma/SQLite 中的 profile / preference / survey / match 数据。
- `/match/current` 仍主要是结果页占位。

本次额外验收到的联动行为：

- survey 未完成时：
  - `surveyCompletion` < 100
  - `overallCompletion` 同步低于满值
  - `nextActions` 包含“完成剩余问卷题目”
  - `poolStatus` 保持“暂未满足入池条件”或“已暂停入池”
- survey 完成，且 profile / preference 核心字段满足、`weeklyActive=true` 时：
  - `surveyCompletion` 变为 100
  - `overallCompletion` 同步抬升
  - `nextActions` 会移除问卷相关待办
  - `poolStatus` 变为“已满足入池条件，本周可参与匹配”
- 若 `weeklyActive=false`，即使问卷完成：
  - `poolStatus` 仍显示“你已手动关闭本周入池”
  - `nextActions` 会提示“重新开启每周匹配”

本次修复：

- 将 dashboard 的问卷完成度统计改为“按唯一题目数计算，并对百分比做 0~100 clamp”。
- 这样即使未来题库增题、历史答案残留，或数据库存在异常重复数据，也不会出现 `surveyCompletion` / `overallCompletion` 被错误抬高的问题。

建议：

- 后续补一个只读型 match API
- 让 `/match/current` 也展示真实 demo 数据来源，而不是仅保留静态文案

### 2) 开发环境下多实例 `next dev` 容易造成误判

测试时发现：

- 如果已有一个 `next dev` 占用 3000
- 再起一个实例，会切到 3001，且可能因 `.next/dev/lock` 无法正常工作

这会造成：

- 你以为测的是新代码，实际上打到旧进程
- API 500 / 连接失败看起来像业务问题，实则是 dev 进程冲突

建议：

- 联调前先确保只跑一个 dev server
- 或在 README 中补一句“若端口被占用，请先清理旧进程”

---

## 本次已做的小修复

### 修复项：允许清空 nickname

修改文件：

- `src/app/api/me/profile/route.ts`

修改效果：

- `POST /api/me/profile` 现在支持将 nickname 清空为 `null`
- 行为与表单编辑预期一致

---

## 建议的下一步

1. **优先统一 bootstrap 策略**，不要让页面访问顺序决定接口是否可用。
2. 给 onboarding 页面补错误态/UI 反馈，至少在 API 404/500 时提示“初始化失败或未创建 demo 用户”。
3. 给 `dashboard` 和 `/match/current` 接上最小只读 demo API，避免页面与真实数据完全脱节。
4. 如果准备继续演进成真实用户系统，建议尽早把“demo user”逻辑收口，避免散落在多个页面 `useEffect` 中。
