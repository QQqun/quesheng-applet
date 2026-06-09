# 雀圣小程序接入腾讯云 CloudBase 方案

## 项目现状分析

当前项目是一个基于 **uni-app (Vue 2)** 的微信小程序「雀圣」，主要功能为群组积分管理。当前所有数据（用户信息、群组、积分记录）均通过 `uni.getStorageSync / uni.setStorageSync` 存储在本地缓存中，存在以下问题：

- 数据无法跨设备同步
- 换设备或清除缓存后数据丢失
- 无法实现多用户协作（如群组成员共享数据）

## 目标

将数据存储从本地缓存迁移到**腾讯云 CloudBase 云数据库**，实现数据云端持久化。

- 环境 ID：`quesheng-ysl-mcdpdsydzdd-d6ff580`

## 实施步骤

### 步骤 1：安装 CloudBase SDK

在小程序端使用 `@cloudbase/js-sdk` 或微信小程序原生的 `wx.cloud` 方式接入。由于项目是 uni-app 项目且目标平台为微信小程序，推荐使用 **`@cloudbase/js-sdk`** 方式，兼容性更好。

```bash
npm install @cloudbase/js-sdk
```

### 步骤 2：创建 CloudBase 初始化模块

新建 `src/utils/cloudbase.js`，封装 CloudBase 初始化和数据库操作：

- 初始化 CloudBase SDK，配置环境 ID `quesheng-ysl-mcdpdsydzdd-d6ff580`
- 封装数据库的 CRUD 操作（增删改查）
- 封装鉴权登录方法

核心代码结构：

```js
import cloudbase from '@cloudbase/js-sdk'

const app = cloudbase.init({
  env: 'quesheng-ysl-mcdpdsydzdd-d6ff580'
})

const db = app.database()

export { app, db }
```

### 步骤 3：设计云数据库集合

根据现有数据结构，设计以下集合：

| 集合名 | 说明 | 字段 |
|--------|------|------|
| `users` | 用户信息 | `_id`, `username`, `nickName`, `avatarUrl`, `openId`, `createTime`, `updateTime` |
| `groups` | 群组信息 | `_id`, `groupName`, `creatorId`, `members`(数组), `createTime`, `updateTime` |
| `scores` | 积分记录 | `_id`, `groupId`, `date`, `users`(数组,每项含 name+score), `creatorId`, `createTime`, `updateTime` |

### 步骤 4：配置云数据库安全规则

在腾讯云 CloudBase 控制台配置集合的安全规则，允许已登录用户读写自己的数据。

### 步骤 5：改造登录模块 (`src/pages/login/login.vue`)

- 登录时调用 CloudBase 鉴权，获取用户身份
- 登录成功后将用户信息写入 `users` 集合
- 本地仍缓存 `userInfo` 用于快速展示，但数据源以云端为准

### 步骤 6：改造首页 (`src/pages/index/index.vue`)

- `getRecentGroups()`：从云数据库 `groups` 集合查询用户所在群组
- `loadStatistics()`：从云数据库 `scores` 集合查询积分数据并计算统计
- `addGroup()`：向云数据库 `groups` 集合插入新群组

### 步骤 7：改造群组详情页 (`src/pages/group/index.vue`)

- `loadMembers()`：从云数据库 `groups` 集合获取成员列表
- `loadDataByDate()`：从云数据库 `scores` 集合按日期查询积分
- `saveData()`：将积分数据保存到云数据库 `scores` 集合
- `addMember()`：更新云数据库 `groups` 集合的成员列表
- `updateNameInCache()`：更新云数据库中成员名称

### 步骤 8：改造统计页面 (`src/pkg-statistics/statistics/pages/index.vue`)

- `loadGroups()`：从云数据库 `groups` 集合加载群组列表
- `loadStatistics()`：从云数据库 `scores` 集合查询并计算统计数据

### 步骤 9：改造「我的」页面 (`src/pages/my/my.vue`)

- `getUserInfo()`：优先从云端获取最新用户信息
- `logout()`：调用 CloudBase 登出，清除本地缓存

### 步骤 10：数据迁移（可选）

提供一次性数据迁移功能，将本地 `uni.getStorageSync` 中的数据批量上传到云数据库，确保老用户数据不丢失。

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 添加 `@cloudbase/js-sdk` 依赖 |
| `src/utils/cloudbase.js` | 新建 | CloudBase 初始化与数据库操作封装 |
| `src/pages/login/login.vue` | 修改 | 接入云端鉴权登录 |
| `src/pages/index/index.vue` | 修改 | 数据查询改为云端 |
| `src/pages/group/index.vue` | 修改 | 数据读写改为云端 |
| `src/pages/my/my.vue` | 修改 | 用户信息获取改为云端 |
| `src/pkg-statistics/statistics/pages/index.vue` | 修改 | 统计数据查询改为云端 |

## 注意事项

1. **微信小程序兼容性**：uni-app 编译为微信小程序时，需确保 CloudBase SDK 正确引入。如果 `@cloudbase/js-sdk` 在小程序端不兼容，可改用 `wx.cloud`（需在微信开发者工具中开通云开发）或使用 CloudBase 的 HTTP API 方式。
2. **离线体验**：保留本地缓存作为离线降级方案，云端请求失败时读取本地缓存。
3. **数据安全**：云数据库安全规则需配置为仅允许用户操作自己的数据。
4. **环境 ID 硬编码**：环境 ID 统一在 `cloudbase.js` 中管理，便于后续切换环境。
