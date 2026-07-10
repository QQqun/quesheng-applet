# 手机号认证改造实施计划

## Context
当前系统使用 `username` 作为用户唯一标识，需要改为以手机号(`phone`)作为唯一标识。同时需要拆分个人资料编辑和修改密码为两个独立页面。

## 核心变更
- 登录方式：username+密码 → 手机号+密码
- 用户唯一标识：username → phone
- 显示逻辑：昵称优先，无昵称显示手机号
- 群组成员标识：members 数组改存 phone（显示名通过查询 users 集合映射）
- 通知 userId：从 username 改为 phone
- 页面拆分：pkg-profile 拆为资料编辑 + 修改密码两个页面

## 实施步骤

### 1. 新增工具函数
**文件**: `src/utils/index.js`
- 新增 `isValidPhone(phone)`: 校验手机号格式 `/^1[3-9]\d{9}$/`
- 新增 `getDisplayName(user)`: 返回 `nickName || phone || '未知用户'`

### 2. 改造登录页
**文件**: `src/pkg-login/login.vue`
- data: `username` → `phone`，输入框改为手机号(type=number, maxlength=11)
- 校验: 改用 `isValidPhone` 校验手机号格式，提示"请输入正确的手机号"
- 查询: `queryDocs('users', { username })` → `queryDocs('users', { phone })`
- 兼容旧数据: 按 phone 查不到时，再按 username 查一次，找到后自动补写 phone 字段
- localStorage userInfo 结构改为: `{ phone, nickName, avatarUrl }`（不再存 username）
- 自动注册新用户时: `{ phone, nickName: '', avatarUrl, password }`

### 3. 新增修改密码页面
**新文件**: `src/pkg-password/index.vue`
- 从 pkg-profile 中提取密码修改逻辑
- 通过 `queryDocs('users', { phone })` 获取 docId
- 包含旧密码、新密码、确认密码 + 修改按钮

**路由注册**: `src/pages.json` - 新增 pkg-password 子包

### 4. 改造个人资料编辑页
**文件**: `src/pkg-profile/index.vue`
- 删除密码修改相关代码（模板、data、方法）
- 手机号字段改为只读展示（disabled 或用 text 展示）
- 查询: `queryDocs('users', { username })` → `queryDocs('users', { phone })`
- 统一 localStorage 中 nickname/nickName 大小写问题

### 5. 改造"我的"页
**文件**: `src/pages/my/my.vue`
- 昵称显示: `nickName || phone || '未设置昵称'`
- 新增"修改密码"入口，跳转 `/pkg-password/index`
- 查询: `queryDocs('users', { username })` → `queryDocs('users', { phone })`
- localStorage 同步新结构

### 6. 改造首页
**文件**: `src/pages/index/index.vue`
- 用户名显示(L16): `nickName || '未设置昵称'` → `nickName || phone || '未知用户'`
- getRecentGroups(L229): `members: userName` → `members: userInfo.phone`（兼容旧数据需同时查 nickName）
- showAddGroupDialog(L405): `!userInfo.username` → `!userInfo.phone`
- addGroup(L434-435): `creatorId: userInfo.phone`, `members: [userInfo.phone]`
- loadStatistics(L267): 用户匹配改为 `user.phone === userInfo.phone || user.name === userName`
- loadUnreadCount(L456): `userId: userInfo.phone`（兼容旧数据查 username）

### 7. 改造群组页（改动最大）
**文件**: `src/pkg-group/index.vue`
- 添加成员弹窗: 改为手机号(必填) + 昵称(选填) 两个输入框
- 手机号输入后失焦/确认时，查询 `queryDocs('users', { phone })`:
  - 已存在 → 自动填充 nickName 并设为只读
  - 不存在 → nickName 可手动填写
- addMember: 校验手机号格式，members 存 phone，users 存 `{ name: 显示名, phone, score }`
- loadMembers: members 存 phone 时需查询 users 集合获取 nickName 做显示映射（兼容旧数据存显示名的情况）
- 通知发送: 直接用成员 phone 作为 userId，不再查 users 表获取 username
- saveData: creatorId 改为 userInfo.phone
- removeMember: 通过 phone 标识成员

### 8. 改造通知页
**文件**: `src/pkg-statistics/statistics/pages/notifications.vue`
- L53: `userId: userInfo.username` → `userId: userInfo.phone`（兼容旧数据查 username）

### 9. 改造排行榜页
**文件**: `src/pkg-statistics/statistics/pages/leaderboard.vue`
- L187: userName 改为 phone 查询
- L361: creatorId 改为 userInfo.phone
- L372-378: 通知发送改用 phone

### 10. 改造统计页
**文件**: `src/pkg-statistics/statistics/pages/index.vue`
- L299, L560, L594: userName 改为 phone 查询

## 兼容旧数据策略
所有查询用户的地方都加兼容逻辑：
1. 按 phone 查询优先
2. 查不到时按 username 兜底查（针对旧数据）
3. 找到旧数据后自动补写 phone 字段（渐进迁移）

notifications 查询: 先查 `userId: phone`，再查 `userId: username`，合并去重。

groups.members 兼容: 首次加载旧群组时，如果成员值不是手机号格式，按 nickName 匹配；打开群组保存时自动将 members 迁移为 phone。

## 验证方式
1. 新用户注册：输入手机号+密码 → 自动创建用户 → 登录成功
2. 旧用户登录：输入手机号+密码 → 兼容查到旧记录 → 自动补写 phone → 登录成功
3. 首页显示：有昵称显示昵称，无昵称显示手机号
4. 添加成员：输入手机号后自动带出昵称，昵称不可改
5. 资料编辑：手机号只读，可修改昵称和头像
6. 修改密码：独立页面，可正常修改
7. 通知收发：基于 phone 的 userId 正常收发
