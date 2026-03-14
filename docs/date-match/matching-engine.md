# Matching Engine MVP

## 目标

当前实现不再是写死的 demo 对象，而是基于数据库里的真实 `profile / preference / surveyAnswers` 生成最小可用规则引擎结果。

## 输入数据

每个候选用户需要至少具备：

- `User.status = ACTIVE`
- `Profile.gender / birthYear / city`
- `Preference.relationshipGoal / weeklyActive`
- 至少 1 条 `SurveyAnswer`

如果这些核心字段不完整，则不会进入候选池。

## 引擎流程

实现在 `src/lib/matching-engine.ts`。

### 1. 候选筛选

`isEligibleForMatching()` 会过滤掉：

- 被暂停或非 ACTIVE 的用户
- 未开启 `weeklyActive`
- profile / preference 缺关键字段的用户
- 没有 survey answers 的用户

### 2. 双向条件判断

`buildMatchCandidatesForUser()` 会对当前用户和候选人做基础双向规则：

- 性别偏好匹配
- 年龄范围匹配
- 城市偏好匹配
- 至少一侧满足对方偏好才保留

`satisfiesOwnPreference()` 用同一套规则复用在 A->B 和 B->A。

### 3. 简化评分

`scorePair()` 当前总分 100，拆成三部分：

- `mutualPreferenceScore`：最高 50
  - 当前用户满足自己的偏好 +25
  - 候选人满足自己的偏好 +25
- `profileScore`：最高约 30
  - 同城 +10
  - 关系目标一致 +10
  - 年龄差更小得分更高 +10 / 6 / 2
- `surveyScore`：最高约 30
  - 共同题目分差越小越高
  - 问卷平均分接近再加少量奖励

### 4. 结果排序

候选结果按 `score` 倒序排列，保留前 5 个候选。

`generateMatchForUser()` 会选第一名作为本周最佳匹配，并写入 `Match`。

## Batch 复用

`runWeeklyMatchBatch()` 会：

1. 读取当前所有 eligible users
2. 对每个用户执行 `generateMatchForUser()`
3. 复用同一个 `weekKey` / `MatchBatch`
4. 返回 `eligible / generated / skipped` 汇总

Admin 按钮已改为通过 batch 入口执行，因此后续从 admin 扩展到真正每周批处理时，不需要再推翻现有 helper。

## Demo 与真实逻辑的关系

`src/lib/demo-match.ts` 现在只负责：

- 给 demo 用户和演示对象补基础资料
- 补 survey answers
- 调用 `generateMatchForUser()` 触发真实引擎

也就是说：demo 只负责造样本，不再自己写死 match 分数和解释。

## 当前限制

这是 MVP，不是最终生产版，仍有以下简化：

- 还没有全局去重配对，A 可能选 B，B 也可能选 A，各自生成独立记录
- 还没有黑名单/举报/历史跳过惩罚
- 还没有多维权重配置后台
- survey 只使用分值接近度，没有做维度级建模

但对于当前 demo 和 admin batch 场景，已经具备：

- 真实候选筛选
- 基础双向条件
- 简化评分
- 排序选择
- batch 复用能力
