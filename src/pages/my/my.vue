<template>
  <view class="qs-page my-page">
    <!-- 个人信息 -->
    <view class="qs-hero profile-card" @click="goToProfile">
      <view class="profile-inner">
        <view class="avatar-ring">
          <image :src="userInfo.avatarUrl || defaultAvatar" class="avatar" mode="aspectFill"></image>
        </view>
        <view class="profile-meta" v-if="isLoggedIn">
          <text class="profile-name">{{ userInfo.nickName || userInfo.phone || '未设置昵称' }}</text>
          <text class="profile-phone">{{ userInfo.phone || '' }}</text>
        </view>
        <view class="profile-meta" v-else>
          <text class="profile-name">暂未登录</text>
          <text class="profile-phone">点击去登录 →</text>
        </view>
        <view class="profile-arrow">
          <u-icon name="arrow-right" size="16" color="#F2D98F"></u-icon>
        </view>
      </view>
      <view class="profile-glow"></view>
    </view>

    <!-- 功能入口 -->
    <view class="section-head">
      <text class="qs-section-title">功能中心</text>
    </view>
    <view class="function-grid">
      <view class="function-card qs-glass" @click="goToStatistics">
        <view class="function-icon jade">
          <u-icon name="grid-fill" size="26" color="#34D399"></u-icon>
        </view>
        <view class="function-info">
          <text class="function-text">数据统计</text>
          <text class="function-desc">年 / 月 / 个人维度</text>
        </view>
        <u-icon name="arrow-right" size="14" color="#8AA79B"></u-icon>
      </view>
      <view class="function-card qs-glass" @click="goToLeaderboard">
        <view class="function-icon gold">
          <u-icon name="integral-fill" size="26" color="#E9C46A"></u-icon>
        </view>
        <view class="function-info">
          <text class="function-text">积分排行</text>
          <text class="function-desc">周 / 月 / 总榜</text>
        </view>
        <u-icon name="arrow-right" size="14" color="#8AA79B"></u-icon>
      </view>
      <view class="function-card qs-glass" @click="goToLeaderboard('settlement')">
        <view class="function-icon jade">
          <u-icon name="file-text-fill" size="26" color="#34D399"></u-icon>
        </view>
        <view class="function-info">
          <text class="function-text">周期结算</text>
          <text class="function-desc">生成结算卡</text>
        </view>
        <u-icon name="arrow-right" size="14" color="#8AA79B"></u-icon>
      </view>
      <view class="function-card qs-glass" @click="goToNotifications">
        <view class="function-icon gold">
          <u-icon name="bell-fill" size="26" color="#E9C46A"></u-icon>
        </view>
        <view class="function-info">
          <text class="function-text">消息通知</text>
          <text class="function-desc">积分变动提醒</text>
        </view>
        <u-icon name="arrow-right" size="14" color="#8AA79B"></u-icon>
      </view>
      <view class="function-card qs-glass" @click="goToChangePassword">
        <view class="function-icon jade">
          <u-icon name="lock-fill" size="26" color="#34D399"></u-icon>
        </view>
        <view class="function-info">
          <text class="function-text">修改密码</text>
          <text class="function-desc">账户安全 · 定期更换更稳妥</text>
        </view>
        <u-icon name="arrow-right" size="14" color="#8AA79B"></u-icon>
      </view>
    </view>

    <view class="logout-wrap">
      <u-button
        v-if="isLoggedIn"
        text="退出登录"
        @click="logout"
        customStyle="height:88rpx;border-radius:999rpx;background:rgba(248,113,113,0.12);color:#F87171;border:1rpx solid rgba(248,113,113,0.3);font-weight:600;"
      ></u-button>
      <u-button
        v-else
        text="去登录"
        @click="goToLogin"
        customStyle="height:88rpx;border-radius:999rpx;background:linear-gradient(135deg,#E9C46A,#F2D98F);color:#05130D;font-weight:700;border:none;"
      ></u-button>
    </view>
  </view>
</template>

<script>
import { ensureLogin, queryDocs, auth } from '../../utils/cloudbase'

const DEFAULT_AVATAR = 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'

export default {
  data() {
    return {
      defaultAvatar: DEFAULT_AVATAR,
      userInfo: {},
      isLoggedIn: false
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
      const token = uni.getStorageSync('token')
      const localUserInfo = uni.getStorageSync('userInfo')
      if (!token || !localUserInfo || !localUserInfo.phone) {
        this.isLoggedIn = false
        this.userInfo = {
          nickName: '暂未登录',
          phone: '',
          avatarUrl: DEFAULT_AVATAR
        }
        return
      }
      this.isLoggedIn = true
      this.userInfo = localUserInfo

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
      uni.navigateTo({ url: '/pkg-statistics/statistics/pages/index' })
    },
    goToLeaderboard(tab) {
      const url = tab
        ? '/pkg-statistics/statistics/pages/leaderboard?tab=' + tab
        : '/pkg-statistics/statistics/pages/leaderboard'
      uni.navigateTo({ url })
    },
    goToNotifications() {
      uni.navigateTo({ url: '/pkg-statistics/statistics/pages/notifications' })
    },
    goToProfile() {
      uni.navigateTo({ url: '/pkg-profile/index' })
    },
    goToChangePassword() {
      uni.navigateTo({ url: '/pkg-password/index' })
    },
    goToLogin() {
      uni.redirectTo({ url: '/pkg-login/login' })
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
            uni.redirectTo({ url: '/pkg-login/login' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.my-page {
  padding-top: 32rpx;
}

.profile-card {
  padding: 36rpx 32rpx;
  margin-bottom: 36rpx;
  position: relative;
}

.profile-inner {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.avatar-ring {
  width: 116rpx;
  height: 116rpx;
  border-radius: 50%;
  padding: 5rpx;
  background: linear-gradient(135deg, rgba(233, 196, 106, 0.9), rgba(52, 211, 153, 0.9));
  box-sizing: border-box;
  margin-right: 24rpx;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #0c241b;
}

.profile-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-name {
  font-size: 34rpx;
  font-weight: 800;
  color: #fff9e8;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-phone {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.72);
}

.profile-arrow {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.18);
  border: 1rpx solid rgba(233, 196, 106, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-glow {
  position: absolute;
  left: -40rpx;
  bottom: -80rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(233, 196, 106, 0.35) 0%, rgba(233, 196, 106, 0) 70%);
  pointer-events: none;
}

.section-head {
  padding: 0 6rpx 18rpx;
}

.function-grid {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.function-card {
  width: 100%;
  padding: 24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
}

.function-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.function-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 22rpx;
  flex-shrink: 0;
}

.function-icon.jade {
  background: rgba(52, 211, 153, 0.13);
  border: 1rpx solid rgba(52, 211, 153, 0.28);
}

.function-icon.gold {
  background: rgba(233, 196, 106, 0.13);
  border: 1rpx solid rgba(233, 196, 106, 0.28);
}

.function-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #f4fbf7;
  margin-bottom: 6rpx;
}

.function-desc {
  font-size: 21rpx;
  color: #8aa79b;
}

.logout-wrap {
  margin-top: 40rpx;
}
</style>
