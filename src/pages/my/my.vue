<template>
  <view class="my-container">
    <view class="user-info">
      <image :src="userInfo.avatarUrl || 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'" class="avatar" @click="goToProfile"></image>
      <view class="user-detail">
        <view class="nickname">{{ userInfo.nickName || userInfo.phone || '未设置昵称' }}</view>
        <view class="phone">{{ userInfo.phone || '' }}</view>
      </view>
    </view>

    <view class="function-list">
      <view class="function-item" @click="goToStatistics">
        <text class="function-icon">📊</text>
        <text class="function-text">数据统计</text>
        <text class="arrow">→</text>
      </view>
      <view class="function-item" @click="goToLeaderboard">
        <text class="function-icon">🏆</text>
        <text class="function-text">积分排行</text>
        <text class="arrow">→</text>
      </view>
      <view class="function-item" @click="goToLeaderboard('settlement')">
        <text class="function-icon">📋</text>
        <text class="function-text">周期结算</text>
        <text class="arrow">→</text>
      </view>
      <view class="function-item" @click="goToNotifications">
        <text class="function-icon">🔔</text>
        <text class="function-text">消息通知</text>
        <text class="arrow">→</text>
      </view>
      <view class="function-item" @click="goToChangePassword">
        <text class="function-icon">🔒</text>
        <text class="function-text">修改密码</text>
        <text class="arrow">→</text>
      </view>
    </view>

    <view class="logout-btn-container">
      <u-button type="error" size="large" @click="logout">退出登录</u-button>
    </view>
  </view>
</template>

<script>
import { ensureLogin, queryDocs, auth } from '../../utils/cloudbase'

const DEFAULT_AVATAR = 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'

export default {
  data() {
    return {
      userInfo: {}
    }
  },
  onLoad() {
    this.getUserInfo()
  },
  onShow() {
    this.getUserInfo()
  },
  methods: {
    async getUserInfo() {
      const localUserInfo = uni.getStorageSync('userInfo')
      if (localUserInfo) {
        this.userInfo = localUserInfo
      }

      try {
        await ensureLogin()
        let cloudUsers = await queryDocs('users', { phone: localUserInfo.phone })
        if (cloudUsers.length === 0 && localUserInfo.username) {
          cloudUsers = await queryDocs('users', { username: localUserInfo.username })
        }
        if (cloudUsers.length > 0) {
          const cloudUser = cloudUsers[0]
          this.userInfo = {
            phone: cloudUser.phone || localUserInfo.phone,
            nickName: cloudUser.nickName || cloudUser.nickname || localUserInfo.nickName || '',
            avatarUrl: cloudUser.avatarUrl || localUserInfo.avatarUrl || DEFAULT_AVATAR
          }
          uni.setStorageSync('userInfo', this.userInfo)
        }
      } catch (err) {
        console.error('获取云端用户信息失败:', err)
      }
    },
    goToStatistics() {
      uni.navigateTo({
        url: '/pkg-statistics/statistics/pages/index'
      })
    },
    goToLeaderboard(tab) {
      const url = tab ? '/pkg-statistics/statistics/pages/leaderboard?tab=' + tab : '/pkg-statistics/statistics/pages/leaderboard'
      uni.navigateTo({ url })
    },
    goToNotifications() {
      uni.navigateTo({
        url: '/pkg-statistics/statistics/pages/notifications'
      })
    },
    goToProfile() {
      uni.navigateTo({
        url: '/pkg-profile/index'
      })
    },
    goToChangePassword() {
      uni.navigateTo({
        url: '/pkg-password/index'
      })
    },
    logout() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await auth.signOut()
            } catch (err) {
              console.error('登出失败:', err)
            }
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.redirectTo({
              url: '/pkg-login/login'
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.my-container {
  background-color: #f8f8f8;
  min-height: 100vh;
  padding: 20rpx;
}

.user-info {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
}

.user-detail {
  flex: 1;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.phone {
  font-size: 28rpx;
  color: #666;
}

.function-list {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.function-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.function-item:last-child {
  border-bottom: none;
}

.function-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.function-text {
  flex: 1;
  font-size: 32rpx;
  color: #333;
}

.arrow {
  font-size: 28rpx;
  color: #999;
}

.logout-btn-container {
  padding: 20rpx 0;
}
</style>
