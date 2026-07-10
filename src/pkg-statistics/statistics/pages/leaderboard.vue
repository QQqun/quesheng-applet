<template>
  <view class="page-container">
    <!-- 顶部 Tab -->
    <view class="top-tabs">
      <text :class="activeTab === 'leaderboard' ? 'top-tab-active' : 'top-tab'" @click="activeTab = 'leaderboard'">排行榜</text>
      <text :class="activeTab === 'settlement' ? 'top-tab-active' : 'top-tab'" @click="activeTab = 'settlement'">周期结算</text>
    </view>

    <!-- 排行榜内容 -->
    <view v-if="activeTab === 'leaderboard'">
      <view class="section">
        <view class="form-item">
          <text class="label">选择群组</text>
          <view class="picker-display" @click="showGroupPicker = true">
            <text class="picker-text">{{ selectedGroupName || '全部群组' }}</text>
            <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
          </view>
        </view>

        <view class="filter-row">
          <text :class="periodFilter === 'week' ? 'filter-active' : 'filter-item'" @click="periodFilter = 'week'; loadLeaderboard()">本周</text>
          <text :class="periodFilter === 'month' ? 'filter-active' : 'filter-item'" @click="periodFilter = 'month'; loadLeaderboard()">本月</text>
          <text :class="periodFilter === 'total' ? 'filter-active' : 'filter-item'" @click="periodFilter = 'total'; loadLeaderboard()">总计</text>
        </view>
      </view>

      <u-picker :show="showGroupPicker" :columns="groupColumns" @confirm="onGroupConfirm" @cancel="showGroupPicker = false"></u-picker>

      <view class="section" v-if="leaderboardList.length > 0">
        <view class="rank-list">
          <view v-for="(item, index) in leaderboardList" :key="index" class="rank-item">
            <view class="rank-badge" :class="index < 3 ? 'rank-top-' + (index + 1) : ''">
              <text class="rank-num">{{ index + 1 }}</text>
            </view>
            <view class="rank-info">
              <text class="rank-name">{{ item.name }}</text>
              <view class="rank-change" v-if="item.rankChange !== 0">
                <u-icon :name="item.rankChange > 0 ? 'arrow-up-fill' : 'arrow-down-fill'" :color="item.rankChange > 0 ? '#22C55E' : '#ef4444'" size="12"></u-icon>
                <text :class="item.rankChange > 0 ? 'change-up' : 'change-down'">{{ Math.abs(item.rankChange) }}</text>
              </view>
            </view>
            <text class="rank-score" :class="item.totalScore >= 0 ? 'score-positive' : 'score-negative'">{{ item.totalScore >= 0 ? '+' : '' }}{{ item.totalScore }}</text>
          </view>
        </view>
      </view>

      <view class="section" v-else>
        <view class="empty-state">
          <u-icon name="list" color="#d1d5db" size="48"></u-icon>
          <text class="empty-text">暂无排行数据</text>
        </view>
      </view>

      <!-- 分享功能已隐藏 -->
    </view>

    <!-- 周期结算内容 -->
    <view v-if="activeTab === 'settlement'">
      <view class="section">
        <view class="form-item">
          <text class="label">选择群组</text>
          <view class="picker-display" @click="showSettlementGroupPicker = true">
            <text class="picker-text">{{ settlementGroupName || '请选择群组' }}</text>
            <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
          </view>
        </view>

        <view class="filter-row">
          <text :class="settlementPeriod === 'week' ? 'filter-active' : 'filter-item'" @click="settlementPeriod = 'week'; loadSettlement()">本周</text>
          <text :class="settlementPeriod === 'month' ? 'filter-active' : 'filter-item'" @click="settlementPeriod = 'month'; loadSettlement()">本月</text>
        </view>
      </view>

      <u-picker :show="showSettlementGroupPicker" :columns="settlementGroupColumns" @confirm="onSettlementGroupConfirm" @cancel="showSettlementGroupPicker = false"></u-picker>

      <view class="section" v-if="settlementData.length > 0">
        <view class="settlement-header">
          <text class="settlement-period">{{ settlementPeriodLabel }}</text>
          <text class="settlement-range">{{ settlementRange }}</text>
        </view>
        <view class="settlement-list">
          <view v-for="(item, index) in settlementData" :key="index" class="settlement-item">
            <view class="settlement-rank">
              <text class="settlement-rank-num" v-if="index === 0">🏆</text>
              <text class="settlement-rank-num" v-else>{{ index + 1 }}</text>
            </view>
            <text class="settlement-name">{{ item.name }}</text>
            <text class="settlement-score" :class="item.totalScore >= 0 ? 'score-positive' : 'score-negative'">{{ item.totalScore >= 0 ? '+' : '' }}{{ item.totalScore }}</text>
          </view>
        </view>
        <view class="settlement-actions">
          <u-button text="生成结算卡" type="primary" color="#22C55E" @click="generateSettlement" :loading="generating"></u-button>
          <!-- <u-button text="分享" @click="handleShareSettlement" v-if="settlementData.length > 0"></u-button> -->
        </view>
      </view>

      <view class="section" v-else-if="settlementGroupSelected">
        <view class="empty-state">
          <u-icon name="calendar" color="#d1d5db" size="48"></u-icon>
          <text class="empty-text">该周期暂无数据</text>
        </view>
      </view>
    </view>

  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, queryDocs, queryAllDocs, addDoc, db } from '@/utils/cloudbase'
import { createNotification } from '@/utils/notification'

export default {
  data() {
    return {
      activeTab: 'leaderboard',
      groupList: [],
      selectedGroup: '',
      selectedGroupName: '',
      showGroupPicker: false,
      groupColumns: [[]],
      periodFilter: 'total',
      leaderboardList: [],
      allScores: [],
      allGroups: [],

      // 结算
      settlementGroupSelected: '',
      settlementGroupName: '',
      showSettlementGroupPicker: false,
      settlementGroupColumns: [[]],
      settlementPeriod: 'week',
      settlementData: [],
      settlementRange: '',
      generating: false
    }
  },
  computed: {
    settlementPeriodLabel() {
      return this.settlementPeriod === 'week' ? '本周结算' : '本月结算'
    }
  },
  onLoad(options) {
    if (options && options.tab === 'settlement') {
      this.activeTab = 'settlement'
    }
    this.initData()
  },
  // onShareAppMessage() {
  //   return {
  //     title: '雀圣积分排行榜',
  //     path: '/pages/index/index'
  //   }
  // },
  methods: {
    async initData() {
      await this.loadGroups()
      await this.loadAllScores()
      this.loadLeaderboard()
      if (this.activeTab === 'settlement' && this.settlementGroupSelected) {
        this.loadSettlement()
      }
    },

    async loadGroups() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const userPhone = userInfo.phone || ''
        const userName = userInfo.nickName || userPhone
        
        let groups = []
        if (userPhone) {
          groups = await queryDocs('groups', { members: userPhone })
        }
        if (groups.length === 0 && userName) {
          const legacyGroups = await queryDocs('groups', { members: userName })
          groups = groups.concat(legacyGroups)
        }
        const seen = new Set()
        groups = groups.filter(g => {
          const key = g._id || g.id
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        this.groupList = groups
        this.allGroups = groups.map(g => ({
          text: g.groupName,
          value: g._id || g.id
        }))
        this.groupList = groups

        const allOption = [{ text: '全部群组', value: '' }]
        this.groupColumns = [allOption.concat(this.allGroups)]
        this.settlementGroupColumns = [this.allGroups]

        if (this.allGroups.length > 0) {
          this.settlementGroupSelected = this.allGroups[0].value
          this.settlementGroupName = this.allGroups[0].text
        }
      } catch (err) {
        console.error('加载群组失败:', err)
      }
    },

    async loadAllScores() {
      try {
        const groupIds = this.groupList.map(g => g._id || g.id)
        if (groupIds.length === 0) {
          this.allScores = []
          return
        }
        const _ = db.command
        this.allScores = await queryAllDocs('scores', {
          groupId: _.in(groupIds)
        })
      } catch (err) {
        console.error('加载积分失败:', err)
      }
    },

    onGroupConfirm(e) {
      this.selectedGroup = e.value[0].value
      this.selectedGroupName = e.value[0].text
      this.showGroupPicker = false
      this.loadLeaderboard()
    },

    onSettlementGroupConfirm(e) {
      this.settlementGroupSelected = e.value[0].value
      this.settlementGroupName = e.value[0].text
      this.showSettlementGroupPicker = false
      this.loadSettlement()
    },

    filterByPeriod(scores, period) {
      const todayStr = dayjs().format('YYYY-MM-DD')

      if (period === 'total') return scores

      if (period === 'week') {
        const dayOfWeek = dayjs().day() || 7
        const weekStartStr = dayjs().subtract(dayOfWeek - 1, 'day').format('YYYY-MM-DD')
        return scores.filter(s => s.date >= weekStartStr && s.date <= todayStr)
      }

      if (period === 'month') {
        const monthStart = dayjs().format('YYYY-MM') + '-01'
        return scores.filter(s => s.date >= monthStart && s.date <= todayStr)
      }

      return scores
    },

    loadLeaderboard() {
      let scores = [...this.allScores]
      if (this.selectedGroup) {
        scores = scores.filter(s => s.groupId === this.selectedGroup)
      }
      const filteredScores = this.filterByPeriod(scores, this.periodFilter)

      const userTotals = {}
      filteredScores.forEach(record => {
        (record.users || []).forEach(u => {
          if (!userTotals[u.name]) userTotals[u.name] = 0
          userTotals[u.name] += Number(u.score) || 0
        })
      })

      const currentSorted = Object.entries(userTotals)
        .map(([name, totalScore]) => ({ name, totalScore }))
        .sort((a, b) => b.totalScore - a.totalScore)

      // 计算上一周期排名变化
      const prevPeriod = this.periodFilter === 'total' ? 'total' : (this.periodFilter === 'week' ? 'month' : 'total')
      const prevScores = this.filterByPeriod(scores, prevPeriod === this.periodFilter ? 'total' : prevPeriod)
      const prevTotals = {}
      prevScores.forEach(record => {
        (record.users || []).forEach(u => {
          if (!prevTotals[u.name]) prevTotals[u.name] = 0
          prevTotals[u.name] += Number(u.score) || 0
        })
      })
      const prevSorted = Object.entries(prevTotals)
        .map(([name, totalScore]) => ({ name, totalScore }))
        .sort((a, b) => b.totalScore - a.totalScore)

      currentSorted.forEach((item, index) => {
        item.rank = index + 1
        const prevRank = prevSorted.findIndex(p => p.name === item.name)
        item.rankChange = prevRank === -1 ? 0 : (prevRank + 1) - (index + 1)
      })

      this.leaderboardList = currentSorted
    },

    getWeekRange() {
      const day = dayjs().day() || 7
      const start = dayjs().subtract(day - 1, 'day')
      const end = start.add(6, 'day')
      return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') }
    },

    getMonthRange() {
      const now = dayjs()
      const start = now.format('YYYY-MM') + '-01'
      const end = now.endOf('month').format('YYYY-MM-DD')
      return { start, end }
    },

    async loadSettlement() {
      if (!this.settlementGroupSelected) return

      const range = this.settlementPeriod === 'week' ? this.getWeekRange() : this.getMonthRange()
      this.settlementRange = `${range.start} 至 ${range.end}`

      const scores = this.allScores.filter(s =>
        s.groupId === this.settlementGroupSelected &&
        s.date >= range.start &&
        s.date <= range.end
      )

      const userTotals = {}
      scores.forEach(record => {
        (record.users || []).forEach(u => {
          if (!userTotals[u.name]) userTotals[u.name] = 0
          userTotals[u.name] += Number(u.score) || 0
        })
      })

      this.settlementData = Object.entries(userTotals)
        .map(([name, totalScore]) => ({ name, totalScore }))
        .sort((a, b) => b.totalScore - a.totalScore)
    },

    async generateSettlement() {
      if (this.settlementData.length === 0) return
      this.generating = true

      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const range = this.settlementPeriod === 'week' ? this.getWeekRange() : this.getMonthRange()

        await addDoc('settlements', {
          groupId: this.settlementGroupSelected,
          groupName: this.settlementGroupName,
          periodType: this.settlementPeriod,
          periodStart: range.start,
          periodEnd: range.end,
          creatorId: userInfo.phone || '',
          users: this.settlementData.map((item, index) => ({
            name: item.name,
            totalScore: item.totalScore,
            rank: index + 1
          }))
        })

        // 为群组成员创建通知
        const group = this.groupList.find(g => (g._id || g.id) === this.settlementGroupSelected)
        if (group && group.members) {
          const creatorPhone = userInfo.phone || ''
          for (const memberValue of group.members) {
            if (memberValue !== creatorPhone) {
              await createNotification({
                userId: memberValue,
                type: 'settlement',
                title: '周期结算',
                content: `${this.settlementGroupName} ${this.settlementPeriodLabel}已生成`,
                groupId: this.settlementGroupSelected,
                groupName: this.settlementGroupName
              })
            }
          }
        }

        uni.showToast({ title: '结算卡已生成', icon: 'success' })
      } catch (err) {
        console.error('生成结算卡失败:', err)
        uni.showToast({ title: '生成失败', icon: 'none' })
      } finally {
        this.generating = false
      }
    },

    formatDate(date) {
      return dayjs(date).format('YYYY-MM-DD')
    }
  }
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #F8FAFC;
  padding-bottom: 40rpx;
}

/* 顶部 Tab */
.top-tabs {
  display: flex;
  background-color: white;
  padding: 12px 16px;
  gap: 0;
  border-bottom: 1px solid #f3f4f6;
}

.top-tab {
  flex: 1;
  text-align: center;
  font-size: 16px;
  color: #6b7280;
  padding-bottom: 8px;
  border-bottom: 2px solid transparent;
}

.top-tab-active {
  flex: 1;
  text-align: center;
  font-size: 16px;
  color: #22C55E;
  font-weight: bold;
  padding-bottom: 8px;
  border-bottom: 2px solid #22C55E;
}

.section {
  background-color: white;
  padding: 20px;
  border-radius: 16px;
  margin: 16px 16px 0;
  box-sizing: border-box;
}

.form-item {
  margin-bottom: 16px;
}

.label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-radius: 12px;
}

.picker-text {
  font-size: 16px;
  color: #1f2937;
}

/* 筛选行 */
.filter-row {
  display: flex;
  gap: 4px;
  background-color: #f3f4f6;
  border-radius: 8px;
  padding: 2px;
}

.filter-item {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  padding: 6px 0;
  border-radius: 6px;
}

.filter-active {
  flex: 1;
  text-align: center;
  font-size: 13px;
  color: #ffffff;
  background-color: #22C55E;
  padding: 6px 0;
  border-radius: 6px;
  font-weight: 500;
}

/* 排行列表 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 12px;
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-top-1 {
  background-color: #FFD700;
}

.rank-top-2 {
  background-color: #C0C0C0;
}

.rank-top-3 {
  background-color: #CD7F32;
}

.rank-num {
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.rank-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.rank-name {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
}

.rank-change {
  display: flex;
  align-items: center;
  gap: 2px;
}

.change-up {
  font-size: 11px;
  color: #22C55E;
}

.change-down {
  font-size: 11px;
  color: #ef4444;
}

.rank-score {
  font-size: 18px;
  font-weight: bold;
}

.score-positive {
  color: #22C55E;
}

.score-negative {
  color: #ef4444;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;
  color: #9ca3af;
}

/* 结算 */
.settlement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.settlement-period {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
}

.settlement-range {
  font-size: 12px;
  color: #9ca3af;
}

.settlement-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settlement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f9fafb;
}

.settlement-rank {
  width: 32px;
  text-align: center;
}

.settlement-rank-num {
  font-size: 16px;
  font-weight: bold;
  color: #6b7280;
}

.settlement-name {
  flex: 1;
  font-size: 16px;
  color: #1f2937;
}

.settlement-score {
  font-size: 18px;
  font-weight: bold;
}

.settlement-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.settlement-actions u-button {
  flex: 1;
}

</style>
