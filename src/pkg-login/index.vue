<template>
  <view class="login-container">
    <view class="login-card">
      <view class="logo-box">
        <u-icon name="account-fill" color="#ffffff" size="60"></u-icon>
      </view>
      <view class="title">积分助手</view>
      <view class="subtitle">
        请输入账号密码登录
      </view>
      
      <view class="form-container">
        <view class="input-item">
          <u-icon name="account-fill" color="#9ca3af" size="20"></u-icon>
          <u-input 
            v-model="username" 
            placeholder="请输入账号" 
            :border="false"
            clearable
            style="flex: 1; margin-left: 12px;"
          ></u-input>
        </view>
        
        <view class="input-item">
          <u-icon name="lock-fill" color="#9ca3af" size="20"></u-icon>
          <u-input 
            v-model="password" 
            placeholder="请输入密码" 
            :border="false"
            :password="true"
            clearable
            style="flex: 1; margin-left: 12px;"
          ></u-input>
        </view>
      </view>
      
      <button class="auth-btn" @click="handleLogin" :loading="loading">
        登录
      </button>
      
      <view class="footer-text">
        登录即表示同意服务协议和隐私政策
      </view>
    </view>
  </view>
</template>

<script>
import { ensureLogin, addDoc, queryDocs, updateDoc } from '@/utils/cloudbase'
import md5 from '@/utils/md5'

export default {
  data() {
    return {
      username: '',
      password: '',
      loading: false
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo')
    if (userInfo && userInfo.username) {
      this.username = userInfo.username
    }
  },
  methods: {
    async handleLogin() {
      if (!this.username.trim()) {
        uni.showToast({
          title: '请输入账号',
          icon: 'none'
        })
        return
      }
      
      if (!this.password.trim()) {
        uni.showToast({
          title: '请输入密码',
          icon: 'none'
        })
        return
      }

      this.loading = true

      try {
        await ensureLogin()

        const existingUsers = await queryDocs('users', { username: this.username.trim() })
        const passwordMd5 = md5(this.password.trim())

        if (existingUsers.length > 0) {
          const cloudUser = existingUsers[0]
          if (cloudUser.password !== passwordMd5) {
            uni.showToast({
              title: '账号或密码错误',
              icon: 'none'
            })
            return
          }
          const userInfo = {
            username: this.username.trim(),
            nickName: cloudUser.nickName || cloudUser.username,
            avatarUrl: cloudUser.avatarUrl || 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'
          }
          await updateDoc('users', cloudUser._id, {
            lastLoginTime: new Date()
          })
          uni.setStorageSync('userInfo', userInfo)
        } else {
          const userInfo = {
            username: this.username.trim(),
            nickName: this.username.trim(),
            avatarUrl: 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg',
            password: passwordMd5
          }
          await addDoc('users', userInfo)
          delete userInfo.password
          uni.setStorageSync('userInfo', userInfo)
        }

        uni.setStorageSync('token', 'cloudbase-token-' + Date.now())

        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })

        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index'
          })
        }, 1000)
      } catch (err) {
        console.error('登录失败:', err)
        uni.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  height: 100vh;
  background-color: #ffffff;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.logo-box {
  width: 96px;
  height: 96px;
  background-color: #22C55E;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 16px;
}

.subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.625;
  margin-bottom: 40px;
  padding-left: 16px;
  padding-right: 16px;
}

.form-container {
  width: 686rpx;
  margin-bottom: 32px;
}

.input-item {
  display: flex;
  align-items: center;
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.auth-btn {
  width: 686rpx;
  background-color: #22C55E;
  color: white;
  padding-top: 16px;
  padding-bottom: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.5;
}
.auth-btn:active {
  opacity: 0.9;
}

.footer-text {
  position: absolute;
  bottom: 40px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
