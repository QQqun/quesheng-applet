<template>
  <view class="page-container">
    <view class="action-bar">
      <text class="action-btn" @click="markAllRead">全部已读</text>
      <text class="action-btn danger" @click="clearAll">清空</text>
    </view>

    <view v-if="notifications.length === 0" class="empty-state">
      <u-icon name="bell" color="#d1d5db" size="48"></u-icon>
      <text class="empty-text">暂无消息</text>
    </view>

    <view v-else class="notification-list">
      <view
        v-for="item in notifications"
        :key="item._id"
        class="notification-item"
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
import { ensureLogin, queryAllDocs, updateDoc, removeDoc } from '@/utils/cloudbase'

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
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const list = await queryAllDocs('notifications', {
          userId: userInfo.username
        })
        this.notifications = list.sort((a, b) => {
          const ta = a.createTime ? new Date(a.createTime).getTime() : 0
          const tb = b.createTime ? new Date(b.createTime).getTime() : 0
          return tb - ta
        })
      } catch (err) {
        console.error('加载通知失败:', err)
      }
    },
    async handleNotificationClick(item) {
      if (!item.isRead) {
        try {
          await updateDoc('notifications', item._id, { isRead: true })
          item.isRead = true
        } catch (err) {
          console.error('标记已读失败:', err)
        }
      }
      if (item.groupId) {
        uni.navigateTo({
          url: '/pkg-group/index?id=' + item.groupId
        })
      }
    },
    async markAllRead() {
      const unread = this.notifications.filter(n => !n.isRead)
      if (unread.length === 0) {
        uni.showToast({ title: '没有未读消息', icon: 'none' })
        return
      }
      try {
        for (const item of unread) {
          await updateDoc('notifications', item._id, { isRead: true })
        }
        this.notifications.forEach(n => { n.isRead = true })
        uni.showToast({ title: '已全部标记为已读', icon: 'success' })
      } catch (err) {
        console.error('批量标记失败:', err)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    async clearAll() {
      if (this.notifications.length === 0) return
      const res = await new Promise(resolve => {
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
          await removeDoc('notifications', item._id)
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
        settlement: '周期结算',
        system: '系统通知'
      }
      return map[type] || '通知'
    },
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #F8FAFC;
  padding-bottom: 40rpx;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  padding: 16px 20px;
}

.action-btn {
  font-size: 14px;
  color: #6b7280;
}

.action-btn.danger {
  color: #ef4444;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;
  color: #9ca3af;
}

.notification-list {
  padding: 0 16px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  box-sizing: border-box;
}

.notification-item.unread {
  background-color: #f0fdf4;
}

.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #22C55E;
  margin-top: 6px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.notification-type {
  font-size: 12px;
  color: #22C55E;
  font-weight: 500;
}

.notification-time {
  font-size: 12px;
  color: #9ca3af;
}

.notification-title {
  font-size: 15px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
  display: block;
}

.notification-desc {
  font-size: 13px;
  color: #6b7280;
  display: block;
}
</style>
