<template>
  <view class="page-container">
    <view class="section">
      <view class="section-title">头像</view>
      <view class="avatar-row" @click="chooseAvatar">
        <image :src="avatarUrl" class="avatar-preview" mode="aspectFill"></image>
        <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
      </view>
    </view>

    <view class="section">
      <view class="section-title">基本信息</view>
      <view class="input-item">
        <u-input v-model="nickname" placeholder="请输入昵称" border="surround" clearable></u-input>
      </view>
      <view class="input-item readonly-field">
        <u-input v-model="phone" placeholder="手机号" type="number" border="surround" :disabled="true"></u-input>
      </view>
      <u-button text="保存信息" type="primary" color="#22C55E" @click="saveProfile" :loading="savingProfile"></u-button>
    </view>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, queryDocs, updateDoc } from '@/utils/cloudbase'

const DEFAULT_AVATAR = 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg'

export default {
  data() {
    return {
      avatarUrl: '',
      nickname: '',
      phone: '',
      docId: '',
      savingProfile: false
    }
  },
  onLoad() {
    this.loadUserInfo()
  },
  methods: {
    async loadUserInfo() {
      const userInfo = uni.getStorageSync('userInfo') || {}
      this.avatarUrl = userInfo.avatarUrl || DEFAULT_AVATAR
      this.nickname = userInfo.nickName || ''
      this.phone = userInfo.phone || ''

      try {
        await ensureLogin()
        let users = await queryDocs('users', { phone: userInfo.phone })
        if (users.length === 0 && userInfo.username) {
          users = await queryDocs('users', { username: userInfo.username })
        }
        if (users.length > 0) {
          this.docId = users[0]._id
          this.avatarUrl = users[0].avatarUrl || this.avatarUrl
          this.nickname = users[0].nickName || users[0].nickname || this.nickname
          this.phone = users[0].phone || this.phone
        }
      } catch (err) {
        console.error('加载用户信息失败:', err)
      }
    },

    async saveProfile() {
      if (!this.docId) {
        uni.showToast({ title: '用户信息异常', icon: 'none' })
        return
      }

      this.savingProfile = true
      try {
        const updateData = { nickName: this.nickname.trim() }

        await updateDoc('users', this.docId, updateData)

        const userInfo = uni.getStorageSync('userInfo') || {}
        userInfo.nickName = this.nickname.trim()
        if (this.phone) {
          userInfo.phone = this.phone
        }
        uni.setStorageSync('userInfo', userInfo)

        uni.showToast({ title: '保存成功', icon: 'success' })
      } catch (err) {
        console.error('保存用户信息失败:', err)
        uni.showToast({ title: '保存失败，请重试', icon: 'none' })
      } finally {
        this.savingProfile = false
      }
    },

    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          try {
            uni.showLoading({ title: '上传中...' })
            const uploadRes = await new Promise((resolve, reject) => {
              wx.cloud.uploadFile({
                cloudPath: `avatars/${dayjs().valueOf()}-${Math.random().toString(36).substr(2, 8)}.jpg`,
                filePath: tempFilePath,
                success: resolve,
                fail: reject
              })
            })

            this.avatarUrl = uploadRes.fileID

            if (this.docId) {
              await updateDoc('users', this.docId, { avatarUrl: this.avatarUrl })
            }

            const userInfo = uni.getStorageSync('userInfo') || {}
            userInfo.avatarUrl = this.avatarUrl
            uni.setStorageSync('userInfo', userInfo)

            uni.hideLoading()
            uni.showToast({ title: '头像已更新', icon: 'success' })
          } catch (err) {
            uni.hideLoading()
            console.error('上传头像失败:', err)
            uni.showToast({ title: '上传失败', icon: 'none' })
          }
        }
      })
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

.avatar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #e5e7eb;
  border: 1px solid #f3f4f6;
}

.input-item {
  margin-bottom: 16px;
}

.readonly-field :deep(.u-input__input) {
  color: #9ca3af !important;
}
</style>
