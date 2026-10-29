<template>
  <view class="login-page">
    <view class="login-bg-glow"></view>
    <view class="login-card">
      <view class="logo-tile">
        <text class="logo-text">雀</text>
      </view>
      <text class="title">雀圣积分</text>
      <text class="subtitle">轻松记录每一场，积分一目了然</text>

      <view class="form-container">
        <view class="input-item">
          <u-icon name="phone-fill" color="#34D399" size="20"></u-icon>
          <u-input
            v-model="phone"
            placeholder="请输入手机号"
            type="number"
            maxlength="11"
            :border="false"
            clearable
            color="#F4FBF7"
            placeholderStyle="color:#5E7A6C"
            style="flex: 1; margin-left: 16rpx;"
          ></u-input>
        </view>

        <view class="input-item">
          <u-icon name="lock-fill" color="#E9C46A" size="20"></u-icon>
          <u-input
            v-model="password"
            placeholder="请输入密码"
            :border="false"
            :password="true"
            clearable
            color="#F4FBF7"
            placeholderStyle="color:#5E7A6C"
            style="flex: 1; margin-left: 16rpx;"
          ></u-input>
        </view>
      </view>

      <button class="auth-btn" @click="handleLogin" :loading="loading">登 录</button>
      <text class="tip">新手机号登录将自动注册账号</text>
    </view>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, addDoc, queryDocs, updateDoc } from '@/utils/cloudbase'
import { isValidPhone } from '@/utils'
import md5 from '@/utils/md5'

async function cloudQuery(collection, query) {
  try {
    const { result } = await wx.cloud.callFunction({
      name: 'queryUser',
      data: { collection, query }
    })
    return result.data || []
  } catch (err) {
    console.error('云函数查询失败，降级使用客户端查询:', err)
    return await queryDocs(collection, query)
  }
}

const DEFAULT_AVATAR = 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'

export default {
  data() {
    return {
      phone: '',
      password: '',
      loading: false
    }
  },
  onLoad() {
    const token = uni.getStorageSync('token')
    const userInfo = uni.getStorageSync('userInfo')
    if (token && userInfo && userInfo.phone) {
      this.phone = userInfo.phone
    } else if (token && userInfo && userInfo.username) {
      this.phone = userInfo.username
    }
  },
  methods: {
    async handleLogin() {
      if (!this.phone.trim()) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return
      }

      if (!isValidPhone(this.phone.trim())) {
        uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
        return
      }

      if (!this.password.trim()) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }

      this.loading = true

      try {
        await ensureLogin()

        const inputPhone = this.phone.trim()
        const passwordMd5 = md5(this.password.trim())

        let existingUsers = await cloudQuery('users', { phone: inputPhone })

        if (existingUsers.length === 0) {
          const legacyUsers = await cloudQuery('users', { username: inputPhone })
          if (legacyUsers.length > 0) {
            await updateDoc('users', legacyUsers[0]._id, { phone: inputPhone })
            existingUsers = legacyUsers
          }
        }

        if (existingUsers.length > 0) {
          const cloudUser = existingUsers[0]
          if (cloudUser.password !== passwordMd5) {
            uni.showToast({ title: '手机号或密码错误', icon: 'none' })
            return
          }
          const userInfo = {
            phone: inputPhone,
            nickName: cloudUser.nickName || cloudUser.nickname || '',
            avatarUrl: cloudUser.avatarUrl || DEFAULT_AVATAR
          }
          await updateDoc('users', cloudUser._id, { lastLoginTime: dayjs().toDate() })
          uni.setStorageSync('userInfo', userInfo)
        } else {
          const confirmResult = await new Promise((resolve) => {
            uni.showModal({
              title: '账号不存在',
              content: '该手机号未注册，是否自动注册并登录？',
              confirmText: '注册',
              cancelText: '取消',
              success: (res) => resolve(res.confirm)
            })
          })
          if (!confirmResult) return

          const userInfo = {
            phone: inputPhone,
            nickName: '',
            avatarUrl: DEFAULT_AVATAR,
            password: passwordMd5
          }
          await addDoc('users', userInfo)
          delete userInfo.password
          uni.setStorageSync('userInfo', userInfo)
        }

        uni.setStorageSync('token', 'cloudbase-token-' + dayjs().valueOf())

        uni.showToast({ title: '登录成功', icon: 'success' })

        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 1000)
      } catch (err) {
        console.error('登录失败:', err)
        uni.showToast({ title: '登录失败，请重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
  box-sizing: border-box;
  background:
    radial-gradient(120% 60% at 20% 0%, rgba(52, 211, 153, 0.2) 0%, rgba(6, 18, 14, 0) 55%),
    radial-gradient(90% 45% at 100% 10%, rgba(233, 196, 106, 0.14) 0%, rgba(6, 18, 14, 0) 60%),
    linear-gradient(180deg, #0a2018 0%, #06120e 60%, #040c09 100%);
  position: relative;
  overflow: hidden;
}

.login-bg-glow {
  position: absolute;
  bottom: -160rpx;
  left: -120rpx;
  width: 520rpx;
  height: 520rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(52, 211, 153, 0.18) 0%, rgba(52, 211, 153, 0) 70%);
  pointer-events: none;
}

.login-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.logo-tile {
  width: 132rpx;
  height: 168rpx;
  border-radius: 24rpx;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.06));
  border: 2rpx solid rgba(233, 196, 106, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 24rpx 60rpx -24rpx rgba(233, 196, 106, 0.65), inset 0 0 30rpx rgba(255, 255, 255, 0.16);
  margin-bottom: 30rpx;
}

.logo-text {
  font-size: 68rpx;
  font-weight: 800;
  color: #fff5d6;
  text-shadow: 0 6rpx 18rpx rgba(0, 0, 0, 0.3);
}

.title {
  font-size: 46rpx;
  font-weight: 800;
  color: #fff9e8;
  letter-spacing: 4rpx;
}

.subtitle {
  font-size: 24rpx;
  color: #8aa79b;
  margin: 14rpx 0 56rpx;
}

.form-container {
  width: 100%;
  margin-bottom: 34rpx;
}

.input-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.055);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 22rpx;
  padding: 26rpx 26rpx;
  margin-bottom: 20rpx;
  box-sizing: border-box;
}

.auth-btn {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #e9c46a 0%, #f2d98f 100%);
  color: #05130d;
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: 6rpx;
  border: none;
  box-shadow: 0 18rpx 40rpx -18rpx rgba(233, 196, 106, 0.7);
}

.auth-btn::after {
  border: none;
}

.auth-btn:active {
  opacity: 0.9;
}

.tip {
  font-size: 22rpx;
  color: #5e7a6c;
  margin-top: 26rpx;
}
</style>
