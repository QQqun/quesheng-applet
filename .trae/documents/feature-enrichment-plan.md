# 雀圣小程序 - 六大新功能实现计划

## Context
雀圣小程序是一个基于 uni-app + 微信云开发的群组积分管理工具，当前功能包括登录、首页仪表盘、群组积分录入、数据统计图表、个人资料。用户希望丰富项目功能，选择了6个新特性：积分排行榜、积分趋势图、周期结算、个人数据分析、数据导出分享、消息通知。

---

## 页面结构

### 新增页面（2个）
| 页面路径 | 归属分包 | 功能 |
|---|---|---|
| `pkg-statistics/statistics/pages/leaderboard` | pkg-statistics | 积分排行榜 + 周期结算（Tab 切换） |
| `pkg-statistics/statistics/pages/notifications` | pkg-statistics | 消息通知列表 |

### 新增工具模块（2个）
| 文件路径 | 功能 |
|---|---|
| `utils/notification.js` | 通知创建公共方法 |
| `utils/shareCard.js` | Canvas 绘制分享卡片 |

### 修改页面（4个）
- `pages/index/index.vue` - 铃铛通知跳转 + 红点 + 排行榜入口
- `pages/my/my.vue` - 功能列表增加入口
- `pkg-statistics/statistics/pages/index.vue` - 趋势折线图 + 个人分析 + 分享
- `pages.json` - 注册新页面路由

### 云数据库新增集合（2个）
- `notifications` - { userId, type, title, content, groupId, groupName, isRead, createTime }
- `settlements` - { groupId, groupName, periodType, periodStart, periodEnd, creatorId, users[{name, totalScore, rank}], createTime }

---

## 实现步骤

### Phase 1: 基础层

#### 1.1 扩展 cloudbase.js - 新增分页查询
- 在 `utils/cloudbase.js` 中新增 `queryAllDocs(collection, whereObj)` 方法，循环分页获取全部数据（云DB默认limit 20）

#### 1.2 消息通知基础设施
- 新建 `utils/notification.js`，封装 `createNotification({ userId, type, title, content, groupId, groupName })`
- 新建 `pkg-statistics/statistics/pages/notifications.vue`
  - 通知列表页，支持标记已读、全部已读、清空
  - 通知类型：score_change / new_member / settlement / system
- 修改 `pages/index/index.vue`
  - 铃铛按钮增加点击跳转通知页
  - 添加未读数红点标识
  - onShow 中加载未读数
- 在 `pages.json` 的 pkg-statistics 分包中注册 notifications 页面

#### 1.3 数据导出分享工具
- 新建 `utils/shareCard.js`
  - `drawShareCard({ canvasId, title, subtitle, dataList, theme })` - Canvas 2D 绘制卡片
  - `saveToAlbum(tempFilePath)` - 保存到相册
  - 绘制内容：绿色渐变头部 + 标题 + 排名列表（正绿负红）+ 品牌文字

### Phase 2: 数据计算层

#### 2.1 积分趋势图（修改统计页面）
- 修改 `pkg-statistics/statistics/pages/index.vue`
  - 新增"积分趋势"section，位于现有柱状图下方
  - 个人/全组 Tab 切换
  - 使用 `qiun-data-charts type="line"` 渲染累计积分曲线
  - 新增 `trendMode`, `trendChartData`, `trendChartKey`, `trendChartOpts` 数据
  - 新增 `calculateTrendData(scores)` 方法，按日期排序逐日累加

#### 2.2 个人数据分析（修改统计页面）
- 修改 `pkg-statistics/statistics/pages/index.vue`
  - 新增"个人数据分析"section，位于趋势图下方
  - 指标卡片：胜率、场均积分、最高连胜、最佳场次、最差场次
  - 雷达图 `qiun-data-charts type="radar"` 展示5维综合能力
  - 新增 `personalStats`, `radarChartData`, `radarChartKey`, `radarChartOpts` 数据
  - 新增 `calculatePersonalAnalysis(scores)` 方法

#### 2.3 积分排行榜（新页面）
- 新建 `pkg-statistics/statistics/pages/leaderboard.vue`
  - 顶部 Tab：排行榜 / 周期结算
  - 排行榜 Tab 内容：
    - 群组/全部筛选
    - 时间筛选：本周/本月/总计
    - 排名列表（前三名金银铜标识，排名变化箭头）
    - 底部分享按钮（调用 shareCard.js）
  - 修改 `pages/index/index.vue` 核心指标区域增加排行榜快捷入口
  - 修改 `pages/my/my.vue` 功能列表增加"积分排行"入口
  - 在 `pages.json` 注册 leaderboard 页面

### Phase 3: 聚合层

#### 3.1 周期结算（集成到排行榜页面）
- 在 `leaderboard.vue` 中增加"周期结算"Tab
  - 群组选择 + 周/月切换
  - 显示周期起止日期 + 成员积分排名
  - "生成结算卡"按钮 -> 写入 settlements 集合 + 为成员创建通知
  - "分享"按钮 -> 调用 shareCard.js 生成结算分享卡
- 修改 `pkg-group/index.vue`
  - saveData 保存成功后为群组其他成员创建 score_change 通知
  - addMember 添加成功后为群组已有成员创建 new_member 通知

#### 3.2 统计页面分享
- 修改 `pkg-statistics/statistics/pages/index.vue`
  - 添加分享按钮（导出统计卡片图片）
  - 添加 `onShareAppMessage` 钩子支持微信分享

---

## 关键代码模式
- 所有 async method 起始调用 `await ensureLogin()`
- 数据获取统一用 `queryDocs` / `queryAllDocs`
- 弹窗复用 `.dialog` / `.popup-panel` 样式类
- 颜色：主色 #22C55E，正分绿色，负分 #ef4444，背景 #F8FAFC
- 图表 key 强制刷新：`this.chartKey++`
- 积分显示：`score >= 0 ? '+' : ''` + score

---

## 验证方式
1. 消息通知：在群组录入积分后，检查其他成员收到通知；铃铛红点正确显示
2. 排行榜：切换群组/时间筛选，排名和变化箭头正确
3. 趋势图：切换个人/全组，折线图数据正确反映累计积分
4. 个人分析：胜率、场均等指标与手动计算一致；雷达图渲染正常
5. 周期结算：选择周/月后显示正确时间范围，生成结算卡写入DB，分享卡片可保存
6. 数据导出：Canvas 绘制卡片无截断，保存到相册成功
