<template>
  <view class="qs-page notice-page">
    <view class="action-bar">
      <text class="action-btn" @click="markAllRead">全部已读</text>
      <text class="action-btn danger" @click="clearAll">清空</text>
    </view>

    <view v-if="notifications.length === 0" class="qs-glass qs-empty">
      <u-icon name="bell" color="#4C6B5C" size="46"></u-icon>
      <text style="margin-top: 16rpx;">暂无消息</text>
    </view>

    <view v-else class="notification-list">
      <view
        v-for="item in notifications"
        :key="item._id"
        class="notification-item qs-glass"
        :class="{ unread: !item.isRead }"
        @click="handleNotificationClick(item)"
      >
        <view class="notification-dot" v-if="!item.isRead"></view>
        <view class="notification-content">
          <view class="notification-header">
            <text class="notification-type">{{ getTypeLabel(item.type) }}</text>
            <text class="notification-time">{{ formatTime(item.createTime) }}</text>
          </view>
          <text class="notification-title">{{ item.title }}</text>
          <text class="notification-desc">{{ item.content }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, queryAllDocs } from '@/utils/cloudbase'

async function cloudUpdateDoc(collection, docId, data) {
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'markNotificationsRead',
      data: { action: 'updateDoc', collection, docId, data }
    })
    if (result.success) return result
    throw new Error(result.error || '更新失败')
  } catch (err) {
    console.error('cloudUpdateDoc 失败，回退客户端:', err)
    const { updateDoc } = require('@/utils/cloudbase')
    return await updateDoc(collection, docId, data)
  }
}

async function cloudRemoveDoc(collection, docId) {
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'markNotificationsRead',
      data: { action: 'removeDoc', collection, docId }
    })
    if (result.success) return result
    throw new Error(result.error || '删除失败')
  } catch (err) {
    console.error('cloudRemoveDoc 失败，回退客户端:', err)
    const { removeDoc } = require('@/utils/cloudbase')
    return await removeDoc(collection, docId)
  }
}

async function cloudMarkAllRead() {
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'markNotificationsRead',
      data: { action: 'markRead' }
    })
    return result
  } catch (err) {
    console.error('cloudMarkAllRead 失败:', err)
    return { success: false, error: err.message }
  }
}

export default {
  data() {
    return {
      notifications: []
    }
  },
  onShow() {
    this.loadNotifications()
  },
  methods: {
    async loadNotifications() {
      uni.showLoading({ title: '加载中...', mask: true })
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {}
        let list = []
        if (userInfo.phone) {
          list = await queryAllDocs('notifications', { userId: userInfo.phone })
        }
        if (list.length === 0 && userInfo.username) {
          list = list.concat(await queryAllDocs('notifications', { userId: userInfo.username }))
        }
        const seen = new Set()
        list = list.filter((n) => {
          if (seen.has(n._id)) return false
          seen.add(n._id)
          return true
        })
        this.notifications = list.sort((a, b) => {
          const ta = a.createTime ? dayjs(a.createTime).valueOf() : 0
          const tb = b.createTime ? dayjs(b.createTime).valueOf() : 0
          return tb - ta
        })
      } catch (err) {
        console.error('加载通知失败:', err)
      } finally {
        uni.hideLoading()
      }
    },
    async handleNotificationClick(item) {
      if (!item.isRead) {
        try {
          await cloudUpdateDoc('notifications', item._id, { isRead: true })
          item.isRead = true
        } catch (err) {
          console.error('标记已读失败:', err)
        }
      }
      if (item.groupId) {
        uni.navigateTo({ url: '/pkg-group/index?id=' + item.groupId })
      }
    },
    async markAllRead() {
      const unread = this.notifications.filter((n) => !n.isRead)
      if (unread.length === 0) {
        uni.showToast({ title: '没有未读消息', icon: 'none' })
        return
      }
      try {
        const result = await cloudMarkAllRead()
        if (result.success) {
          this.notifications.forEach((n) => { n.isRead = true })
          uni.showToast({ title: '已全部标记为已读', icon: 'success' })
        } else {
          for (const item of unread) {
            await cloudUpdateDoc('notifications', item._id, { isRead: true })
          }
          this.notifications.forEach((n) => { n.isRead = true })
          uni.showToast({ title: '已全部标记为已读', icon: 'success' })
        }
      } catch (err) {
        console.error('批量标记失败:', err)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    async clearAll() {
      if (this.notifications.length === 0) return
      const res = await new Promise((resolve) => {
        uni.showModal({
          title: '确认清空',
          content: '确定要清空所有消息吗？',
          confirmColor: '#ef4444',
          success: resolve
        })
      })
      if (!res.confirm) return
      try {
        for (const item of this.notifications) {
          await cloudRemoveDoc('notifications', item._id)
        }
        this.notifications = []
        uni.showToast({ title: '已清空', icon: 'success' })
      } catch (err) {
        console.error('清空失败:', err)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    getTypeLabel(type) {
      const map = {
        score_change: '积分变动',
        new_member: '新成员',
        member_leave: '成员退出',
        settlement: '周期结算',
        system: '系统通知'
      }
      return map[type] || '通知'
    },
    formatTime(time) {
      if (!time) return ''
      const d = dayjs(time)
      const diff = dayjs().diff(d)
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
      return d.format('M/D')
    }
  }
}
</script>

<style scoped>
.notice-page {
  padding-top: 20rpx;
  padding-bottom: 40rpx;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 22rpx;
  padding: 8rpx 6rpx 22rpx;
}

.action-btn {
  font-size: 24rpx;
  color: #b8ccc2;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.action-btn.danger {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.28);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 24rpx;
  position: relative;
}

.notification-item.unread {
  border-color: rgba(233, 196, 106, 0.35);
  background: linear-gradient(160deg, rgba(233, 196, 106, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
}

.notification-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #e9c46a;
  box-shadow: 0 0 12rpx rgba(233, 196, 106, 0.9);
  margin-top: 8rpx;
  flex-shrink: 0;
  margin-right: 14rpx;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.notification-type {
  font-size: 22rpx;
  color: #f2d98f;
  font-weight: 600;
}

.notification-time {
  font-size: 21rpx;
  color: #6e8c7f;
}

.notification-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #f4fbf7;
  margin-bottom: 8rpx;
  display: block;
}

.notification-desc {
  font-size: 24rpx;
  color: #8aa79b;
  display: block;
  line-height: 1.5;
}
</style>
