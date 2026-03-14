# 启东相亲平台 V1 字段开发表

## 1. 文档目标

本文档用于统一 **产品、前端、后端、测试** 对“启东本地严肃相亲/婚恋平台 V1”字段设计、匹配规则、展示规则、联系方式开放机制、每日推荐机制的理解。

目标不是做“大而全”的泛社交产品，而是做一个 **启东本地、以结婚为目标、资料真实、条件明确、推荐少而准** 的婚恋平台。

---

## 2. 产品定位一句话

**面向启东及启东相关人群（含在外地工作的启东人）的严肃相亲平台，以真实资料、明确择偶条件和少而精准的每日推荐，帮助用户高效进入以结婚为目标的双向了解。**

---

## 3. V1 产品原则

### 3.1 核心原则

1. **严肃婚恋优先，不做泛交友**
   - 所有字段、推荐、展示都服务于“是否适合进入婚恋沟通”。
   - 弱化娱乐互动、弱化刷卡式沉迷设计。

2. **真实优先，资料完整优先**
   - V1 先通过字段完整度、实名认证/人工校验预留位、资料一致性约束提升真实性。
   - 不追求“用户量大”，优先追求“有效用户密度高”。

3. **启东本地场景优先**
   - 强化“老家/籍贯、现工作地、是否接受异地、是否接受未来回启东发展”等字段。
   - 默认支持“人在外地、关系在启东落地”的婚恋路径。

4. **少而准的推荐优先，不做信息泛滥**
   - 每天只给少量高质量推荐：**1 个主推荐 + 2~3 个备选**。
   - 双向条件不满足的，不进入推荐池。

5. **隐私分级开放**
   - 联系方式不默认公开。
   - 仅在双方明确同意后开放联系方式。

6. **平台撮合，不做人工媒人**
   - V1 不引入红娘、人工撮合顾问、线下牵线服务。
   - 所有匹配基于字段、规则、行为信号进行。

### 3.2 V1 不做什么

- 不做群聊、广场动态、附近陌生人社交
- 不做直播、语音房、礼物体系
- 不做复杂 MBTI/星座人格推荐主逻辑
- 不做人工红娘介入式撮合
- 不做无限下滑式推荐流

---

## 4. V1 业务对象与状态定义

## 4.1 用户基础对象

平台核心对象：`UserProfile`

V1 用户至少包含三层信息：
1. **基础身份信息**：年龄、性别、籍贯、所在地、婚育情况等
2. **婚恋关键信息**：学历、职业、收入、房车、是否接受异地、是否考虑回启东发展等
3. **择偶要求信息**：年龄、婚姻状态、子女情况、地域接受度等

## 4.2 关键状态

建议后端维护以下状态字段：

- `profileStatus`: `draft` / `submitted` / `approved` / `rejected`
- `verificationStatus`: `unverified` / `basic_verified` / `id_verified`
- `contactUnlockStatus`: `locked` / `pending` / `unlocked`
- `availabilityStatus`: `active` / `paused` / `hidden`

说明：
- `approved` 前不进入推荐池
- `availabilityStatus=paused/hidden` 时不参与每日推荐
- `contactUnlockStatus` 用于控制联系方式开放链路

---

## 5. 用户资料字段表（Profile）

> 说明：
> - “是否参与匹配”表示该字段是否进入推荐/筛选逻辑。
> - “匹配作用”分为：`硬过滤` / `加分项` / `仅展示`
> - “是否前台展示”表示在对外资料卡/详情页是否展示给潜在对象。
> - 英文字段名按后端建议命名，可直接作为 Prisma/DTO/API 字段参考。

| 字段中文名 | 英文字段名 | 类型 | 是否必填 | 前端组件类型 | 枚举/示例值 | 是否参与匹配 | 硬过滤/加分/仅展示 | 是否前台展示 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| 用户ID | id | string | 是 | 系统生成 | `usr_xxx` | 否 | 仅系统 | 否 | 主键 |
| 昵称/称呼 | displayName | string | 是 | input | `小林`、`王先生` | 否 | 仅展示 | 是 | 不展示真实全名 |
| 真实姓名 | realName | string | 否 | input | `张三` | 否 | 仅系统 | 否 | 仅审核/认证使用，前台不展示 |
| 性别 | gender | enum | 是 | radio/select | `male`/`female` | 是 | 硬过滤 | 是 | V1 先按异性婚恋场景设计 |
| 出生日期 | birthDate | date | 是 | date-picker | `1994-08-16` | 是 | 加分项 | 否 | 前台优先展示年龄，不直接展示完整生日 |
| 年龄 | age | int(derived) | 是 | 系统计算 | `31` | 是 | 硬过滤 + 加分 | 是 | 由 birthDate 实时计算 |
| 身高(cm) | heightCm | int | 是 | number-input/select | `172` | 是 | 硬过滤 + 加分 | 是 | 建议设置范围 140~210 |
| 体重(kg) | weightKg | int | 否 | number-input | `58` | 否 | 仅展示 | 选填展示 | V1 不建议作为硬过滤 |
| 学历 | educationLevel | enum | 是 | select | `高中`/`大专`/`本科`/`硕士`/`博士` | 是 | 加分项 | 是 | 可被对方设置最低学历 |
| 学校 | schoolName | string | 否 | input | `南通大学` | 否 | 仅展示 | 是 | 展示可信度增强 |
| 职业类型 | occupationCategory | enum | 是 | select | `制造业`/`教育`/`医疗`/`公务员事业单位`/`个体经营`/`互联网`/`服务业`/`其他` | 是 | 加分项 | 是 | 用于粗粒度匹配 |
| 职业名称 | occupationTitle | string | 是 | input | `机械工程师`、`老师` | 否 | 仅展示 | 是 | 给用户更真实判断 |
| 工作单位性质 | employerType | enum | 否 | select | `国企`/`民企`/`体制内`/`自营`/`外企`/`自由职业` | 是 | 加分项 | 是 | 启东婚恋场景中较敏感但有价值 |
| 年收入区间 | annualIncomeRange | enum | 是 | select | `10万以下`/`10-20万`/`20-30万`/`30-50万`/`50万以上` | 是 | 加分项 | 是 | V1 用区间，不做精确金额 |
| 是否有房 | hasHouse | enum | 是 | radio | `无`/`有贷款`/`全款` | 是 | 加分项 | 是 | 启东婚恋高关注字段 |
| 房产所在地 | houseLocation | string | 否 | input/select | `启东市区`、`南通`、`上海` | 是 | 加分项 | 是 | 有房时建议必填 |
| 是否有车 | hasCar | enum | 否 | radio | `无`/`有` | 是 | 加分项 | 是 | V1 不设硬门槛 |
| 户籍所在地 | hukouLocation | string | 否 | input | `启东汇龙镇` | 是 | 加分项 | 是 | 与启东本地婚恋相关 |
| 老家/籍贯 | hometown | string | 是 | input + 联想 | `启东吕四`、`启东近海` | 是 | 加分项 | 是 | 重点字段，强烈建议结构化到镇/街道 |
| 是否启东本地 | isQidongLocal | boolean | 是 | switch(系统/人工确认) | `true` | 是 | 加分项 | 是 | 可依据籍贯/户籍/家庭所在地综合判定 |
| 现居城市 | currentCity | string | 是 | cascader/select | `启东`、`上海`、`苏州` | 是 | 硬过滤 + 加分 | 是 | 核心字段 |
| 现居详细区域 | currentArea | string | 否 | input | `浦东新区`、`汇龙镇` | 否 | 仅展示 | 是 | 提升感知距离 |
| 工作城市 | workCity | string | 是 | cascader/select | `上海`、`南通` | 是 | 加分项 | 是 | 与 currentCity 可能不同 |
| 是否接受异地 | acceptLongDistance | boolean | 是 | radio | `是`/`否` | 是 | 硬过滤 | 是 | 双向必须兼容 |
| 是否接受未来回启东发展 | acceptRelocateToQidong | boolean | 是 | radio | `是`/`否`/`视情况` | 是 | 硬过滤 + 加分 | 是 | 启东婚恋核心字段 |
| 自己未来是否考虑回启东发展 | planReturnToQidong | enum | 是 | radio/select | `是，明确计划`/`可能`/`不考虑` | 是 | 加分项 | 是 | 与对方接受度联动 |
| 婚姻状态 | maritalStatus | enum | 是 | select | `未婚`/`离异`/`丧偶` | 是 | 硬过滤 | 是 | 核心字段 |
| 子女情况 | childrenStatus | enum | 是 | select | `无子女`/`有子女且同住`/`有子女不同住` | 是 | 硬过滤 | 是 | 核心字段 |
| 是否可接受再婚 | openToRemarriage | enum | 否 | radio | `是`/`否`/`视情况` | 否 | 仅展示 | 否 | 更适合放到择偶要求端 |
| 是否吸烟 | smokingStatus | enum | 否 | select | `不吸烟`/`偶尔`/`经常` | 是 | 加分项 | 是 | V1 不做硬过滤默认值 |
| 是否饮酒 | drinkingStatus | enum | 否 | select | `不饮酒`/`偶尔`/`经常` | 是 | 加分项 | 是 | 同上 |
| 家庭成员情况 | familySummary | text | 否 | textarea | `父母已退休，有一姐已婚` | 否 | 仅展示 | 是 | 用于婚恋判断，不进入算法 |
| 自我介绍 | bio | text | 是 | textarea | 50~300字 | 否 | 仅展示 | 是 | 要求偏真实，不要空泛 |
| 择偶补充说明 | preferenceNote | text | 否 | textarea | `希望三观稳、能沟通` | 否 | 仅展示 | 是 | 不作为结构化匹配 |
| 头像 | avatarUrl | string | 是 | image-upload | 图片 URL | 否 | 仅展示 | 是 | V1 至少 1 张 |
| 生活照列表 | photoUrls | string[] | 否 | multi-image-upload | 最多 6 张 | 否 | 仅展示 | 是 | 可扩展审核状态 |
| 身份认证状态 | verificationStatus | enum | 是 | 系统字段 | `unverified`/`basic_verified`/`id_verified` | 是 | 加分项 | 是 | 推荐排序加权 |
| 资料完整度 | profileCompleteness | int(derived) | 是 | 系统计算 | `0~100` | 是 | 加分项 | 否 | 不展示具体算法 |
| 最近活跃时间 | lastActiveAt | datetime | 是 | 系统字段 | `2026-03-14 12:00:00` | 是 | 加分项 | 否 | 控制推荐新鲜度 |
| 资料审核状态 | profileStatus | enum | 是 | 系统字段 | `draft/submitted/approved/rejected` | 是 | 硬过滤 | 否 | 非 approved 不进入推荐 |
| 联系电话 | phone | string | 否 | input | `138****8888` | 否 | 仅系统 | 否 | 联系方式默认不公开 |
| 微信号 | wechatId | string | 否 | input | `abc123` | 否 | 仅系统 | 否 | 双方同意后可开放 |
| 联系方式开放偏好 | contactSharePreference | enum | 是 | select | `仅互相同意后开放` | 否 | 仅系统 | 否 | V1 默认固定此策略 |

---

## 6. 择偶要求字段表（Preference）

> 设计原则：
> - 择偶要求必须结构化，否则无法做高质量双向匹配。
> - V1 只保留对婚恋决策影响最大的字段。
> - 每个字段都要支持“是否限制”为硬门槛，避免用户填了但算法没用。

| 字段中文名 | 英文字段名 | 类型 | 是否必填 | 前端组件类型 | 枚举/示例值 | 是否参与匹配 | 硬过滤/加分/仅展示 | 是否前台展示 | 备注 |
|---|---|---|---|---|---|---|---|---|---|
| 期望对象性别 | preferredGender | enum | 是 | 系统/单选 | `male`/`female` | 是 | 硬过滤 | 否 | 与产品模式绑定 |
| 可接受最低年龄 | minAge | int | 是 | range-input | `25` | 是 | 硬过滤 | 否 | 与 maxAge 成对 |
| 可接受最高年龄 | maxAge | int | 是 | range-input | `33` | 是 | 硬过滤 | 否 | 与 minAge 成对 |
| 可接受最低身高 | minHeightCm | int | 否 | select | `170` | 是 | 硬过滤 | 否 | 常见硬门槛 |
| 可接受最高身高 | maxHeightCm | int | 否 | select | `185` | 是 | 硬过滤 | 否 | 可选 |
| 可接受婚姻状态 | acceptableMaritalStatuses | enum[] | 是 | multi-select | `未婚`、`离异`、`丧偶` | 是 | 硬过滤 | 否 | 核心字段 |
| 可接受子女情况 | acceptableChildrenStatuses | enum[] | 是 | multi-select | `无子女`、`有子女不同住` | 是 | 硬过滤 | 否 | 核心字段 |
| 可接受学历最低要求 | minEducationLevel | enum | 否 | select | `本科` | 是 | 硬过滤 | 否 | V1 支持最低门槛 |
| 可接受收入区间最低要求 | minAnnualIncomeRange | enum | 否 | select | `20-30万` | 是 | 加分项 | 否 | 不建议 V1 设为硬过滤，避免筛空 |
| 可接受职业类型 | preferredOccupationCategories | enum[] | 否 | multi-select | `体制内`、`教育`、`制造业` | 是 | 加分项 | 否 | 建议非硬限制 |
| 是否要求有房 | requireHouse | enum | 否 | radio | `必须有`/`加分`/`不要求` | 是 | 硬过滤或加分 | 否 | 明确避免歧义 |
| 是否要求有车 | requireCar | enum | 否 | radio | `必须有`/`加分`/`不要求` | 是 | 加分项 | 否 | V1 建议不做硬过滤 |
| 地域偏好类型 | locationPreferenceType | enum | 是 | radio | `启东优先`/`接受南通周边`/`接受长三角异地` | 是 | 硬过滤 + 加分 | 否 | 核心字段 |
| 是否接受对方在外地工作 | acceptPartnerWorkingOutside | boolean | 是 | radio | `是`/`否` | 是 | 硬过滤 | 否 | 启东场景核心 |
| 是否要求对方为启东人/启东家庭背景 | requireQidongBackground | enum | 否 | radio | `必须`/`优先`/`不要求` | 是 | 硬过滤或加分 | 否 | 适合本地婚恋市场 |
| 是否接受异地恋阶段 | acceptLongDistanceRelationship | boolean | 是 | radio | `是`/`否` | 是 | 硬过滤 | 否 | 与对方 acceptLongDistance 双向校验 |
| 是否接受对方未来回启东发展 | acceptPartnerReturnToQidong | boolean | 是 | radio | `是`/`否` | 是 | 硬过滤 | 否 | 如果对方明确计划回启东，此项要能匹配 |
| 是否希望婚后在启东定居 | preferSettleInQidongAfterMarriage | enum | 否 | radio | `是`/`否`/`视情况` | 是 | 加分项 | 否 | 与回启东发展意愿联动 |
| 可接受吸烟情况 | acceptableSmokingStatuses | enum[] | 否 | multi-select | `不吸烟`、`偶尔` | 是 | 加分项 | 否 | 默认非硬限制 |
| 可接受饮酒情况 | acceptableDrinkingStatuses | enum[] | 否 | multi-select | `不饮酒`、`偶尔` | 是 | 加分项 | 否 | 默认非硬限制 |
| 是否接受离异 | acceptDivorced | boolean(derived) | 否 | 系统派生 | `true/false` | 否 | 派生逻辑 | 否 | 可由 acceptableMaritalStatuses 推导，无需单独存 |
| 是否接受有子女 | acceptPartnerWithChildren | boolean(derived) | 否 | 系统派生 | `true/false` | 否 | 派生逻辑 | 否 | 可由 acceptableChildrenStatuses 推导 |
| 择偶补充描述 | preferenceDescription | text | 否 | textarea | `更看重沟通和责任感` | 否 | 仅展示 | 是 | 不进入结构化匹配 |
| 不可接受项说明 | dealBreakersNote | text | 否 | textarea | `长期酗酒不可接受` | 否 | 仅展示 | 否 | 仅供审核/运营后续参考 |

---

## 7. 硬门槛、加分项、仅展示字段归类

## 7.1 用户资料侧硬门槛字段

以下字段建议作为 **进入候选池前的硬过滤条件**：

1. `gender`
2. `age`
3. `maritalStatus`
4. `childrenStatus`
5. `acceptLongDistance`
6. `acceptRelocateToQidong`
7. `currentCity`（结合对方地域偏好）
8. `profileStatus`（必须 `approved`）
9. `availabilityStatus`（必须 `active`）

说明：
- 对于“现居地/工作地”，不建议简单做同城过滤，而是根据用户的“地域偏好类型 + 是否接受异地 + 是否接受回启东发展”联动判断。
- 启东婚恋里，“异地是否接受”比“当前是否同城”更重要。

## 7.2 用户资料侧加分项字段

以下字段建议作为排序分数项，而非硬过滤：

1. `educationLevel`
2. `annualIncomeRange`
3. `occupationCategory`
4. `employerType`
5. `hasHouse`
6. `houseLocation`
7. `hasCar`
8. `hometown`
9. `isQidongLocal`
10. `workCity`
11. `planReturnToQidong`
12. `verificationStatus`
13. `profileCompleteness`
14. `lastActiveAt`
15. `smokingStatus`
16. `drinkingStatus`

## 7.3 仅展示字段

以下字段主要用于用户自己判断，不建议进入 V1 算法：

- `schoolName`
- `occupationTitle`
- `familySummary`
- `bio`
- `preferenceNote`
- `photoUrls`
- `currentArea`

---

## 8. 联系方式开放机制

## 8.1 目标

确保隐私可控，避免用户一上来暴露手机号/微信，同时给有明确意愿的双方快速进入线下沟通留出口。

## 8.2 V1 建议机制：双向同意后开放

### 阶段一：资料可见，联系方式不可见

默认状态下：
- 双方可见对方公开资料
- 不可见手机号、微信号、其他外部联系方式

### 阶段二：表达意向

任一方可点击：
- `感兴趣`
- `想进一步了解`
- `申请交换联系方式`

建议后端记录事件：
- `interest_sent`
- `contact_unlock_requested`

### 阶段三：双方明确同意

只有满足以下条件，联系方式才开放：

1. A 对 B 发起联系方式开放请求
2. B 明确点击同意
3. 双方资料状态均为 `approved`
4. 双方账号状态正常、未被风控限制

开放后：
- A 可见 B 的已填写联系方式
- B 可见 A 的已填写联系方式
- 同时写入解锁记录 `contact_unlocked_at`

## 8.3 前端提示文案建议

- 未解锁前：`联系方式仅在双方同意后开放，保护隐私更安心。`
- 发起申请后：`已发送联系方式交换申请，等待对方确认。`
- 对方发来申请时：`对方希望与你交换联系方式，确认后双方将互相可见。`
- 已开放后：`你们已完成双向确认，可继续线下沟通。`

## 8.4 测试要点

1. 单方申请不能直接看到对方联系方式
2. 双方任一方资料被下架后，联系方式入口应冻结
3. 未填写联系方式的用户不能发起“交换联系方式”
4. 申请状态要可重复进入页面查看
5. 同意后双方应同时可见，不允许单向可见

---

## 9. 每日推荐机制建议

## 9.1 目标

V1 不做“刷 100 个人”，而是做“今天给你最值得认真看的一小组人”。

建议采用：
- **1 个主推荐**：今天最优先了解对象
- **2~3 个备选推荐**：与主推荐同级次优对象

## 9.2 候选池筛选步骤

### 第一步：基础可推荐过滤

必须满足：
- 双方 `profileStatus=approved`
- 双方 `availabilityStatus=active`
- 性别互相满足
- 年龄范围双向满足
- 婚姻状态双向满足
- 子女情况双向满足
- 异地接受度双向满足
- 启东/外地/回启东相关地域条件双向满足

### 第二步：打分排序

建议分为 100 分制，V1 可先用规则分，不必上模型。

建议权重：

1. **地域婚恋适配（30 分）**
   - 都在启东：30
   - 一方在外地但双方接受异地，且有回启东意愿：24~28
   - 一方在上海/苏州/南通等长三角工作，且另一方接受外地工作：20~24
   - 地域方向冲突：0，直接淘汰

2. **婚姻与家庭接受度适配（25 分）**
   - 婚姻状态、子女情况双向高度匹配：满分
   - 一方“视情况接受”：降档给分

3. **基础条件适配（20 分）**
   - 年龄、身高、学历等与对方偏好接近程度

4. **稳定性与可信度（15 分）**
   - 认证状态
   - 资料完整度
   - 照片完整度
   - 最近活跃度

5. **生活与未来规划适配（10 分）**
   - 是否考虑回启东发展
   - 婚后定居启东意向
   - 职业/收入/房产的匹配度

## 9.3 主推荐选择规则

主推荐建议满足：
- 双向硬条件全部满足
- 综合得分最高
- 最近 7 天未重复主推同一对象
- 对方当天未被平台过度分发（控制曝光）

## 9.4 备选推荐规则

备选建议满足：
- 双向硬条件全部满足
- 分数次高的 2~3 人
- 与主推荐尽量保持差异化（例如一个本地、一个上海工作、一个南通工作）

## 9.5 推荐解释文案建议

每个推荐卡可附一个简短解释标签，增强信任感：

- `同为启东家庭背景`
- `对异地与回启东发展看法一致`
- `年龄/学历/婚恋规划匹配度高`
- `双方都接受在长三角工作、未来回启东定居`

这样可以帮助用户理解“为什么推荐这个人”，降低算法黑盒感。

---

## 10. V1 明确先不做的字段与能力

## 10.1 先不做的字段

以下字段暂不建议进入 V1：

1. 星座
2. MBTI
3. 宗教信仰
4. 政治面貌
5. 详细家庭资产金额
6. 车品牌/房面积等过细资产字段
7. 恋爱经历次数
8. 结婚时间计划精确到月
9. 多维性格测试题结果
10. 复杂兴趣标签系统

原因：
- 对严肃婚恋首轮匹配帮助有限
- 容易增加填写负担
- 可能造成用户筛选过度、有效候选过少

## 10.2 先不做的能力

1. 人工红娘撮合
2. 实时聊天 IM
3. 语音/视频速配
4. 线下活动报名
5. 付费超级曝光
6. AI 自动代聊

V1 重点应放在：
- 资料真实
- 条件结构化
- 双向过滤
- 每日精准推荐
- 联系方式安全开放

---

## 11. 开发实现建议

## 11.1 数据建模建议

建议拆成以下表：

1. `users`
   - 账号基础信息

2. `user_profiles`
   - 用户资料主表

3. `user_preferences`
   - 择偶要求主表

4. `user_photos`
   - 图片表

5. `contact_unlock_requests`
   - 联系方式申请与同意记录

6. `daily_recommendations`
   - 每日推荐结果快照

7. `profile_reviews`
   - 资料审核记录

## 11.2 字段实现注意事项

1. `age` 建议由 `birthDate` 派生，不单独允许前端写入
2. `profileCompleteness` 建议后端统一计算
3. 枚举值要前后端统一，避免中文直接写死在数据库枚举中
4. `hometown/currentCity/workCity/houseLocation` 尽量采用“标准地名 + 用户补充”双字段结构，避免纯自由输入难以统计
5. 子女情况不要只存 boolean，必须结构化到“无 / 有且同住 / 有不同住”
6. 婚姻状态和子女情况要参与双向过滤，避免推荐明显不接受的对象

---

## 12. 测试关注点

## 12.1 表单测试

- 必填字段校验是否完整
- 枚举字段与后端校验是否一致
- 条件联动是否正确（如有房才填房产所在地）
- 年龄是否从生日正确计算

## 12.2 匹配测试

重点验证：
- 双向异地接受逻辑是否正确
- “接受未来回启东发展”是否真正参与匹配
- 离异/子女情况是否被严格过滤
- 启东本地/外地工作场景是否有合理推荐，不会一刀切筛空

## 12.3 隐私测试

- 联系方式在未同意前绝不泄露
- API 不应返回未解锁联系方式字段
- 前端缓存/接口日志中不应暴露联系方式

---

## 13. 推荐的 V1 核心字段最小集（如需快速上线）

如果要进一步压缩开发量，建议保留以下最小可用集：

### 用户资料最小集
- gender
- birthDate
- heightCm
- educationLevel
- occupationCategory
- occupationTitle
- annualIncomeRange
- hasHouse
- hasCar
- hometown
- currentCity
- workCity
- acceptLongDistance
- acceptRelocateToQidong
- planReturnToQidong
- maritalStatus
- childrenStatus
- bio
- avatarUrl
- verificationStatus
- profileStatus

### 择偶要求最小集
- preferredGender
- minAge / maxAge
- minHeightCm
- acceptableMaritalStatuses
- acceptableChildrenStatuses
- minEducationLevel
- locationPreferenceType
- acceptPartnerWorkingOutside
- requireQidongBackground
- acceptLongDistanceRelationship
- acceptPartnerReturnToQidong

---

## 14. 结论

这套 V1 字段设计的核心，不是把婚恋信息堆满，而是把 **启东本地婚恋真正影响成家的几个关键变量结构化**：

- 人是否真实
- 条件是否明确
- 是否接受异地
- 是否认同启东作为关系落点
- 婚姻状态/子女情况是否双向接受

如果这几个变量做对，平台就不是“又一个交友站”，而是一个真正能提高启东本地婚恋撮合效率的系统。
