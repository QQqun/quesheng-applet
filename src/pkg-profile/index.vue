<template>
  <view class="qs-page profile-page">
    <view class="section-head">
      <text class="qs-section-title">头像</text>
    </view>
    <view class="qs-glass section">
      <view class="avatar-row" @click="chooseAvatar">
        <view class="avatar-ring">
          <image :src="avatarUrl" class="avatar-preview" mode="aspectFill"></image>
        </view>
        <view class="avatar-hint">
          <text class="hint-title">更换头像</text>
          <text class="hint-sub">点击选择图片</text>
        </view>
        <u-icon name="arrow-right" color="#8AA79B" size="16"></u-icon>
      </view>
    </view>

    <view class="section-head">
      <text class="qs-section-title">基本信息</text>
    </view>
    <view class="qs-glass section">
      <text class="label">昵称</text>
      <view class="input-item">
        <u-input v-model="nickname" placeholder="请输入昵称" border="none" clearable color="#F4FBF7" placeholderStyle="color:#5E7A6C"></u-input>
      </view>
      <text class="label">手机号</text>
      <view class="input-item readonly-field">
        <u-input v-model="phone" placeholder="手机号" type="number" border="none" :disabled="true" color="#8AA79B"></u-input>
      </view>
      <u-button
        text="保存信息"
        @click="saveProfile"
        :loading="savingProfile"
        customStyle="margin-top:12rpx;height:88rpx;border-radius:999rpx;background:linear-gradient(135deg,#E9C46A,#F2D98F);color:#05130D;font-weight:700;border:none;"
      ></u-button>
    </view>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, queryDocs, queryAllDocs, updateDoc } from '@/utils/cloudbase'

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
        let users = await this.cloudQuery('users', { phone: userInfo.phone })
        if (users.length === 0 && userInfo.username) {
          users = await this.cloudQuery('users', { username: userInfo.username })
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

    async cloudQuery(collection, query) {
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
    },

    async saveProfile() {
      if (!this.docId) {
        uni.showToast({ title: '用户信息异常', icon: 'none' })
        return
      }

      this.savingProfile = true
      try {
        const newNickName = this.nickname.trim()
        const updateData = { nickName: newNickName }

        await this.cloudUpdateDoc('users', this.docId, updateData)

        const userInfo = uni.getStorageSync('userInfo') || {}
        const oldNickName = userInfo.nickName || ''
        userInfo.nickName = newNickName
        if (this.phone) userInfo.phone = this.phone
        uni.setStorageSync('userInfo', userInfo)

        if (oldNickName !== newNickName && this.phone) {
          await this.syncNickNameToScores(this.phone, newNickName)
        }

        uni.showToast({ title: '保存成功', icon: 'success' })
      } catch (err) {
        console.error('保存用户信息失败:', err)
        uni.showToast({ title: '保存失败，请重试', icon: 'none' })
      } finally {
        this.savingProfile = false
      }
    },

    async cloudUpdateDoc(collection, docId, data) {
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'updateUser',
          data: { collection, docId, data }
        })
        if (result && result.success) return
      } catch (err) {
        console.error('云函数更新失败，降级使用客户端更新:', err)
      }
      await updateDoc(collection, docId, data)
    },

    async syncNickNameToScores(phone, newName) {
      try {
        const allScores = await this.cloudQueryAll('scores', { 'users.phone': phone })
        for (const scoreRecord of allScores) {
          let needUpdate = false
          const updatedUsers = (scoreRecord.users || []).map((user) => {
            if (user.phone === phone && user.name !== newName) {
              needUpdate = true
              return { ...user, name: newName }
            }
            return user
          })
          if (needUpdate) {
            await this.cloudUpdateDoc('scores', scoreRecord._id, { users: updatedUsers })
          }
        }
      } catch (err) {
        console.error('同步积分表昵称失败:', err)
      }
    },

    async cloudQueryAll(collection, query) {
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'queryUser',
          data: { collection, query, all: true }
        })
        if (result && result.data && result.data.length > 0) return result.data
      } catch (err) {
        console.error('云函数查询失败，降级使用客户端查询:', err)
      }
      return await queryAllDocs(collection, query)
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
              await this.cloudUpdateDoc('users', this.docId, { avatarUrl: this.avatarUrl })
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
.profile-page {
  padding-top: 28rpx;
}

.section-head {
  padding: 0 6rpx 16rpx;
}

.section {
  padding: 26rpx 24rpx;
  margin-bottom: 28rpx;
}

.avatar-row {
  display: flex;
  align-items: center;
}

.avatar-ring {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  padding: 5rpx;
  background: linear-gradient(135deg, rgba(233, 196, 106, 0.85), rgba(52, 211, 153, 0.85));
  box-sizing: border-box;
  margin-right: 22rpx;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #0c241b;
}

.avatar-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.hint-title {
  font-size: 27rpx;
  font-weight: 600;
  color: #f4fbf7;
  margin-bottom: 6rpx;
}

.hint-sub {
  font-size: 21rpx;
  color: #8aa79b;
}

.label {
  display: block;
  font-size: 22rpx;
  color: #8aa79b;
  margin-bottom: 10rpx;
  padding-left: 4rpx;
}

.input-item {
  padding: 20rpx 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.055);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  margin-bottom: 22rpx;
}

.readonly-field :deep(.u-input__input) {
  color: #8aa79b !important;
}
</style>
