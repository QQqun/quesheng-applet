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
      
      <button class="auth-btn" @click="handleLogin">
        登录
      </button>
      
      <view class="footer-text">
        登录即表示同意服务协议和隐私政策
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo')
    if (userInfo && userInfo.username) {
      this.username = userInfo.username
    }
  },
  methods: {
    handleLogin() {
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
      
      const userInfo = {
        username: this.username,
        nickName: this.username,
        avatarUrl: 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'
      }
      
      uni.setStorageSync('userInfo', userInfo)
      uni.setStorageSync('token', 'mock-token-' + Date.now())
      
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 1000)
    }
  }
}
</script>

<style scoped>
/* 对应 zz.html 中的 .bg-slate-50 flex flex-wrap justify-center gap-[35px] p-[35px] */
.login-container {
  min-height: 100vh;
  background-color: #f8fafc; /* bg-slate-50 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* 对应 zz.html 中的 .w-[375px] h-[812px] bg-white border border-gray-200 rounded-[40px] shadow-2xl ... */
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

/* 对应 .w-24 h-24 bg-[#22C55E] rounded-2xl ... */
.logo-box {
  width: 96px; /* 24 * 4 */
  height: 96px;
  background-color: #22C55E;
  border-radius: 16px; /* rounded-2xl */
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px; /* mb-6 */
}

/* 对应 .text-2xl font-bold text-gray-800 mb-4 */
.title {
  font-size: 24px; /* text-2xl */
  font-weight: bold;
  color: #1f2937; /* gray-800 */
  margin-bottom: 16px; /* mb-4 */
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

/* 对应 .w-full bg-[#22C55E] text-white py-4 rounded-xl ... */
.auth-btn {
  width: 686rpx;
  background-color: #22C55E;
  color: white;
  padding-top: 16px;
  padding-bottom: 16px;
  border-radius: 12px; /* rounded-xl */
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

/* 对应 .absolute bottom-10 text-xs text-gray-400 */
.footer-text {
  position: absolute;
  bottom: 40px; /* bottom-10 */
  font-size: 12px; /* text-xs */
  color: #9ca3af; /* gray-400 */
}
</style>