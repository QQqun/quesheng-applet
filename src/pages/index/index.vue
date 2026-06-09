<template>
  <view class="page-container">
    <view class="dashboard-container">
      
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

        <view class="section-header">
          <text class="section-title">最近活跃群组</text>
          <view class="add-group-btn" @click="showAddGroupDialog">
            <u-icon name="plus-circle" color="#22C55E" size="16" style="margin-right: 4px;"></u-icon>
            <text>添加群组</text>
          </view>
        </view>

        <view class="group-list-container">
          <block v-if="groupsWithStats.length > 0">
            <view v-for="(group) in groupsWithStats" :key="group._id || group.id" class="group-card" @click="goToGroupDetail(group._id || group.id)">
              <view class="group-icon-box bg-blue-50 text-blue-500">
                <u-icon name="account-fill" size="24" color="#3b82f6"></u-icon>
              </view>
              <view class="group-info">
                <view class="group-name">{{ group.groupName }}</view>
                <view class="group-desc">{{ group.memberCount || 0 }}人 · 我的积分: {{ group.userScore >= 0 ? '+' : '' }}{{ group.userScore }}</view>
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
import { ensureLogin, addDoc, queryDocs } from '../../utils/cloudbase'
import { getUuid } from '../../utils'

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
    displayedGroups() {
      return this.groups.slice(0, 4)
    }
  },
  methods: {
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
    async getRecentGroups() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const groups = await queryDocs('groups', {
          creatorId: userInfo.username
        })
        this.groups = groups
        uni.setStorageSync('groups', groups)
      } catch (err) {
        console.error('获取群组失败:', err)
        const groups = uni.getStorageSync('groups')
        this.groups = groups || []
      }
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
    
    async loadStatistics() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const userName = userInfo.nickName || userInfo.username || '雀圣'

        const today = new Date()
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        
        const weekStart = new Date(today)
        const dayOfWeek = today.getDay() || 7
        weekStart.setDate(today.getDate() - dayOfWeek + 1)
        const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
        
        const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

        let todayTotal = 0
        let weekTotal = 0
        let monthTotal = 0
        let total = 0
        const activeGroups = new Set()
        const activeMembers = new Set()
        const groupStats = {}

        const scores = await queryDocs('scores', {
          creatorId: userInfo.username
        })

        scores.forEach(scoreRecord => {
          const groupMembers = new Set()
          let userTotalScore = 0

          if (scoreRecord.users && scoreRecord.users.length > 0) {
            activeGroups.add(scoreRecord.groupId)
            scoreRecord.users.forEach(user => {
              groupMembers.add(user.name)
              activeMembers.add(user.name)
              const score = parseInt(user.score) || 0
              if (user.name === userName) {
                userTotalScore += score
                total += score
                if (scoreRecord.date === todayStr) {
                  todayTotal += score
                }
                if (scoreRecord.date >= weekStartStr) {
                  weekTotal += score
                }
                if (scoreRecord.date.startsWith(monthStart)) {
                  monthTotal += score
                }
              }
            })
          }

          groupStats[scoreRecord.groupId] = {
            memberCount: groupMembers.size,
            userScore: userTotalScore
          }
        })

        this.groupsWithStats = this.groups.map(group => ({
          ...group,
          memberCount: groupStats[group._id || group.id]?.memberCount || 0,
          userScore: groupStats[group._id || group.id]?.userScore || 0
        }))

        this.todayScore = todayTotal
        this.weekScore = weekTotal
        this.monthScore = monthTotal
        this.totalScore = total
        this.activeGroupCount = activeGroups.size
        this.activeMemberCount = activeMembers.size
      } catch (err) {
        console.error('加载统计失败:', err)
      }
    },

    goToGroupDetail(groupId) {
      if (!groupId) return;
      uni.navigateTo({
        url: '/pages/group/index?id=' + groupId
      })
    },

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
    async addGroup() {
      if (!this.groupName.trim()) {
        uni.showToast({
          title: '请输入群组名称',
          icon: 'none'
        })
        return
      }
      if(this.groups.findIndex(gp => gp.groupName == this.groupName) != -1){
        uni.showToast({
          title: "该分组已存在",
          icon: "none"
        })
        return
      }

      try {
        const userInfo = uni.getStorageSync('userInfo')
        const group = {
          id: getUuid(),
          groupName: this.groupName,
          creatorId: userInfo.username,
          members: [userInfo.nickName || userInfo.username]
        }
        const res = await addDoc('groups', group)
        group._id = res.id
        this.groups.push(group)
        uni.setStorageSync('groups', this.groups)
        this.showAddDialog = false
        this.goToGroupDetail(group._id || group.id)
      } catch (err) {
        console.error('添加群组失败:', err)
        uni.showToast({
          title: '添加失败，请重试',
          icon: 'none'
        })
      }
    }
  }
}
</script>

<style scoped>
.page-container {
  width: 100vw;
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
}

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

.header-section {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  margin-top: 16px;
}

.user-info-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
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
  font-size: 12px;
  color: #9ca3af;
}

.username-text {
  font-size: 14px;
  font-weight: bold;
  color: #1f2937;
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

.content-scroll-area {
  height: calc(100% + 56px);
  padding: 24px;
  padding-bottom: 96px;
  box-sizing: border-box;
}

.core-metrics-card {
  background: linear-gradient(to bottom right, #22C55E, #16A34A);
  border-radius: 24px;
  padding: 24px;
  color: white;
  box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.1), 0 4px 6px -2px rgba(34, 197, 94, 0.05);
  margin-bottom: 32px;
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
  font-size: 36px;
  font-weight: bold;
}

.metrics-unit {
  font-size: 18px;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

.group-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 16px;
}

.group-card {
  background-color: white;
  padding: 16px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f9fafb;
}

.group-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 16px;
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
