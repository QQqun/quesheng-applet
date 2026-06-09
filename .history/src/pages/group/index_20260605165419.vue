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
      <u-calendar :show="showCalendar" color="#22C55E" :min-date="minDate" :max-date="maxDate" @close="showCalendar = false" @confirm="handleCalendarConfirm"></u-calendar>
    </view>
    
    <view class="section">
      <view class="section-header">
        <text class="section-title">成员列表</text>
        <view class="add-member-btn" @click="showAddMemberDialog = true">
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
          <view class="score-input">
            <u-input v-model="user.score" type="text" :showWordLimit="true" placeholder="0" border="surround" style="width: 100px;"></u-input>
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
          <u-input v-model="newMemberName" placeholder="请输入成员名称" border="surround"></u-input>
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
import { ensureLogin, addDoc, queryDocs, updateDoc } from '../../utils/cloudbase'
import { getUuid } from '../../utils'

export default {
  data() {
    return {
      groupId: '',
      users: [],
      members: [],
      date: '',
      minDate: '2026-01-01',
      maxDate: '',
      showAddMemberDialog: false,
      newMemberName: '',
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
    
    const today = new Date();
    this.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.maxDate = this.date;
    
    this.initData();
  },
  methods: {
    async initData() {
      await this.loadMembers();
      await this.loadDataByDate();
    },
    
    async loadMembers() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {};
        const currentUser = userInfo.nickName || userInfo.username || '雀圣';
        
        const groups = await queryDocs('groups', { _id: this.groupId })
        
        const memberSet = new Set();
        memberSet.add(currentUser);
        
        if (groups.length > 0) {
          this.groupDocId = groups[0]._id
          if (groups[0].members && groups[0].members.length > 0) {
            groups[0].members.forEach(name => {
              memberSet.add(name);
            });
          }
        }
        
        this.members = Array.from(memberSet).map(name => ({ name }));
      } catch (err) {
        console.error('加载成员失败:', err)
        const userInfo = uni.getStorageSync('userInfo') || {};
        const currentUser = userInfo.nickName || userInfo.username || '雀圣';
        this.members = [{ name: currentUser }]
      }
    },
    
    async loadDataByDate() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {}
        
        const scores = await queryDocs('scores', {
          groupId: this.groupId,
          date: this.date
        })
        
        if (scores.length > 0) {
          this.users = scores[0].users || [];
        } else {
          this.users = this.members.map(member => ({
            name: member.name,
            score: 0
          }));
        }
      } catch (err) {
        console.error('加载数据失败:', err)
        this.users = this.members.map(member => ({
          name: member.name,
          score: 0
        }));
      }
    },
    
    async addMember() {
      if (!this.newMemberName.trim()) {
        uni.showToast({
          title: '请输入成员名称',
          icon: 'none'
        });
        return;
      }
      
      const memberName = this.newMemberName.trim();
      
      const exists = this.members.some(m => m.name === memberName);
      if (exists) {
        uni.showToast({
          title: '该成员已存在',
          icon: 'none'
        });
        return;
      }
      
      this.members.push({
        name: memberName
      });
      
      this.users.push({
        name: memberName,
        score: 0
      });

      try {
        if (this.groupDocId) {
          await updateDoc('groups', this.groupDocId, {
            members: this.members.map(m => m.name)
          })
        }
      } catch (err) {
        console.error('更新群组成员失败:', err)
      }
      
      this.showAddMemberDialog = false;
      this.newMemberName = '';
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
        const userInfo = uni.getStorageSync('userInfo') || {}
        
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
            members: this.members.map(m => m.name)
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
            creatorId: userInfo.username
          })
        }
        
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });
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
