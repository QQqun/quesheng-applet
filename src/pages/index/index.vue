<template>
  <view class="qs-page home">
    <view class="header">
      <view class="user-info">
        <view class="avatar-ring">
          <image
            :src="userInfo.avatarUrl || defaultAvatar"
            class="avatar-img"
            mode="aspectFill"
          ></image>
        </view>
        <view class="user-meta">
          <text class="greeting">{{ greetingText }}</text>
          <text class="username">{{ userInfo.nickName || userInfo.phone || '未知用户' }}</text>
        </view>
      </view>
      <view class="bell-btn" @click="goToNotifications">
        <u-icon name="bell" size="22" color="#F4FBF7"></u-icon>
        <view class="badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
      </view>
    </view>

    <!-- 核心积分卡 -->
    <view class="qs-hero hero-card">
      <view class="hero-top">
        <view>
          <text class="hero-label">累计积分</text>
          <view class="hero-value">
            <text class="hero-num">{{ totalScore }}</text>
            <text class="hero-unit">分</text>
          </view>
        </view>
        <view class="tile">
          <text class="tile-text">雀</text>
        </view>
      </view>
      <view class="hero-footer">
        <view class="hero-chip">
          <text class="chip-label">今日</text>
          <text class="chip-value">{{ todayScore >= 0 ? '+' : '' }}{{ todayScore }}</text>
        </view>
        <view class="hero-chip">
          <text class="chip-label">本周</text>
          <text class="chip-value">{{ weekScore >= 0 ? '+' : '' }}{{ weekScore }}</text>
        </view>
        <view class="hero-chip">
          <text class="chip-label">本月</text>
          <text class="chip-value">{{ monthScore >= 0 ? '+' : '' }}{{ monthScore }}</text>
        </view>
      </view>
    </view>

    <!-- 概览 -->
    <view class="overview">
      <view class="overview-card qs-glass" @click="showActiveGroups = true">
        <view class="overview-icon jade">
          <u-icon name="grid-fill" size="26" color="#34D399"></u-icon>
        </view>
        <view class="overview-text">
          <text class="overview-label">活跃群组</text>
          <text class="overview-value">{{ activeGroupCount || groups.length || 0 }}</text>
        </view>
      </view>
      <view class="overview-card qs-glass" @click="showActiveMembers = true">
        <view class="overview-icon gold">
          <u-icon name="account-fill" size="26" color="#E9C46A"></u-icon>
        </view>
        <view class="overview-text">
          <text class="overview-label">活跃成员</text>
          <text class="overview-value">{{ activeMemberCount }}</text>
        </view>
      </view>
    </view>

    <view class="section-head">
      <text class="qs-section-title">活跃群组</text>
      <view class="add-group" @click="showAddGroupDialog">
        <u-icon name="plus-circle-fill" color="#E9C46A" size="15"></u-icon>
        <text class="add-group-text">新建群组</text>
      </view>
    </view>

    <view class="group-list">
      <view
        v-for="(group, gIndex) in groupsWithStats"
        :key="group._id || group.id"
        class="group-card qs-glass"
        @click="goToGroupDetail(group._id || group.id)"
      >
        <view class="group-icon" :class="gIndex % 2 === 0 ? 'jade' : 'gold'">
          <u-icon :name="gIndex % 2 === 0 ? 'account-fill' : 'integral-fill'" size="24" :color="gIndex % 2 === 0 ? '#34D399' : '#E9C46A'"></u-icon>
        </view>
        <view class="group-info">
          <text class="group-name">{{ group.groupName }}</text>
          <text class="group-desc">{{ group.memberCount || 0 }} 人参与 · 我的积分 {{ group.userScore >= 0 ? '+' : '' }}{{ group.userScore }}</text>
        </view>
        <view class="group-score" :class="group.userScore >= 0 ? 'qs-jade' : 'qs-danger'">
          {{ group.userScore >= 0 ? '+' : '' }}{{ group.userScore }}
        </view>
      </view>

      <view v-if="groupsWithStats.length === 0" class="qs-glass qs-empty">
        <u-icon name="grid" size="46" color="#4C6B5C"></u-icon>
        <text style="margin-top: 16rpx;">还没有群组，点击右上角新建一个吧</text>
      </view>
    </view>

    <u-popup :show="showAddDialog" mode="center" :round="24" @close="showAddDialog = false" :safeAreaInsetBottom="false">
      <view class="dialog">
        <view class="dialog-title">新建群组</view>
        <view class="dialog-input">
          <u-input v-model="groupName" placeholder="请输入群组名称" border="none" customStyle="color:#F4FBF7"></u-input>
        </view>
        <view class="dialog-buttons">
          <u-button text="取消" @click="showAddDialog = false" customStyle="border-radius:20rpx;background:rgba(255,255,255,0.08);color:#B8CCC2;border:none"></u-button>
          <u-button text="确认" @click="addGroup" customStyle="border-radius:20rpx;background:linear-gradient(135deg,#E9C46A,#F2D98F);color:#05130D;font-weight:700;border:none"></u-button>
        </view>
      </view>
    </u-popup>

    <u-popup :show="showActiveGroups" mode="bottom" :round="28" @close="showActiveGroups = false" :safeAreaInsetBottom="true">
      <view class="popup-panel">
        <view class="popup-head">
          <text class="popup-title">活跃群组</text>
          <u-icon name="close" size="20" color="#8AA79B" @click="showActiveGroups = false"></u-icon>
        </view>
        <scroll-view scroll-y class="popup-scroll">
          <view v-for="group in activeGroupList" :key="group.groupId" class="popup-group">
            <view class="popup-group-head" @click="goToGroupDetail(group.groupId)">
              <text class="popup-group-name">{{ group.groupName }}</text>
              <u-icon name="arrow-right" size="14" color="#8AA79B"></u-icon>
            </view>
            <view v-for="member in group.members" :key="member.name" class="popup-row">
              <text class="popup-name">{{ member.name }}</text>
              <text class="popup-score" :class="member.totalScore >= 0 ? 'qs-jade' : 'qs-danger'">{{ member.totalScore >= 0 ? '+' : '' }}{{ member.totalScore }}</text>
            </view>
          </view>
          <view v-if="activeGroupList.length === 0" class="qs-empty">暂无数据</view>
        </scroll-view>
      </view>
    </u-popup>

    <u-popup :show="showActiveMembers" mode="bottom" :round="28" @close="showActiveMembers = false" :safeAreaInsetBottom="true">
      <view class="popup-panel">
        <view class="popup-head">
          <text class="popup-title">活跃成员</text>
          <u-icon name="close" size="20" color="#8AA79B" @click="showActiveMembers = false"></u-icon>
        </view>
        <scroll-view scroll-y class="popup-scroll">
          <view v-for="member in activeMemberList" :key="member.name" class="popup-member">
            <view class="popup-member-head">
              <text class="popup-name strong">{{ member.name }}</text>
              <text class="popup-total" :class="member.totalScore >= 0 ? 'qs-jade' : 'qs-danger'">{{ member.totalScore >= 0 ? '+' : '' }}{{ member.totalScore }} 分</text>
            </view>
            <view v-for="gs in member.groupScores" :key="gs.groupId" class="popup-row sub">
              <text class="popup-sub-name">{{ gs.groupName }}</text>
              <text class="popup-score" :class="gs.score >= 0 ? 'qs-jade' : 'qs-danger'">{{ gs.score >= 0 ? '+' : '' }}{{ gs.score }}</text>
            </view>
          </view>
          <view v-if="activeMemberList.length === 0" class="qs-empty">暂无数据</view>
        </scroll-view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, addDoc, queryDocs, queryScores } from '../../utils/cloudbase'
import { getUuid } from '../../utils'

export default {
  data() {
    return {
      defaultAvatar: 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg',
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
    const token = uni.getStorageSync('token')
    if (!token) {
      this.resetStats()
      this.updateGreeting()
      return
    }
    uni.showLoading({ title: '加载中...', mask: true })
    try {
      await Promise.all([this.getRecentGroups(), this.loadStatistics()])
      this.loadUnreadCount()
    } finally {
      uni.hideLoading()
    }
    this.updateGreeting()
  },
  computed: {
    displayedGroups() {
      return this.groups.slice(0, 4)
    }
  },
  methods: {
    resetStats() {
      this.groups = []
      this.groupsWithStats = []
      this.todayScore = 0
      this.weekScore = 0
      this.monthScore = 0
      this.totalScore = 0
      this.activeGroupCount = 0
      this.activeMemberCount = 0
      this.unreadCount = 0
    },

    getUserInfo() {
      const token = uni.getStorageSync('token')
      const userInfo = uni.getStorageSync('userInfo')
      if (token && userInfo && userInfo.phone) {
        this.userInfo = userInfo
      } else {
        this.userInfo = {
          nickName: '暂未登录',
          avatarUrl: this.defaultAvatar
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
        this.groups = groups.filter((g) => {
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

      this.greetingText = `${greeting} · ${dateStr}`
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

        const groupIds = this.groups.map((g) => g._id || g.id)
        let scores = []
        if (groupIds.length > 0) {
          scores = await queryScores({ groupIds })
        }

        scores.forEach((scoreRecord) => {
          const groupMembers = new Set()
          let userTotalScore = 0

          if (scoreRecord.users && scoreRecord.users.length > 0) {
            scoreRecord.users.forEach((user) => {
              const score = parseInt(user.score) || 0
              if (score === 0) return // 0 分视为未参与

              groupMembers.add(user.name)
              activeMembers.add(user.name)
              const isCurrentUser =
                (user.phone && user.phone === userPhone) ||
                user.name === userName ||
                user.name === userInfo.username
              if (isCurrentUser) {
                userTotalScore += score
                total += score
                if (scoreRecord.date === todayStr) todayTotal += score
                if (scoreRecord.date >= weekStartStr) weekTotal += score
                if (scoreRecord.date && scoreRecord.date.startsWith(monthStart)) monthTotal += score
              }

              if (!groupMemberScores[scoreRecord.groupId]) groupMemberScores[scoreRecord.groupId] = {}
              if (!groupMemberScores[scoreRecord.groupId][user.name]) groupMemberScores[scoreRecord.groupId][user.name] = 0
              groupMemberScores[scoreRecord.groupId][user.name] += score

              if (!memberGroupScores[user.name]) memberGroupScores[user.name] = {}
              if (!memberGroupScores[user.name][scoreRecord.groupId]) memberGroupScores[user.name][scoreRecord.groupId] = 0
              memberGroupScores[user.name][scoreRecord.groupId] += score
            })
          }

          if (groupMembers.size > 0) {
            activeGroups.add(scoreRecord.groupId)
          }

          groupStats[scoreRecord.groupId] = {
            memberCount: groupMembers.size,
            userScore: userTotalScore
          }
        })

        this.groupsWithStats = this.groups.map((group) => ({
          ...group,
          memberCount: groupStats[group._id || group.id]?.memberCount || 0,
          userScore: groupStats[group._id || group.id]?.userScore || 0
        }))

        this.activeGroupList = this.groups
          .filter((g) => activeGroups.has(g._id || g.id))
          .map((group) => {
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
            const group = this.groups.find((g) => (g._id || g.id) === groupId)
            return { groupId, groupName: group ? group.groupName : '未知群组', score }
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
      if (!groupId) return
      uni.navigateTo({ url: '/pkg-group/index?id=' + groupId })
    },

    showAddGroupDialog() {
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo || !userInfo.phone) {
        uni.navigateTo({ url: '/pkg-login/login' })
        return
      }
      this.showAddDialog = true
    },

    async addGroup() {
      if (!this.groupName.trim()) {
        uni.showToast({ title: '请输入群组名称', icon: 'none' })
        return
      }
      if (this.groups.findIndex((gp) => gp.groupName == this.groupName) != -1) {
        uni.showToast({ title: '该分组已存在', icon: 'none' })
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
        uni.showToast({ title: '添加失败，请重试', icon: 'none' })
      }
    },

    async loadUnreadCount() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        let notifications = []
        if (userInfo.phone) {
          notifications = await queryDocs('notifications', { userId: userInfo.phone, isRead: false })
        }
        if (notifications.length === 0 && userInfo.username) {
          notifications = await queryDocs('notifications', { userId: userInfo.username, isRead: false })
        }
        this.unreadCount = notifications.length
      } catch (err) {
        console.error('获取未读数失败:', err)
      }
    },

    goToNotifications() {
      uni.navigateTo({ url: '/pkg-statistics/statistics/pages/notifications' })
    }
  }
}
</script>

<style scoped>
.home {
  padding-top: 32rpx;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8rpx 4rpx 28rpx;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar-ring {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  padding: 4rpx;
  background: linear-gradient(135deg, rgba(233, 196, 106, 0.8), rgba(52, 211, 153, 0.8));
  box-sizing: border-box;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #0c241b;
}

.user-meta {
  display: flex;
  flex-direction: column;
  margin-left: 20rpx;
}

.greeting {
  font-size: 22rpx;
  color: #8aa79b;
  margin-bottom: 4rpx;
}

.username {
  font-size: 30rpx;
  font-weight: 700;
  color: #f4fbf7;
}

.bell-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.badge {
  position: absolute;
  top: -6rpx;
  right: -4rpx;
  min-width: 30rpx;
  height: 30rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  box-sizing: border-box;
}

.hero-card {
  padding: 36rpx 34rpx;
  margin-bottom: 24rpx;
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.hero-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 2rpx;
}

.hero-value {
  display: flex;
  align-items: baseline;
  margin-top: 10rpx;
}

.hero-num {
  font-size: 78rpx;
  font-weight: 800;
  line-height: 1;
  color: #fff9e8;
  text-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.28);
}

.hero-unit {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 10rpx;
}

.tile {
  width: 96rpx;
  height: 124rpx;
  border-radius: 18rpx;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.08));
  border: 2rpx solid rgba(233, 196, 106, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 24rpx rgba(255, 255, 255, 0.18);
}

.tile-text {
  font-size: 48rpx;
  font-weight: 800;
  color: #fff5d6;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.25);
}

.hero-footer {
  display: flex;
  margin-top: 32rpx;
  gap: 14rpx;
  position: relative;
  z-index: 2;
}

.hero-chip {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14rpx 18rpx;
  border-radius: 18rpx;
  background: rgba(0, 0, 0, 0.16);
  border: 1rpx solid rgba(255, 255, 255, 0.14);
}

.chip-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6rpx;
}

.chip-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #ffe9ad;
}

.overview {
  display: flex;
  gap: 20rpx;
  margin-bottom: 36rpx;
}

.overview-card {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 24rpx;
}

.overview-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18rpx;
}

.overview-icon.jade {
  background: rgba(52, 211, 153, 0.14);
  border: 1rpx solid rgba(52, 211, 153, 0.3);
}

.overview-icon.gold {
  background: rgba(233, 196, 106, 0.14);
  border: 1rpx solid rgba(233, 196, 106, 0.3);
}

.overview-text {
  display: flex;
  flex-direction: column;
}

.overview-label {
  font-size: 22rpx;
  color: #8aa79b;
  margin-bottom: 6rpx;
}

.overview-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #f4fbf7;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
  padding: 0 4rpx;
}

.add-group {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(233, 196, 106, 0.12);
  border: 1rpx solid rgba(233, 196, 106, 0.3);
}

.add-group-text {
  font-size: 23rpx;
  color: #f2d98f;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.group-card {
  display: flex;
  align-items: center;
  padding: 26rpx 24rpx;
}

.group-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.group-icon.jade {
  background: rgba(52, 211, 153, 0.13);
  border: 1rpx solid rgba(52, 211, 153, 0.28);
}

.group-icon.gold {
  background: rgba(233, 196, 106, 0.13);
  border: 1rpx solid rgba(233, 196, 106, 0.28);
}

.group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.group-name {
  font-size: 29rpx;
  font-weight: 700;
  color: #f4fbf7;
  margin-bottom: 6rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-desc {
  font-size: 23rpx;
  color: #8aa79b;
}

.group-score {
  font-size: 32rpx;
  font-weight: 800;
  margin-left: 16rpx;
}

.dialog {
  width: 600rpx;
  padding: 44rpx 40rpx 36rpx;
  border-radius: 28rpx;
  background: #0e241b;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  box-sizing: border-box;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f4fbf7;
  text-align: center;
  margin-bottom: 32rpx;
}

.dialog-input {
  padding: 18rpx 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  margin-bottom: 32rpx;
}

.dialog-buttons {
  display: flex;
  gap: 20rpx;
}

.dialog-buttons u-button {
  flex: 1;
}

.popup-panel {
  background: #0b2018;
  max-height: 74vh;
  display: flex;
  flex-direction: column;
}

.popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 32rpx 22rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f4fbf7;
}

.popup-scroll {
  max-height: 62vh;
  padding: 0 32rpx 32rpx;
  box-sizing: border-box;
}

.popup-group {
  margin-top: 24rpx;
}

.popup-group-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.popup-group-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #f4fbf7;
}

.popup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 10rpx;
}

.popup-row.sub {
  background: transparent;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
  border-radius: 0;
}

.popup-name {
  font-size: 26rpx;
  color: #dcebe3;
}

.popup-name.strong {
  font-weight: 700;
  font-size: 29rpx;
}

.popup-sub-name {
  font-size: 24rpx;
  color: #8aa79b;
}

.popup-score {
  font-size: 28rpx;
  font-weight: 700;
}

.popup-member {
  margin-top: 24rpx;
}

.popup-member-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 20rpx 14rpx;
}

.popup-total {
  font-size: 28rpx;
  font-weight: 800;
}
</style>
