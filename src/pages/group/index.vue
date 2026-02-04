<template>
  <view class="page-container">
    <!-- 页面标题 -->
    <view class="header">
      <text class="title">群组详情</text>
    </view>
    
    <!-- 成员列表 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">成员列表</text>
        <view class="add-member-btn" @click="showAddMemberDialog = true">
          <u-icon name="plus-circle" color="#22C55E" size="16" style="margin-right: 4px;"></u-icon>
          <text>添加成员</text>
        </view>
      </view>
      
      <!-- 成员列表内容 -->
      <view class="member-list">
        <view v-if="users.length === 0" class="empty-state">
          <u-icon name="account" color="#9ca3af" size="48"></u-icon>
          <text class="empty-text">暂无成员，请添加</text>
        </view>
        <view v-else class="member-item" v-for="(user, index) in users" :key="index">
          <text class="member-name">{{ user.name }}</text>
          <view class="score-input">
            <u-input v-model="user.score" type="number" placeholder="0" border="surround" style="width: 100px;"></u-input>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 日期选择 -->
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
    
    <!-- 保存按钮 -->
    <view class="save-btn-container">
      <u-button text="保存" type="primary" color="#22C55E" @click="saveData"></u-button>
    </view>
    
    <!-- 添加成员弹窗 -->
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
import { getUuid } from '../../utils';

export default {
  data() {
    return {
      groupId: '',
      users: [],
      date: '',
      showAddMemberDialog: false,
      newMemberName: '',
      showCalendar: false
    }
  },
  onLoad(options) {
    // 接收分组ID
    if (options.id) {
      this.groupId = options.id;
    }
    
    // 设置默认日期为当前日期
    const today = new Date();
    this.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // 初始化数据
    this.initData();
  },
  methods: {
    // 初始化数据
    initData() {
      // 从缓存中获取数据
      const cachedData = uni.getStorageSync('groupData') || [];
      const groupData = cachedData.find(item => item.groupId === this.groupId);
      
      if (groupData) {
        this.users = groupData.users || [];
        this.date = groupData.date || this.date;
      }
    },
    
    // 显示添加成员弹窗
    showAddMemberDialog() {
      this.showAddMemberDialog = true;
    },
    
    // 添加成员
    addMember() {
      if (!this.newMemberName.trim()) {
        uni.showToast({
          title: '请输入成员名称',
          icon: 'none'
        });
        return;
      }
      
      // 添加新成员
      this.users.push({
        name: this.newMemberName.trim(),
        score: 0
      });
      
      // 关闭弹窗并清空输入
      this.showAddMemberDialog = false;
      this.newMemberName = '';
    },
    
    // 处理日历选择确认
    handleCalendarConfirm(e) {
      this.date = e.date;
      this.showCalendar = false;
    },
    
    // 保存数据
    saveData() {
      if (this.users.length === 0) {
        uni.showToast({
          title: '请至少添加一个成员',
          icon: 'none'
        });
        return;
      }
      
      // 准备保存的数据
      const dataToSave = {
        id: getUuid(),
        groupId: this.groupId,
        date: this.date,
        users: this.users
      };
      
      // 从缓存中获取现有数据
      let cachedData = uni.getStorageSync('groupData') || [];
      
      // 查找是否已存在该群组的数据
      const existingIndex = cachedData.findIndex(item => item.groupId === this.groupId);
      
      if (existingIndex !== -1) {
        // 更新现有数据
        cachedData[existingIndex] = dataToSave;
      } else {
        // 添加新数据
        cachedData.push(dataToSave);
      }
      
      // 保存到缓存
      uni.setStorageSync('groupData', cachedData);
      
      // 显示保存成功提示
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 返回上一页
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  }
}
</script>

<style scoped>
/* 页面容器 */
.page-container {
  width: 100%;
  min-height: 100vh;
  background-color: #F8FAFC;
  padding-bottom: 80rpx;
}

/* 页面标题 */
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

/* section样式 */
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

/* 添加成员按钮 */
.add-member-btn {
  color: #22C55E;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 成员列表 */
.member-list {
  min-height: 200px;
}

/* 空状态 */
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

/* 成员项 */
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

/* 分数输入 */
.score-input {
  display: flex;
  align-items: center;
}

/* 日期选择 */
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

/* 保存按钮 */
.save-btn-container {
  margin: 32px 16px 0;
}

/* 弹窗样式 */
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