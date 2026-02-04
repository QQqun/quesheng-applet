<template>
  <view class="login-container">
    <view class="login-card">
      <view class="logo-box">
        <!-- 替换为微信图标，这里使用简单的 View 模拟或 u-icon -->
        <u-icon name="weixin-fill" color="#ffffff" size="60"></u-icon>
      </view>
      <view class="title">微信积分助手</view>
      <view class="subtitle">
        申请获取你的公开信息（昵称、头像等）以便于管理群组积分
      </view>
      
      <!-- 微信一键授权按钮 -->
      <button class="auth-btn" open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">
        <u-icon name="weixin-fill" color="#ffffff" size="24" style="margin-right: 8px;"></u-icon>
        微信一键授权
      </button>
      
      <view class="footer-text">
        授权即表示同意服务协议和隐私政策
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      code: ''
    }
  },
  onLoad() {
    // 获取微信登录code
    this.getCode()
  },
  methods: {
    // 获取微信登录code
    getCode() {
      uni.login({
        provider: 'weixin',
        success: (res) => {
          if (res.code) {
            this.code = res.code
          } else {
            uni.showToast({
              title: '获取code失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '登录失败',
            icon: 'none'
          })
        }
      })
    },
    // 微信授权手机号登录
    getPhoneNumber(e) {
      if (e.detail.errMsg === 'getPhoneNumber:ok' || e.detail.errMsg.includes('ok')) {
        // 调用后端登录接口
        this.login(e.detail.code)
      } else {
        uni.showToast({
          title: '授权失败，请重新点击',
          icon: 'none'
        })
      }
    },
    // 登录请求
    login(phoneCode) {
      uni.request({
        url: 'http://localhost:3000/api/auth/login',
        method: 'POST',
        data: {
          openid: 'test-openid', // 实际项目中需要通过code获取openid
          phone: '13800138000', // 实际项目中需要通过phoneCode解密获取
          nickName: '测试用户',
          avatarUrl: '/static/user.png'
        },
        success: (res) => {
          if (res.data.code === 200) {
            // 存储token和用户信息
            uni.setStorageSync('token', res.data.data.token)
            uni.setStorageSync('userInfo', res.data.data.user)
            
            // 跳转到首页
            uni.switchTab({
              url: '/pages/index/index'
            })
          } else {
            uni.showToast({
              title: res.data.message || '登录失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          uni.showToast({
            title: '网络错误，请稍后重试',
            icon: 'none'
          })
        }
      })
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
  padding: 35px;
  box-sizing: border-box;
}

/* 对应 zz.html 中的 .w-[375px] h-[812px] bg-white border border-gray-200 rounded-[40px] shadow-2xl ... */
.login-card {
  width: 100%;
  max-width: 375px;
  height: 812px; /* 固定高度，或者 min-height */
  max-height: 90vh;
  background-color: #ffffff;
  border: 1px solid #e5e7eb; /* gray-200 */
  border-radius: 40px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); /* shadow-2xl */
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px; /* p-8 */
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

/* 对应 .text-center text-gray-500 text-sm leading-relaxed mb-40 px-4 */
.subtitle {
  text-align: center;
  color: #6b7280; /* gray-500 */
  font-size: 14px; /* text-sm */
  line-height: 1.625; /* leading-relaxed */
  margin-bottom: 160px; /* mb-40 */
  padding-left: 16px;
  padding-right: 16px;
}

/* 对应 .w-full bg-[#22C55E] text-white py-4 rounded-xl ... */
.auth-btn {
  width: 100%;
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