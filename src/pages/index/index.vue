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
            <view class="username-text">{{ userInfo.nickName || userInfo.phone || '未知用户' }}</view>
          </view>
        </view>
        <view class="notification-btn" @click="goToNotifications">
          <u-icon name="bell" size="20" color="#9ca3af"></u-icon>
          <view class="badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
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
          <view class="stat-item" @click="showActiveGroups = true">
            <view class="stat-icon" style="background-color: #eff6ff;">
              <u-icon name="grid-fill" size="24" color="#3b82f6"></u-icon>
            </view>
            <view class="stat-info">
              <text class="stat-label">活跃群组</text>
              <text class="stat-value">{{ activeGroupCount || groups.length || 0 }}</text>
            </view>
          </view>
          <view class="stat-item" @click="showActiveMembers = true">
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

    <u-popup :show="showActiveGroups" mode="bottom" :round="16" @close="showActiveGroups = false" :safeAreaInsetBottom="true">
      <view class="popup-panel">
        <view class="popup-title-bar">
          <text class="popup-title">活跃群组</text>
          <u-icon name="close" size="20" color="#9ca3af" @click="showActiveGroups = false"></u-icon>
        </view>
        <scroll-view scroll-y class="popup-scroll">
          <view v-for="group in activeGroupList" :key="group.groupId" class="popup-group-block">
            <view class="popup-group-header" @click="goToGroupDetail(group.groupId)">
              <text class="popup-group-name">{{ group.groupName }}</text>
              <u-icon name="arrow-right" size="14" color="#9ca3af"></u-icon>
            </view>
            <view v-for="member in group.members" :key="member.name" class="popup-member-row">
              <text class="popup-member-name">{{ member.name }}</text>
              <text class="popup-member-score" :class="member.totalScore >= 0 ? 'score-positive' : 'score-negative'">{{ member.totalScore >= 0 ? '+' : '' }}{{ member.totalScore }}</text>
            </view>
          </view>
          <view v-if="activeGroupList.length === 0" class="popup-empty">暂无数据</view>
        </scroll-view>
      </view>
    </u-popup>

    <u-popup :show="showActiveMembers" mode="bottom" :round="16" @close="showActiveMembers = false" :safeAreaInsetBottom="true">
      <view class="popup-panel">
        <view class="popup-title-bar">
          <text class="popup-title">活跃成员</text>
          <u-icon name="close" size="20" color="#9ca3af" @click="showActiveMembers = false"></u-icon>
        </view>
        <scroll-view scroll-y class="popup-scroll">
          <view v-for="member in activeMemberList" :key="member.name" class="popup-member-block">
            <view class="popup-member-header">
              <text class="popup-member-name">{{ member.name }}</text>
              <text class="popup-member-total" :class="member.totalScore >= 0 ? 'score-positive' : 'score-negative'">{{ member.totalScore >= 0 ? '+' : '' }}{{ member.totalScore }}分</text>
            </view>
            <view v-for="gs in member.groupScores" :key="gs.groupId" class="popup-member-row">
              <text class="popup-group-sub">{{ gs.groupName }}</text>
              <text class="popup-member-score" :class="gs.score >= 0 ? 'score-positive' : 'score-negative'">{{ gs.score >= 0 ? '+' : '' }}{{ gs.score }}</text>
            </view>
          </view>
          <view v-if="activeMemberList.length === 0" class="popup-empty">暂无数据</view>
        </scroll-view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, addDoc, queryDocs, queryAllDocs, db } from '../../utils/cloudbase'
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
      activeMemberCount: 0,
      showActiveGroups: false,
      showActiveMembers: false,
      activeGroupList: [],
      activeMemberList: [],
      unreadCount: 0
    }
  },

  async onShow() {
    this.getUserInfo()
    await this.getRecentGroups()
    this.loadStatistics()
    this.updateGreeting()
    this.loadUnreadCount()
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
        const userPhone = userInfo.phone || ''
        const userName = userInfo.nickName || userInfo.username || ''
        
        let groups = []
        if (userPhone) {
          groups = await queryDocs('groups', { members: userPhone })
        }
        if (groups.length === 0 && userName) {
          const legacyGroups = await queryDocs('groups', { members: userName })
          groups = groups.concat(legacyGroups)
        }
        const seen = new Set()
        this.groups = groups.filter(g => {
          const key = g._id || g.id
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        uni.setStorageSync('groups', this.groups)
      } catch (err) {
        console.error('获取群组失败:', err)
        const groups = uni.getStorageSync('groups')
        this.groups = groups || []
      }
    },
    
    updateGreeting() {
      const now = dayjs()
      const hour = now.hour()
      const dateStr = now.format('YYYY/MM/DD')
      
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
        const userPhone = userInfo.phone || ''
        const userName = userInfo.nickName || userPhone

        const todayStr = dayjs().format('YYYY-MM-DD')
        
        const dayOfWeek = dayjs().day() || 7
        const weekStartStr = dayjs().subtract(dayOfWeek - 1, 'day').format('YYYY-MM-DD')
        
        const monthStart = dayjs().format('YYYY-MM')

        let todayTotal = 0
        let weekTotal = 0
        let monthTotal = 0
        let total = 0
        const activeGroups = new Set()
        const activeMembers = new Set()
        const groupStats = {}
        const groupMemberScores = {}
        const memberGroupScores = {}

        const groupIds = this.groups.map(g => g._id || g.id)
        let scores = []
        if (groupIds.length > 0) {
          const _ = db.command
          scores = await queryAllDocs('scores', {
            groupId: _.in(groupIds)
          })
        }

        scores.forEach(scoreRecord => {
          const groupMembers = new Set()
          let userTotalScore = 0

          if (scoreRecord.users && scoreRecord.users.length > 0) {
            activeGroups.add(scoreRecord.groupId)
            scoreRecord.users.forEach(user => {
              groupMembers.add(user.name)
              activeMembers.add(user.name)
              const score = parseInt(user.score) || 0
              const isCurrentUser = (user.phone && user.phone === userPhone) || user.name === userName || user.name === userInfo.username
              if (isCurrentUser) {
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

              if (!groupMemberScores[scoreRecord.groupId]) {
                groupMemberScores[scoreRecord.groupId] = {}
              }
              if (!groupMemberScores[scoreRecord.groupId][user.name]) {
                groupMemberScores[scoreRecord.groupId][user.name] = 0
              }
              groupMemberScores[scoreRecord.groupId][user.name] += score

              if (!memberGroupScores[user.name]) {
                memberGroupScores[user.name] = {}
              }
              if (!memberGroupScores[user.name][scoreRecord.groupId]) {
                memberGroupScores[user.name][scoreRecord.groupId] = 0
              }
              memberGroupScores[user.name][scoreRecord.groupId] += score
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

        this.activeGroupList = this.groups
          .filter(g => activeGroups.has(g._id || g.id))
          .map(group => {
            const groupId = group._id || group.id
            const memberScores = groupMemberScores[groupId] || {}
            return {
              groupId,
              groupName: group.groupName,
              members: Object.entries(memberScores).map(([name, totalScore]) => ({ name, totalScore }))
            }
          })

        this.activeMemberList = Object.entries(memberGroupScores).map(([name, groupScores]) => {
          const groupScoreList = Object.entries(groupScores).map(([groupId, score]) => {
            const group = this.groups.find(g => (g._id || g.id) === groupId)
            return {
              groupId,
              groupName: group ? group.groupName : '未知群组',
              score
            }
          })
          return {
            name,
            totalScore: groupScoreList.reduce((sum, gs) => sum + gs.score, 0),
            groupScores: groupScoreList
          }
        })

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
        url: '/pkg-group/index?id=' + groupId
      })
    },

    goToGroupList() {
      uni.navigateTo({
        url: '/pages/group-list/group-list'
      })
    },
    showAddGroupDialog() {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo || !userInfo.phone) {
        uni.navigateTo({
          url: '/pkg-login/login'
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
          creatorId: userInfo.phone,
          members: [userInfo.phone]
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
    },
    async loadUnreadCount() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        let notifications = []
        if (userInfo.phone) {
          notifications = await queryDocs('notifications', {
            userId: userInfo.phone,
            isRead: false
          })
        }
        if (notifications.length === 0 && userInfo.username) {
          notifications = await queryDocs('notifications', {
            userId: userInfo.username,
            isRead: false
          })
        }
        this.unreadCount = notifications.length
      } catch (err) {
        console.error('获取未读数失败:', err)
      }
    },
    goToNotifications() {
      uni.navigateTo({
        url: '/pkg-statistics/statistics/pages/notifications'
      })
    },

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
  box-sizing: border-box;
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
  position: relative;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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

.popup-panel {
  background-color: #fff;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.popup-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 12px;
  border-bottom: 1px solid #f3f4f6;
  box-sizing: border-box;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
}

.popup-scroll {
  max-height: 60vh;
  padding: 0 20px 20px;
  box-sizing: border-box;
}

.popup-group-block {
  margin-top: 16px;
}

.popup-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  box-sizing: border-box;
}

.popup-group-name {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
}

.popup-member-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f9fafb;
  box-sizing: border-box;
}

.popup-member-name {
  font-size: 14px;
  color: #374151;
}

.popup-member-score {
  font-size: 14px;
  font-weight: 500;
}

.popup-member-block {
  margin-top: 16px;
}

.popup-member-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  box-sizing: border-box;
}

.popup-member-total {
  font-size: 14px;
  font-weight: bold;
}

.popup-group-sub {
  font-size: 13px;
  color: #6b7280;
}

.popup-empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px 0;
  font-size: 14px;
  box-sizing: border-box;
}

.score-positive {
  color: #22C55E;
}

.score-negative {
  color: #ef4444;
}
</style>
