<template>
  <view class="page-container">
    <view class="section">
      <view class="section-header">
        <text class="section-title">选择日期</text>
      </view>
      <view class="date-picker" @click="showCalendar = true">
        <view class="date-display">
          <text>{{ date }}</text>
          <u-icon name="calendar" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>
      <u-calendar :show="showCalendar" color="#22C55E" @close="showCalendar = false" @confirm="handleCalendarConfirm"></u-calendar>
    </view>
    
    <view class="section">
      <view class="section-header">
        <text class="section-title">成员列表</text>
        <view class="add-member-btn" @click="openAddMemberDialog">
          <u-icon name="plus-circle" color="#22C55E" size="16" style="margin-right: 4px;"></u-icon>
          <text>添加成员</text>
        </view>
      </view>
      
      <view class="member-list">
        <view v-if="users.length === 0" class="empty-state">
          <u-icon name="account" color="#9ca3af" size="48"></u-icon>
          <text class="empty-text">暂无成员，请添加</text>
        </view>
        <view v-else class="member-item" v-for="(user, index) in users" :key="index">
          <view class="member-name-wrapper" @tap="handleNameTap(index)">
            <u-input 
              v-if="editingNameIndex === index" 
              v-model="user.name" 
              type="text" 
              :border="false"
              :focus="true"
              @blur="finishEditName(index)"
              @confirm="finishEditName(index)"
              style="font-size: 16px; color: #1f2937;"
            ></u-input>
            <text v-else class="member-name">{{ user.name }}</text>
          </view>
          <view class="member-actions">
              <view class="score-input">
                <u-input v-model="user.score" type="text" :showWordLimit="true" placeholder="0" border="surround" style="width: 100px;"></u-input>
              </view>
              <u-icon name="close-circle" color="#ef4444" size="20" @click="removeMember(index)"></u-icon>
            </view>
        </view>
      </view>
    </view>
    
    <view class="save-btn-container">
      <u-button text="保存" type="primary" color="#22C55E" @click="saveData" :loading="saving"></u-button>
    </view>
    
    <u-popup :show="showAddMemberDialog" mode="center" :round="16" @close="showAddMemberDialog = false" :safeAreaInsetBottom="false">
      <view class="dialog">
        <view class="dialog-title">添加成员</view>
        <view class="input">
          <u-input v-model="newMemberPhone" placeholder="请输入手机号(必填)" type="number" maxlength="11" border="surround" @blur="onPhoneBlur"></u-input>
        </view>
        <view class="input">
          <u-input v-model="newMemberNickName" placeholder="请输入昵称(选填)" border="surround" :disabled="nicknameReadonly"></u-input>
        </view>
        <view class="dialog-buttons">
          <u-button text="取消" @click="showAddMemberDialog = false"></u-button>
          <u-button text="确认" type="primary" color="#22C55E" @click="addMember"></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, ensureCollections, addDoc, queryDocs, updateDoc } from '@/utils/cloudbase'
import { getUuid, isValidPhone } from '@/utils'
import md5 from '@/utils/md5'
import { createNotification } from '@/utils/notification'

export default {
  data() {
    return {
      groupId: '',
      users: [],
      members: [],
      date: '',
      showAddMemberDialog: false,
      newMemberPhone: '',
      newMemberNickName: '',
      nicknameReadonly: false,
      showCalendar: false,
      editingNameIndex: -1,
      saving: false,
      groupDocId: ''
    }
  },
  onLoad(options) {
    if (options.id) {
      this.groupId = options.id;
    }
    
    this.date = dayjs().format('YYYY-MM-DD');
    
    this.initData();
  },
  methods: {
    async initData() {
      await ensureLogin()
      await ensureCollections()
      await this.loadMembers()
      await this.loadDataByDate()
    },
    
    async loadMembers() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {}
        const currentPhone = userInfo.phone || ''
        
        const groups = await queryDocs('groups', { _id: this.groupId })
        
        const memberPhones = new Set();
        if (currentPhone) {
          memberPhones.add(currentPhone);
        }
        
        if (groups.length > 0) {
          this.groupDocId = groups[0]._id
          if (groups[0].members && groups[0].members.length > 0) {
            groups[0].members.forEach(m => {
              memberPhones.add(m);
            });
          }
        }
        
        const phoneList = Array.from(memberPhones)
        const memberDetails = []
        for (const p of phoneList) {
          if (isValidPhone(p)) {
            const users = await queryDocs('users', { phone: p })
            if (users.length > 0) {
              memberDetails.push({ phone: p, nickName: users[0].nickName || users[0].nickname || '', name: users[0].nickName || users[0].nickname || p })
            } else {
              memberDetails.push({ phone: p, nickName: '', name: p })
            }
          } else {
            memberDetails.push({ phone: '', nickName: '', name: p })
          }
        }
        
        this.members = memberDetails
      } catch (err) {
        console.error('加载成员失败:', err)
        const userInfo = uni.getStorageSync('userInfo') || {}
        const currentPhone = userInfo.phone || ''
        this.members = currentPhone ? [{ phone: currentPhone, nickName: userInfo.nickName || '', name: userInfo.nickName || currentPhone }] : []
      }
    },
    
    async loadDataByDate() {
      try {
        await ensureLogin()
        
        const scores = await queryDocs('scores', {
          groupId: this.groupId,
          date: this.date
        })
        
        if (scores.length > 0) {
          this.users = scores[0].users || [];
        } else {
          this.users = this.members.map(member => ({
            name: member.name,
            phone: member.phone || '',
            score: 0
          }));
        }
      } catch (err) {
        console.error('加载数据失败:', err)
        this.users = this.members.map(member => ({
          name: member.name,
          phone: member.phone || '',
          score: 0
        }));
      }
    },
    
    async removeMember(index) {
      const memberName = this.users[index]?.name;
      const memberPhone = this.users[index]?.phone;
      if (!memberName && !memberPhone) return;

      const userInfo = uni.getStorageSync('userInfo') || {}
      const creatorPhone = userInfo.phone || ''

      const res = await new Promise(resolve => {
        uni.showModal({
          title: '确认删除',
          content: `确定要删除成员"${memberName}"并清除其在该分组的所有积分吗？`,
          confirmColor: '#ef4444',
          success: resolve
        });
      });

      if (!res.confirm) return;

      this.users.splice(index, 1);
      this.members = this.members.filter(m => {
        if (memberPhone && m.phone) return m.phone !== memberPhone
        return m.name !== memberName
      });

      try {
        await ensureLogin();

        if (!this.groupDocId) {
          const groups = await queryDocs('groups', { _id: this.groupId })
          if (groups.length > 0) {
            this.groupDocId = groups[0]._id
          }
        }

        const allScores = await queryDocs('scores', { groupId: this.groupId });

        for (const scoreRecord of allScores) {
          const originalUsers = scoreRecord.users || []
          const updatedUsers = originalUsers.filter(u => {
            if (memberPhone && u.phone) return u.phone !== memberPhone
            return u.name !== memberName
          })
          if (updatedUsers.length !== originalUsers.length) {
            await updateDoc('scores', scoreRecord._id, { users: updatedUsers });
          }
        }

        if (this.groupDocId) {
          await updateDoc('groups', this.groupDocId, {
            members: this.members.map(m => m.phone || m.name)
          });
        }

        try {
          const group = await queryDocs('groups', { _id: this.groupId })
          const groupName = group.length > 0 ? group[0].groupName : '群组'
          const displayName = memberName || memberPhone
          for (const m of this.members) {
            const mPhone = m.phone || ''
            if (mPhone && mPhone !== creatorPhone) {
              await createNotification({
                userId: mPhone,
                type: 'member_leave',
                title: '成员退出',
                content: `${displayName}退出了"${groupName}"`,
                groupId: this.groupId,
                groupName
              })
            }
          }
        } catch (notifyErr) {
          console.error('发送通知失败:', notifyErr)
        }
      } catch (err) {
        console.error('删除成员失败:', err);
        uni.showToast({ title: '删除失败，请重试', icon: 'none' });
      }
    },

    openAddMemberDialog() {
      this.newMemberPhone = ''
      this.newMemberNickName = ''
      this.nicknameReadonly = false
      this.showAddMemberDialog = true
    },

    async onPhoneBlur() {
      const phone = this.newMemberPhone.trim()
      if (!phone || !isValidPhone(phone)) return

      try {
        const existingUsers = await queryDocs('users', { phone })
        if (existingUsers.length > 0) {
          this.newMemberNickName = existingUsers[0].nickName || existingUsers[0].nickname || ''
          this.nicknameReadonly = true
        } else {
          this.nicknameReadonly = false
        }
      } catch (err) {
        console.error('查询用户失败:', err)
      }
    },

    async addMember() {
      if (!this.newMemberPhone.trim()) {
        uni.showToast({
          title: '请输入手机号',
          icon: 'none'
        });
        return;
      }
      
      if (!isValidPhone(this.newMemberPhone.trim())) {
        uni.showToast({
          title: '请输入正确的手机号',
          icon: 'none'
        });
        return;
      }
      
      const memberPhone = this.newMemberPhone.trim();
      
      const exists = this.members.some(m => m.phone === memberPhone);
      if (exists) {
        uni.showToast({
          title: '该成员已存在',
          icon: 'none'
        });
        return;
      }

      try {
        await ensureLogin();

        const existingUsers = await queryDocs('users', { phone: memberPhone });
        if (existingUsers.length === 0) {
          const nickName = this.newMemberNickName.trim() || ''
          const defaultPassword = md5('888888');
          await addDoc('users', {
            username: memberPhone,
            phone: memberPhone,
            nickName: nickName,
            avatarUrl: 'https://modao.cc/agent-py/media/generated_images/2026-01-24/816582f996494d8f888f059b36223bd4.jpg',
            password: defaultPassword
          });
        }
      } catch (err) {
        console.error('校验用户失败:', err);
      }
      
      const displayName = this.newMemberNickName.trim() || memberPhone
      
      this.members.push({
        name: displayName,
        phone: memberPhone,
        nickName: this.newMemberNickName.trim()
      });
      
      this.users.push({
        name: displayName,
        phone: memberPhone,
        score: 0
      });

      try {
        if (this.groupDocId) {
          await updateDoc('groups', this.groupDocId, {
            members: this.members.map(m => m.phone || m.name)
          })
        }
      } catch (err) {
        console.error('更新群组成员失败:', err)
      }
      
      this.showAddMemberDialog = false;
      this.newMemberPhone = '';
      this.newMemberNickName = '';

      try {
        const userInfo = uni.getStorageSync('userInfo') || {}
        const creatorPhone = userInfo.phone || ''
        const creatorName = userInfo.nickName || creatorPhone
        const group = await queryDocs('groups', { _id: this.groupId })
        const groupName = group.length > 0 ? group[0].groupName : '群组'
        for (const m of this.members) {
          const mPhone = m.phone || ''
          if (mPhone && mPhone !== creatorPhone && mPhone !== memberPhone) {
            await createNotification({
              userId: mPhone,
              type: 'new_member',
              title: '新成员加入',
              content: `${displayName}加入了"${groupName}"`,
              groupId: this.groupId,
              groupName
            })
          }
        }
        if (memberPhone && memberPhone !== creatorPhone) {
          await createNotification({
            userId: memberPhone,
            type: 'new_member',
            title: '加入群组',
            content: `${creatorName}将你加入了"${groupName}"`,
            groupId: this.groupId,
            groupName
          })
        }
      } catch (notifyErr) {
        console.error('发送通知失败:', notifyErr)
      }
    },
    
    handleCalendarConfirm(e) {
      this.date = e[0];
      this.showCalendar = false;
      this.loadDataByDate();
    },
    
    handleNameTap(index) {
      this.editingNameIndex = index;
    },
    
    async finishEditName(index) {
      const oldName = this.members[index]?.name || this.users[index]?.name;
      const newName = this.users[index]?.name?.trim();
      
      if (!newName) {
        uni.showToast({
          title: '名字不能为空',
          icon: 'none'
        });
        this.users[index].name = oldName;
        this.editingNameIndex = -1;
        return;
      }
      
      if (oldName !== newName) {
        if (this.members[index]) {
          this.members[index].name = newName;
        }
        await this.updateNameInCloud(oldName, newName);
      }
      
      this.editingNameIndex = -1;
    },
    
    async updateNameInCloud(oldName, newName) {
      try {
        await ensureLogin()
        
        const allScores = await queryDocs('scores', {
          groupId: this.groupId
        })
        
        for (const scoreRecord of allScores) {
          let needUpdate = false
          const updatedUsers = (scoreRecord.users || []).map(user => {
            if (user.name === oldName) {
              needUpdate = true
              return { ...user, name: newName }
            }
            return user
          })
          
          if (needUpdate) {
            await updateDoc('scores', scoreRecord._id, {
              users: updatedUsers
            })
          }
        }

        if (this.groupDocId) {
          await updateDoc('groups', this.groupDocId, {
            members: this.members.map(m => m.phone || m.name)
          })
        }
        
        this.loadMembers();
      } catch (err) {
        console.error('更新名称失败:', err)
      }
    },
    
    async saveData() {
      if (this.users.length === 0) {
        uni.showToast({
          title: '请至少添加一个成员',
          icon: 'none'
        });
        return;
      }

      this.saving = true

      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {}
        
        const existingScores = await queryDocs('scores', {
          groupId: this.groupId,
          date: this.date
        })
        
        if (existingScores.length > 0) {
          await updateDoc('scores', existingScores[0]._id, {
            users: this.users
          })
        } else {
          await addDoc('scores', {
            id: getUuid(),
            groupId: this.groupId,
            date: this.date,
            users: this.users,
            creatorId: userInfo.phone || ''
          })
        }
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });

        try {
          const creatorPhone = userInfo.phone || ''
          const creatorName = userInfo.nickName || creatorPhone
          const group = await queryDocs('groups', { _id: this.groupId })
          const groupName = group.length > 0 ? group[0].groupName : '群组'
          for (const user of this.users) {
            const userPhone = user.phone || ''
            if (userPhone && userPhone !== creatorPhone) {
              await createNotification({
                userId: userPhone,
                type: 'score_change',
                title: '积分变动',
                content: `${creatorName}在"${groupName}"录入了新积分`,
                groupId: this.groupId,
                groupName
              })
            }
          }
        } catch (notifyErr) {
          console.error('发送通知失败:', notifyErr)
        }
      } catch (err) {
        console.error('保存失败:', err)
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: #F8FAFC;
  padding-bottom: 80rpx;
}

.header {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f3f4f6;
  background-color: white;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
}

.section {
  margin-top: 20px;
  background-color: white;
  padding: 20px;
  border-radius: 16px;
  margin: 20px 16px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
}

.add-member-btn {
  color: #22C55E;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.member-list {
  min-height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;
  color: #9ca3af;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.member-name {
  font-size: 16px;
  color: #1f2937;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input {
  display: flex;
  align-items: center;
}

.date-picker {
  margin-top: 8px;
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
}

.date-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: #1f2937;
}

.save-btn-container {
  margin: 32px 16px 0;
}

.dialog {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  width: 300px;
  box-sizing: border-box;
}

.dialog-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin-bottom: 30rpx;
}

.input {
  margin-bottom: 30rpx;
}

.dialog-buttons {
  display: flex;
  gap: 20rpx;
}

.dialog-buttons u-button {
  flex: 1;
}
</style>
