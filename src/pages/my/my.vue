<template>
  <view class="my-container">
    <!-- 用户信息 -->
    <view class="user-info">
      <image :src="userInfo.avatarUrl" class="avatar"></image>
      <view class="user-detail">
        <view class="nickname">{{ userInfo.nickName || '未设置昵称' }}</view>
        <view class="phone">{{ userInfo.phone || '未绑定手机号' }}</view>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="function-list">
      <view class="function-item" @click="goToStatistics">
        <text class="function-icon">📊</text>
        <text class="function-text">数据统计</text>
        <text class="arrow">→</text>
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <view class="logout-btn-container">
      <u-button type="error" size="large" @click="logout">退出登录</u-button>
    </view>
  </view>
</template>

<script>
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
    // 获取用户信息
    getUserInfo() {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo) {
        this.userInfo = userInfo
      }
    },
    // 跳转到数据统计页面
    goToStatistics() {
      uni.navigateTo({
        url: '/pages/statistics/index'
      })
    },
    // 退出登录
    logout() {
      uni.showModal({
        title: '退出登录',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除缓存
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            // 跳转到登录页
            uni.redirectTo({
              url: '/pages/login/login'
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

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
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

/* 功能列表 */
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

/* 退出登录按钮 */
.logout-btn-container {
  padding: 20rpx 0;
}
</style>
