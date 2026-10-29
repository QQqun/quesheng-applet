<template>
  <view class="qs-page board-page">
    <view class="qs-segment top-tabs">
      <text class="qs-segment-item" :class="{ active: activeTab === 'leaderboard' }" @click="activeTab = 'leaderboard'">排行榜</text>
      <text class="qs-segment-item" :class="{ active: activeTab === 'settlement' }" @click="activeTab = 'settlement'">周期结算</text>
    </view>

    <!-- 排行榜 -->
    <view v-if="activeTab === 'leaderboard'">
      <view class="qs-glass filter-card">
        <view class="qs-picker-row" style="margin-bottom: 18rpx;" @click="showGroupPicker = true">
          <text class="qs-picker-label">选择群组</text>
          <view class="picker-value-wrap">
            <text class="qs-picker-value">{{ selectedGroupName || '全部群组' }}</text>
            <u-icon name="arrow-right" color="#8AA79B" size="14"></u-icon>
          </view>
        </view>
        <view class="qs-segment">
          <text class="qs-segment-item" :class="{ active: periodFilter === 'week' }" @click="changePeriod('week')">本周</text>
          <text class="qs-segment-item" :class="{ active: periodFilter === 'month' }" @click="changePeriod('month')">本月</text>
          <text class="qs-segment-item" :class="{ active: periodFilter === 'total' }" @click="changePeriod('total')">总计</text>
        </view>
      </view>

      <view class="qs-glass rank-card" v-if="leaderboardList.length > 0">
        <view class="rank-list">
          <view v-for="(item, index) in leaderboardList" :key="index" class="rank-item">
            <view class="rank-badge" :class="'top' + (index < 3 ? index + 1 : 0)">
              <text class="rank-num">{{ index + 1 }}</text>
            </view>
            <view class="rank-info">
              <text class="rank-name">{{ item.name }}</text>
              <view class="rank-change" v-if="item.rankChange !== 0">
                <u-icon :name="item.rankChange > 0 ? 'arrow-up-fill' : 'arrow-down-fill'" :color="item.rankChange > 0 ? '#34D399' : '#F87171'" size="12"></u-icon>
                <text :class="item.rankChange > 0 ? 'change-up' : 'change-down'">{{ Math.abs(item.rankChange) }}</text>
              </view>
            </view>
            <text class="rank-score" :class="item.totalScore >= 0 ? 'qs-jade' : 'qs-danger'">{{ item.totalScore >= 0 ? '+' : '' }}{{ item.totalScore }}</text>
          </view>
        </view>
      </view>

      <view class="qs-glass qs-empty" v-else>
        <u-icon name="list" color="#4C6B5C" size="46"></u-icon>
        <text style="margin-top: 16rpx;">暂无排行数据</text>
      </view>
    </view>

    <!-- 周期结算 -->
    <view v-if="activeTab === 'settlement'">
      <view class="qs-glass filter-card">
        <view class="qs-picker-row" style="margin-bottom: 18rpx;" @click="showSettlementGroupPicker = true">
          <text class="qs-picker-label">选择群组</text>
          <view class="picker-value-wrap">
            <text class="qs-picker-value">{{ settlementGroupName || '请选择群组' }}</text>
            <u-icon name="arrow-right" color="#8AA79B" size="14"></u-icon>
          </view>
        </view>
        <view class="qs-segment">
          <text class="qs-segment-item" :class="{ active: settlementMode === 'week' }" @click="changeSettlementMode('week')">本周</text>
          <text class="qs-segment-item" :class="{ active: settlementMode === 'month' }" @click="changeSettlementMode('month')">按月</text>
          <text class="qs-segment-item" :class="{ active: settlementMode === 'range' }" @click="changeSettlementMode('range')">范围</text>
        </view>
        <view class="filter-grid" v-if="settlementMode === 'month'">
          <view class="mini-picker" @click="showSettlementMonthPicker = true">
            <text class="mini-label">结算月份</text>
            <text class="mini-value">{{ settlementMonthLabel }}</text>
          </view>
        </view>
        <view class="filter-grid" v-if="settlementMode === 'range'">
          <view class="mini-picker" @click="showStartMonthPicker = true">
            <text class="mini-label">起始月份</text>
            <text class="mini-value">{{ startMonthLabel }}</text>
          </view>
          <view class="mini-picker" @click="showEndMonthPicker = true">
            <text class="mini-label">结束月份</text>
            <text class="mini-value">{{ endMonthLabel }}</text>
          </view>
        </view>
      </view>

      <view class="qs-glass settle-card" v-if="settlementData.length > 0">
        <view class="settle-head">
          <text class="qs-section-title">{{ settlementPeriodLabel }}</text>
          <text class="qs-sub">{{ settlementRange }}</text>
        </view>
        <view class="settle-list">
          <view v-for="(item, index) in settlementData" :key="index" class="settle-item">
            <view class="settle-rank">
              <text class="settle-rank-num" v-if="index === 0">🏆</text>
              <text class="settle-rank-num" v-else>{{ index + 1 }}</text>
            </view>
            <text class="settle-name">{{ item.name }}</text>
            <text class="settle-score" :class="item.totalScore >= 0 ? 'qs-jade' : 'qs-danger'">{{ item.totalScore >= 0 ? '+' : '' }}{{ item.totalScore }}</text>
          </view>
        </view>
        <view class="settle-actions">
          <u-button
            text="生成结算卡"
            @click="generateSettlement"
            :loading="generating"
            customStyle="margin:0;height:88rpx;border-radius:999rpx;background:linear-gradient(135deg,#E9C46A,#F2D98F);color:#05130D;font-weight:700;border:none;"
          ></u-button>
        </view>
      </view>

      <!-- 结算卡 -->
      <view class="settle-result" v-if="settlementCard">
        <view class="result-head">
          <view class="result-brand">
            <text class="result-mark">雀</text>
            <view class="result-titles">
              <text class="result-title">{{ settlementCard.groupName }}</text>
              <text class="result-sub">{{ settlementCard.periodLabel }} · {{ settlementCard.range }}</text>
            </view>
          </view>
          <text class="result-time">{{ settlementCard.time }}</text>
        </view>
        <view class="result-list">
          <view
            v-for="(item, index) in settlementCard.users"
            :key="index"
            class="result-row"
            :class="'r' + (index < 3 ? index + 1 : 0)"
          >
            <text class="result-rank">{{ index + 1 }}</text>
            <text class="result-name">{{ item.name }}</text>
            <text class="result-score" :class="item.totalScore >= 0 ? 'qs-jade' : 'qs-danger'">{{ item.totalScore >= 0 ? '+' : '' }}{{ item.totalScore }}</text>
          </view>
        </view>
        <view class="result-foot">
          <text class="qs-sub">积分为 0 的成员视为未参与，不参与排名</text>
          <text class="result-close" @click="settlementCard = null">收起</text>
        </view>
      </view>

      <view class="qs-glass qs-empty" v-else-if="settlementGroupSelected">
        <u-icon name="calendar" color="#4C6B5C" size="46"></u-icon>
        <text style="margin-top: 16rpx;">该周期暂无数据</text>
      </view>
    </view>

    <u-picker :show="showGroupPicker" :columns="groupColumns" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onGroupConfirm" @cancel="showGroupPicker = false"></u-picker>
    <u-picker :show="showSettlementGroupPicker" :columns="settlementGroupColumns" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onSettlementGroupConfirm" @cancel="showSettlementGroupPicker = false"></u-picker>
    <u-picker :show="showSettlementMonthPicker" :columns="[monthColumns]" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onSettlementMonthConfirm" @cancel="showSettlementMonthPicker = false"></u-picker>
    <u-picker :show="showStartMonthPicker" :columns="[monthColumns]" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onStartMonthConfirm" @cancel="showStartMonthPicker = false"></u-picker>
    <u-picker :show="showEndMonthPicker" :columns="[monthColumns]" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onEndMonthConfirm" @cancel="showEndMonthPicker = false"></u-picker>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import { ensureLogin, ensureCollections, queryDocs, queryScores, addDoc } from '@/utils/cloudbase'
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

      settlementGroupSelected: '',
      settlementGroupName: '',
      showSettlementGroupPicker: false,
      settlementGroupColumns: [[]],
      settlementMode: 'month',
      settlementMonth: dayjs().format('YYYY-MM'),
      settlementStartMonth: dayjs().subtract(1, 'month').format('YYYY-MM'),
      settlementEndMonth: dayjs().format('YYYY-MM'),
      showSettlementMonthPicker: false,
      showStartMonthPicker: false,
      showEndMonthPicker: false,
      settlementData: [],
      settlementRange: '',
      settlementCard: null,
      generating: false
    }
  },
  computed: {
    monthColumns() {
      const months = new Set()
      this.allScores.forEach((s) => {
        if (s.date) months.add(s.date.slice(0, 7))
      })
      for (let i = 0; i < 18; i++) {
        months.add(dayjs().subtract(i, 'month').format('YYYY-MM'))
      }
      return Array.from(months)
        .sort()
        .reverse()
        .map((m) => ({ text: this.formatMonthLabel(m), value: m }))
    },
    settlementMonthLabel() {
      return this.formatMonthLabel(this.settlementMonth)
    },
    startMonthLabel() {
      return this.formatMonthLabel(this.settlementStartMonth)
    },
    endMonthLabel() {
      return this.formatMonthLabel(this.settlementEndMonth)
    },
    settlementPeriodLabel() {
      if (this.settlementMode === 'week') return '本周结算'
      if (this.settlementMode === 'month') return `${this.settlementMonthLabel}结算`
      const start = this.settlementStartMonth < this.settlementEndMonth ? this.settlementStartMonth : this.settlementEndMonth
      const end = this.settlementStartMonth < this.settlementEndMonth ? this.settlementEndMonth : this.settlementStartMonth
      return `${this.formatMonthLabel(start)} ~ ${this.formatMonthLabel(end)}`
    }
  },
  onLoad(options) {
    if (options && options.tab === 'settlement') {
      this.activeTab = 'settlement'
    }
    this.initData()
  },
  methods: {
    async initData() {
      uni.showLoading({ title: '加载中...', mask: true })
      try {
        await this.loadGroups()
        await this.loadAllScores()
        this.loadLeaderboard()
        if (this.activeTab === 'settlement' && this.settlementGroupSelected) {
          this.loadSettlement()
        }
      } finally {
        uni.hideLoading()
      }
    },

    formatMonthLabel(month) {
      if (!month) return '--'
      return `${month.slice(0, 4)}年${Number(month.slice(5, 7))}月`
    },

    changeSettlementMode(mode) {
      if (this.settlementMode === mode) return
      this.settlementMode = mode
      this.settlementCard = null
      this.loadSettlement()
    },

    onSettlementMonthConfirm(e) {
      this.settlementMonth = e.value[0].value
      this.showSettlementMonthPicker = false
      this.settlementCard = null
      this.loadSettlement()
    },

    onStartMonthConfirm(e) {
      this.settlementStartMonth = e.value[0].value
      if (this.settlementStartMonth > this.settlementEndMonth) {
        this.settlementEndMonth = this.settlementStartMonth
      }
      this.showStartMonthPicker = false
      this.settlementCard = null
      this.loadSettlement()
    },

    onEndMonthConfirm(e) {
      this.settlementEndMonth = e.value[0].value
      if (this.settlementEndMonth < this.settlementStartMonth) {
        this.settlementStartMonth = this.settlementEndMonth
      }
      this.showEndMonthPicker = false
      this.settlementCard = null
      this.loadSettlement()
    },

    async loadGroups() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo') || {}
        const userPhone = userInfo.phone || ''
        const userName = userInfo.nickName || userPhone

        let groups = []
        if (userPhone) groups = await queryDocs('groups', { members: userPhone })
        if (groups.length === 0 && userName) {
          groups = groups.concat(await queryDocs('groups', { members: userName }))
        }
        const seen = new Set()
        groups = groups.filter((g) => {
          const key = g._id || g.id
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        this.groupList = groups
        const allGroups = groups.map((g) => ({ text: g.groupName, value: g._id || g.id }))
        this.groupColumns = [[{ text: '全部群组', value: '' }].concat(allGroups)]
        this.settlementGroupColumns = [allGroups]

        if (allGroups.length > 0) {
          this.settlementGroupSelected = allGroups[0].value
          this.settlementGroupName = allGroups[0].text
        }
      } catch (err) {
        console.error('加载群组失败:', err)
      }
    },

    async loadAllScores() {
      const groupIds = this.groupList.map((g) => g._id || g.id)
      if (groupIds.length === 0) {
        this.allScores = []
        return
      }
      try {
        this.allScores = await queryScores({ groupIds })
      } catch (err) {
        console.error('加载积分失败:', err)
        this.allScores = []
      }
    },

    changePeriod(period) {
      this.periodFilter = period
      this.loadLeaderboard()
    },

    onGroupConfirm(e) {
      const item = e.value[0]
      this.selectedGroup = item.value
      this.selectedGroupName = item.text
      this.showGroupPicker = false
      this.loadLeaderboard()
    },

    onSettlementGroupConfirm(e) {
      const item = e.value[0]
      this.settlementGroupSelected = item.value
      this.settlementGroupName = item.text
      this.showSettlementGroupPicker = false
      this.settlementCard = null
      this.loadSettlement()
    },

    filterByPeriod(scores, period) {
      const todayStr = dayjs().format('YYYY-MM-DD')
      if (period === 'total') return scores

      if (period === 'week') {
        const dayOfWeek = dayjs().day() || 7
        const weekStartStr = dayjs().subtract(dayOfWeek - 1, 'day').format('YYYY-MM-DD')
        return scores.filter((s) => s.date >= weekStartStr && s.date <= todayStr)
      }

      if (period === 'month') {
        const monthStart = dayjs().format('YYYY-MM') + '-01'
        return scores.filter((s) => s.date >= monthStart && s.date <= todayStr)
      }

      return scores
    },

    calcTotals(scores) {
      const totals = {}
      scores.forEach((record) => {
        ;(record.users || []).forEach((u) => {
          const score = parseInt(u.score) || 0
          if (score === 0) return // 0 分视为未参与
          if (!totals[u.name]) totals[u.name] = 0
          totals[u.name] += score
        })
      })
      return Object.entries(totals)
        .map(([name, totalScore]) => ({ name, totalScore }))
        .sort((a, b) => b.totalScore - a.totalScore)
    },

    loadLeaderboard() {
      let scores = [...this.allScores]
      if (this.selectedGroup) {
        scores = scores.filter((s) => s.groupId === this.selectedGroup)
      }
      const currentSorted = this.calcTotals(this.filterByPeriod(scores, this.periodFilter))

      const prevPeriod = this.periodFilter === 'total' ? 'total' : this.periodFilter === 'week' ? 'month' : 'total'
      const prevSorted = this.calcTotals(this.filterByPeriod(scores, prevPeriod === this.periodFilter ? 'total' : prevPeriod))

      currentSorted.forEach((item, index) => {
        item.rank = index + 1
        const prevRank = prevSorted.findIndex((p) => p.name === item.name)
        item.rankChange = prevRank === -1 ? 0 : prevRank + 1 - (index + 1)
      })

      this.leaderboardList = currentSorted
    },

    getWeekRange() {
      const day = dayjs().day() || 7
      const start = dayjs().subtract(day - 1, 'day')
      const end = start.add(6, 'day')
      return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') }
    },

    getMonthRangeOf(month) {
      return {
        start: `${month}-01`,
        end: dayjs(`${month}-01`).endOf('month').format('YYYY-MM-DD')
      }
    },

    getSettlementRange() {
      if (this.settlementMode === 'week') return this.getWeekRange()
      if (this.settlementMode === 'month') return this.getMonthRangeOf(this.settlementMonth)
      const startMonth = this.settlementStartMonth < this.settlementEndMonth ? this.settlementStartMonth : this.settlementEndMonth
      const endMonth = this.settlementStartMonth < this.settlementEndMonth ? this.settlementEndMonth : this.settlementStartMonth
      return { start: `${startMonth}-01`, end: dayjs(`${endMonth}-01`).endOf('month').format('YYYY-MM-DD') }
    },

    loadSettlement() {
      if (!this.settlementGroupSelected) return
      const range = this.getSettlementRange()
      this.settlementRange = `${range.start} 至 ${range.end}`

      const scores = this.allScores.filter(
        (s) => s.groupId === this.settlementGroupSelected && s.date >= range.start && s.date <= range.end
      )

      this.settlementData = this.calcTotals(scores)
    },

    async generateSettlement() {
      if (this.settlementData.length === 0) return
      this.generating = true

      try {
        await ensureLogin()
        // 确保 settlements 集合已存在，避免首次生成时写入失败
        await ensureCollections()

        const userInfo = uni.getStorageSync('userInfo') || {}
        const range = this.getSettlementRange()

        // 结算记录归档为尽力而为：集合不可用时不阻塞结算与通知
        try {
          await addDoc('settlements', {
            groupId: this.settlementGroupSelected,
            groupName: this.settlementGroupName,
            periodType: this.settlementMode,
            periodStart: range.start,
            periodEnd: range.end,
            creatorId: userInfo.phone || '',
            users: this.settlementData.map((item, index) => ({
              name: item.name,
              totalScore: item.totalScore,
              rank: index + 1
            }))
          })
        } catch (saveErr) {
          console.warn('结算记录归档失败（settlements 集合不可用），本次结算照常生效:', saveErr)
        }

        // 通知失败不影响结算卡生成结果
        try {
          const group = this.groupList.find((g) => (g._id || g.id) === this.settlementGroupSelected)
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
        } catch (notifyErr) {
          console.warn('结算通知发送失败:', notifyErr)
        }

        // 生成可在页面上直接查看的结算卡
        this.settlementCard = {
          groupName: this.settlementGroupName,
          periodLabel: this.settlementPeriodLabel,
          range: `${range.start} 至 ${range.end}`,
          time: dayjs().format('YYYY-MM-DD HH:mm'),
          users: this.settlementData.map((item, index) => ({
            name: item.name,
            totalScore: item.totalScore,
            rank: index + 1
          }))
        }

        uni.showToast({ title: '结算卡已生成', icon: 'success' })
      } catch (err) {
        console.error('生成结算卡失败:', err)
        uni.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
      } finally {
        this.generating = false
      }
    }
  }
}
</script>

<style scoped>
.board-page {
  padding-top: 28rpx;
}

.top-tabs {
  margin-bottom: 22rpx;
}

.filter-card {
  padding: 24rpx 22rpx;
  margin-bottom: 22rpx;
}

.picker-value-wrap {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.filter-grid {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
}

.mini-picker {
  flex: 1;
  padding: 16rpx 20rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.mini-label {
  display: block;
  font-size: 21rpx;
  color: #8aa79b;
  margin-bottom: 4rpx;
}

.mini-value {
  font-size: 27rpx;
  font-weight: 600;
  color: #f4fbf7;
}

.rank-card {
  padding: 22rpx 22rpx;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.rank-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.045);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
}

.rank-badge {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 18rpx;
}

.rank-badge.top1 {
  background: linear-gradient(135deg, #f6d365, #fda085);
  box-shadow: 0 8rpx 20rpx -10rpx rgba(246, 211, 101, 0.8);
}

.rank-badge.top2 {
  background: linear-gradient(135deg, #d7e1e8, #aebac4);
}

.rank-badge.top3 {
  background: linear-gradient(135deg, #d9a066, #b9723c);
}

.rank-num {
  font-size: 24rpx;
  font-weight: 800;
  color: #05130d;
}

.rank-badge.top0 .rank-num {
  color: #b8ccc2;
}

.rank-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8rpx;
  min-width: 0;
}

.rank-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #f4fbf7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-change {
  display: flex;
  align-items: center;
  gap: 2rpx;
}

.change-up {
  font-size: 20rpx;
  color: #34d399;
}

.change-down {
  font-size: 20rpx;
  color: #f87171;
}

.rank-score {
  font-size: 32rpx;
  font-weight: 800;
  margin-left: 14rpx;
}

.settle-card {
  padding: 26rpx 24rpx;
}

.settle-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding-bottom: 18rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.settle-list {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  margin-top: 8rpx;
}

.settle-item {
  display: flex;
  align-items: center;
  padding: 18rpx 4rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.settle-item:last-child {
  border-bottom: none;
}

.settle-rank {
  width: 66rpx;
}

.settle-rank-num {
  font-size: 26rpx;
  font-weight: 700;
  color: #8aa79b;
}

.settle-name {
  flex: 1;
  font-size: 28rpx;
  color: #dcebe3;
}

.settle-score {
  font-size: 32rpx;
  font-weight: 800;
}

.settle-actions {
  margin-top: 28rpx;
}

/* 结算卡 */
.settle-result {
  margin-top: 22rpx;
  padding: 28rpx 24rpx;
  border-radius: 32rpx;
  background: linear-gradient(160deg, rgba(233, 196, 106, 0.16) 0%, rgba(52, 211, 153, 0.1) 45%, rgba(10, 31, 23, 0.92) 100%);
  border: 1rpx solid rgba(233, 196, 106, 0.45);
  box-shadow: 0 24rpx 50rpx -26rpx rgba(233, 196, 106, 0.5), inset 0 1rpx 0 rgba(255, 255, 255, 0.14);
  box-sizing: border-box;
}

.result-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 20rpx;
  border-bottom: 1rpx dashed rgba(233, 196, 106, 0.35);
}

.result-brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.result-mark {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #e9c46a, #f2d98f);
  color: #05130d;
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 18rpx;
  flex-shrink: 0;
}

.result-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.result-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #fff6de;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-sub {
  font-size: 21rpx;
  color: #b8ccc2;
  margin-top: 4rpx;
}

.result-time {
  font-size: 20rpx;
  color: #8aa79b;
  flex-shrink: 0;
  margin-left: 12rpx;
}

.result-list {
  margin-top: 10rpx;
}

.result-row {
  display: flex;
  align-items: center;
  padding: 16rpx 4rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.result-row:last-child {
  border-bottom: none;
}

.result-rank {
  width: 52rpx;
  height: 52rpx;
  line-height: 52rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  font-size: 22rpx;
  font-weight: 800;
  color: #b8ccc2;
  margin-right: 18rpx;
  flex-shrink: 0;
}

.result-row.r1 .result-rank {
  background: linear-gradient(135deg, #f6d365, #fda085);
  color: #05130d;
}

.result-row.r2 .result-rank {
  background: linear-gradient(135deg, #d7e1e8, #aebac4);
  color: #05130d;
}

.result-row.r3 .result-rank {
  background: linear-gradient(135deg, #d9a066, #b9723c);
  color: #05130d;
}

.result-name {
  flex: 1;
  font-size: 27rpx;
  color: #f4fbf7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-score {
  font-size: 30rpx;
  font-weight: 800;
  margin-left: 12rpx;
}

.result-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 22rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.result-close {
  font-size: 24rpx;
  color: #e9c46a;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(233, 196, 106, 0.4);
}
</style>
