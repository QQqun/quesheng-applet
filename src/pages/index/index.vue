<template>
  <view class="page-container">
    <!-- 对应 zz.html 中的外部容器 .w-[375px] h-[812px] ... -->
    <view class="dashboard-container">
      
      <!-- 顶部用户信息 (对应 zz.html lines 43-56) -->
      <view class="header-section">
        <view class="user-info-box">
          <view class="avatar-wrapper">
            <image 
              :src="userInfo.avatarUrl || 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'" 
              class="avatar-img" 
              mode="aspectFill"
            ></image>
          </view>
          <view>
            <view class="greeting-text">{{ greetingText }}</view>
            <view class="username-text">{{ userInfo.nickName || '未设置昵称' }}</view>
          </view>
        </view>
        <view class="notification-btn">
          <u-icon name="bell" size="20" color="#9ca3af"></u-icon>
        </view>
      </view>

      <!-- 数据内容区 (对应 zz.html lines 58-118) -->
      <scroll-view scroll-y class="content-scroll-area">
        
        <view class="core-metrics-card">
          <view class="metrics-content">
            <view class="metrics-label">累计积分</view>
            <view class="metrics-value-row">
              <text class="metrics-num">{{ totalScore }}</text>
              <text class="metrics-unit">分</text>
            </view>
            <view class="metrics-footer">
              <text>今日: {{ todayScore >= 0 ? '+' : '' }}{{ todayScore }}</text>
              <text style="margin-left: 10px;">本周: {{ weekScore >= 0 ? '+' : '' }}{{ weekScore }}</text>
              <text style="margin-left: 10px;">本月: {{ monthScore >= 0 ? '+' : '' }}{{ monthScore }}</text>
            </view>
          </view>
          <view class="card-bg-icon">
            <u-icon name="grid-fill" size="120" color="rgba(255,255,255,0.1)"></u-icon>
          </view>
        </view>
        
        <view class="stats-grid">
          <view class="stat-item">
            <view class="stat-icon" style="background-color: #eff6ff;">
              <u-icon name="grid-fill" size="24" color="#3b82f6"></u-icon>
            </view>
            <view class="stat-info">
              <text class="stat-label">活跃群组</text>
              <text class="stat-value">{{ activeGroupCount || groups.length || 0 }}</text>
            </view>
          </view>
          <view class="stat-item">
            <view class="stat-icon" style="background-color: #fef3c7;">
              <u-icon name="account-fill" size="24" color="#f59e0b"></u-icon>
            </view>
            <view class="stat-info">
              <text class="stat-label">活跃成员</text>
              <text class="stat-value">{{ activeMemberCount }}</text>
            </view>
          </view>
        </view>

        <!-- 最近活跃群组 (对应 zz.html lines 78-84) -->
        <view class="section-header">
          <text class="section-title">最近活跃群组</text>
          <view class="add-group-btn" @click="showAddGroupDialog">
            <u-icon name="plus-circle" color="#22C55E" size="16" style="margin-right: 4px;"></u-icon>
            <text>添加群组</text>
          </view>
        </view>

        <view class="group-list-container">
          <block v-if="groupsWithStats.length > 0">
            <view v-for="(group) in groupsWithStats" :key="group.id" class="group-card" @click="goToGroupDetail(group.id)">
              <view class="group-icon-box bg-blue-50 text-blue-500">
                <u-icon name="account-fill" size="24" color="#3b82f6"></u-icon>
              </view>
              <view class="group-info">
                <view class="group-name">{{ group.groupName }}</view>
                <view class="group-desc">{{ group.memberCount }}人 · 我的积分: {{ group.userScore >= 0 ? '+' : '' }}{{ group.userScore }}</view>
              </view>
              <u-icon name="arrow-right" color="#d1d5db" size="16"></u-icon>
            </view>
          </block>
          
          <block v-else>
            <view class="group-card">
              <view class="group-icon-box" style="background-color: #eff6ff;">
                 <u-icon name="account-fill" size="24" color="#3b82f6"></u-icon>
              </view>
              <view class="group-info">
                <view class="group-name">核心运营交流群</view>
                <view class="group-desc">48人 · 我的积分: +0</view>
              </view>
              <u-icon name="arrow-right" color="#d1d5db" size="16"></u-icon>
            </view>
            <view class="group-card">
              <view class="group-icon-box" style="background-color: #fff7ed;">
                 <u-icon name="gift-fill" size="24" color="#f97316"></u-icon>
              </view>
              <view class="group-info">
                <view class="group-name">福利好物分享群</view>
                <view class="group-desc">256人 · 我的积分: +0</view>
              </view>
              <u-icon name="arrow-right" color="#d1d5db" size="16"></u-icon>
            </view>
          </block>
        </view>

      </scroll-view>
      <!-- 底部导航区域已按要求移除 -->
    </view>

    <u-popup :show="showAddDialog" mode="center" :round="16" @close="showAddDialog = false" :safeAreaInsetBottom="false">
      <view class="dialog">
        <view class="dialog-title">添加群组</view>
        <view class="input">
          <u-input v-model="groupName" placeholder="请输入群组名称" border="surround"></u-input>
        </view>
        <view class="dialog-buttons">
          <u-button text="取消" @click="showAddDialog = false"></u-button>
          <u-button text="确认" type="primary" color="#22C55E" @click="addGroup"></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import { getUuid } from '../../utils';

export default {
  data() {
    return {
      userInfo: {},
      groups: [],
      groupsWithStats: [],
      showAddDialog: false,
      groupName: '',
      greetingText: '',
      todayScore: 0,
      weekScore: 0,
      monthScore: 0,
      totalScore: 0,
      activeGroupCount: 0,
      activeMemberCount: 0
    }
  },

  onShow() {
    this.getUserInfo()
    this.getRecentGroups()
    this.loadStatistics()
    this.updateGreeting()
  },
  computed: {
    // 计算显示的群组，最多显示4个
    displayedGroups() {
      return this.groups.slice(0, 4)
    }
  },
  methods: {
    // 获取用户信息
    getUserInfo() {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo) {
        this.userInfo = userInfo
      } else {
        this.userInfo = {
          nickName: '未设置昵称',
          avatarUrl: 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'
        }
      }
    },
    getRecentGroups() {
      const groups = uni.getStorageSync('groups')
      this.groups = groups
    },
    
    updateGreeting() {
      const now = new Date()
      const hour = now.getHours()
      const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
      
      let greeting = ''
      if (hour < 6) {
        greeting = '夜深了'
      } else if (hour < 12) {
        greeting = '早上好'
      } else if (hour < 14) {
        greeting = '中午好'
      } else if (hour < 18) {
        greeting = '下午好'
      } else {
        greeting = '晚上好'
      }
      
      this.greetingText = `${greeting}, ${dateStr}`
    },
    
    loadStatistics() {
      const groupData = uni.getStorageSync('groupData') || []
      const today = new Date()
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      
      const weekStart = new Date(today)
      const dayOfWeek = today.getDay() || 7
      weekStart.setDate(today.getDate() - dayOfWeek + 1)
      const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
      
      const userName = this.userInfo.nickName || '雀圣'
      
      let todayTotal = 0
      let weekTotal = 0
      let monthTotal = 0
      let total = 0
      const activeGroups = new Set()
      const activeMembers = new Set()
      
      const groupStats = {}
      
      groupData.forEach(groupRecord => {
        if (groupRecord.data) {
          const groupMembers = new Set()
          let userTotalScore = 0
          
          groupRecord.data.forEach(dateData => {
            if (dateData.users && dateData.users.length > 0) {
              activeGroups.add(groupRecord.groupId)
              dateData.users.forEach(user => {
                groupMembers.add(user.name)
                activeMembers.add(user.name)
                const score = parseInt(user.score) || 0
                if (user.name === userName) {
                  userTotalScore += score
                  total += score
                  if (dateData.date === todayStr) {
                    todayTotal += score
                  }
                  if (dateData.date >= weekStartStr) {
                    weekTotal += score
                  }
                  if (dateData.date.startsWith(monthStart)) {
                    monthTotal += score
                  }
                }
              })
            }
          })
          
          groupStats[groupRecord.groupId] = {
            memberCount: groupMembers.size,
            userScore: userTotalScore
          }
        }
      })
      
      this.groupsWithStats = this.groups.map(group => ({
        ...group,
        memberCount: groupStats[group.id]?.memberCount || 0,
        userScore: groupStats[group.id]?.userScore || 0
      }))
      
      this.todayScore = todayTotal
      this.weekScore = weekTotal
      this.monthScore = monthTotal
      this.totalScore = total
      this.activeGroupCount = activeGroups.size
      this.activeMemberCount = activeMembers.size
    },

    // 跳转到群组详情
    goToGroupDetail(groupId) {
      if (!groupId) return;
      uni.navigateTo({
        url: '/pages/group/index?id=' + groupId
      })
    },

    // 跳转到群组列表
    goToGroupList() {
      uni.navigateTo({
        url: '/pages/group-list/group-list'
      })
    },
    showAddGroupDialog() {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo || !userInfo.username) {
        uni.navigateTo({
          url: '/pages/login/login'
        })
        return
      }
      this.showAddDialog = true
    },
    // 添加群组
    addGroup() {
      const groups = uni.getStorageSync('groups') || []
      if (!this.groupName.trim()) {
        uni.showToast({
          title: '请输入群组名称',
          icon: 'none'
        })
        return
      }
      // 查询名称是否重复
      if(groups.findIndex(gp => gp.groupName == this.groupName) != -1){
        uni.showToast({
          title: "该分组已存在",
          icon: "none"
        })
        return
      }

      // 新建一个组并缓存
      const group = {
        id: getUuid(),
        groupName: this.groupName
      }
      groups.push(group)
      uni.setStorageSync('groups', groups)
      this.groups = groups
      this.showAddDialog = false
      this.goToGroupDetail(group.id)
    }
  }
}
</script>

<style scoped>
/* 全局容器 */
.page-container {
  width: 100vw;
  min-height: 100vh;
  background-color: #f8fafc; /* bg-slate-50 */
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

/* 仪表盘容器 */
.dashboard-container {
  width: 100%;
  height: 812px;
  max-height: 90vh;
  background-color: #F8FAFC;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 顶部头部 */
.header-section {
  height: 56px; /* h-14 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px; /* px-6 */
  margin-top: 16px; /* mt-4 */
}

.user-info-box {
  display: flex;
  align-items: center;
  gap: 12px; /* gap-3 */
}

.avatar-wrapper {
  width: 40px; /* w-10 */
  height: 40px; /* h-10 */
  border-radius: 9999px; /* rounded-full */
  overflow: hidden;
  background-color: #e5e7eb;
  border: 1px solid #f3f4f6;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.greeting-text {
  font-size: 12px; /* text-xs */
  color: #9ca3af; /* text-gray-400 */
}

.username-text {
  font-size: 14px; /* text-sm */
  font-weight: bold;
  color: #1f2937; /* text-gray-800 */
}

.notification-btn {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 内容滚动区 */
.content-scroll-area {
  /* flex: 1; */
  height: calc(100% + 56px);
  padding: 24px; /* px-6 pt-6 */
  padding-bottom: 96px; /* pb-24 */
  box-sizing: border-box;
}

/* 核心指标卡片 */
.core-metrics-card {
  background: linear-gradient(to bottom right, #22C55E, #16A34A);
  border-radius: 24px; /* rounded-3xl */
  padding: 24px;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.05);
  margin-bottom: 32px; /* mb-8 */
  position: relative;
  overflow: hidden;
}

.metrics-content {
  position: relative;
  z-index: 10;
}

.metrics-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.metrics-value-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 24px;
}

.metrics-num {
  font-size: 36px; /* text-4xl */
  font-weight: bold;
}

.metrics-unit {
  font-size: 18px; /* text-lg */
  opacity: 0.8;
}

.metrics-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  opacity: 0.9;
}

.card-bg-icon {
  position: absolute;
  right: -16px;
  bottom: -16px;
  opacity: 0.1;
}

.stats-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.stat-item {
  flex: 1;
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
}

/* 分区标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px; /* mb-4 */
}

.section-title {
  font-weight: bold;
  color: #1f2937;
  font-size: 16px;
}

.add-group-btn {
  color: #22C55E;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 群组列表容器 */
.group-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px; /* space-y-4 */
  padding-bottom: 16px;
}

/* 群组卡片 */
.group-card {
  background-color: white;
  padding: 16px;
  border-radius: 24px; /* rounded-3xl */
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f9fafb;
}

.group-icon-box {
  width: 48px; /* w-12 */
  height: 48px;
  border-radius: 16px; /* rounded-2xl */
  display: flex;
  align-items: center;
  justify-content: center;
}

.group-info {
  flex: 1;
}

.group-name {
  font-weight: bold;
  color: #1f2937;
  font-size: 16px;
  margin-bottom: 2px;
}

.group-desc {
  font-size: 12px;
  color: #9ca3af;
}

/* 弹窗样式 (保留) */
.dialog {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  width: 300px;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 30rpx;
}

.input {
  margin-bottom: 30rpx;
}

.dialog-buttons {
  display: flex;
  gap: 20rpx;
}

.dialog-buttons u-button {
  flex: 1;
}
</style>