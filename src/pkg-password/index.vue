<template>
  <view class="page-container">
    <view class="section">
      <view class="section-title">修改密码</view>
      <view class="input-item">
        <u-input v-model="oldPassword" placeholder="请输入旧密码" type="password" border="surround" clearable></u-input>
      </view>
      <view class="input-item">
        <u-input v-model="newPassword" placeholder="请输入新密码" type="password" border="surround" clearable></u-input>
      </view>
      <view class="input-item">
        <u-input v-model="confirmPassword" placeholder="请确认新密码" type="password" border="surround" clearable></u-input>
      </view>
      <u-button text="修改密码" type="primary" color="#22C55E" @click="changePassword" :loading="changingPwd"></u-button>
    </view>
  </view>
</template>

<script>
import { ensureLogin, queryDocs, updateDoc } from '@/utils/cloudbase'
import md5 from '@/utils/md5'

export default {
  data() {
    return {
      docId: '',
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      changingPwd: false
    }
  },
  onLoad() {
    this.loadUserInfo()
  },
  methods: {
    async loadUserInfo() {
      const userInfo = uni.getStorageSync('userInfo') || {}
      try {
        await ensureLogin()
        let users = await queryDocs('users', { phone: userInfo.phone })
        if (users.length === 0 && userInfo.username) {
          users = await queryDocs('users', { username: userInfo.username })
        }
        if (users.length > 0) {
          this.docId = users[0]._id
        }
      } catch (err) {
        console.error('加载用户信息失败:', err)
      }
    },

    async changePassword() {
      if (!this.oldPassword.trim()) {
        uni.showToast({ title: '请输入旧密码', icon: 'none' })
        return
      }
      if (!this.newPassword.trim()) {
        uni.showToast({ title: '请输入新密码', icon: 'none' })
        return
      }
      if (this.newPassword !== this.confirmPassword) {
        uni.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }
      if (this.newPassword.trim().length < 6) {
        uni.showToast({ title: '密码至少6位', icon: 'none' })
        return
      }
      if (!this.docId) {
        uni.showToast({ title: '用户信息异常', icon: 'none' })
        return
      }

      this.changingPwd = true

      try {
        await ensureLogin()
        const users = await queryDocs('users', { _id: this.docId })
        if (users.length === 0) {
          uni.showToast({ title: '用户不存在', icon: 'none' })
          return
        }

        const oldMd5 = md5(this.oldPassword.trim())
        if (oldMd5 !== users[0].password) {
          uni.showToast({ title: '旧密码错误', icon: 'none' })
          return
        }

        const newMd5 = md5(this.newPassword.trim())
        await updateDoc('users', this.docId, { password: newMd5 })

        uni.showToast({ title: '密码修改成功', icon: 'success' })
        this.oldPassword = ''
        this.newPassword = ''
        this.confirmPassword = ''
      } catch (err) {
        console.error('修改密码失败:', err)
        uni.showToast({ title: '修改失败，请重试', icon: 'none' })
      } finally {
        this.changingPwd = false
      }
    }
  }
}
</script>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 20px 16px;
  box-sizing: border-box;
}

.section {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 16px;
}

.input-item {
  margin-bottom: 16px;
}
</style>
