<template>
  <view class="qs-page stats-page">
    <!-- 顶部 Hero -->
    <view class="qs-hero stats-hero">
      <view class="hero-inner">
        <view>
          <text class="hero-kicker">数据洞察</text>
          <text class="hero-title">{{ selectedGroupName || '积分统计' }}</text>
        </view>
        <view class="hero-icon">
          <u-icon name="grid-fill" size="30" color="#F2D98F"></u-icon>
        </view>
      </view>
    </view>

    <!-- 筛选区 -->
    <view class="qs-glass filter-card">
      <view class="qs-picker-row" @click="showGroupPicker = true">
        <text class="qs-picker-label">选择群组</text>
        <view class="picker-value-wrap">
          <text class="qs-picker-value">{{ selectedGroupName || '请选择群组' }}</text>
          <u-icon name="arrow-right" color="#8AA79B" size="14"></u-icon>
        </view>
      </view>

      <view class="qs-segment">
        <text class="qs-segment-item" :class="{ active: dimension === 'year' }" @click="switchDimension('year')">年度</text>
        <text class="qs-segment-item" :class="{ active: dimension === 'month' }" @click="switchDimension('month')">月度</text>
        <text class="qs-segment-item" :class="{ active: dimension === 'person' }" @click="switchDimension('person')">个人</text>
      </view>

      <view class="filter-grid">
        <view class="mini-picker" @click="showYearPicker = true">
          <text class="mini-label">年份</text>
          <text class="mini-value">{{ selectedYear ? selectedYear + '年' : '--' }}</text>
        </view>
        <view v-if="dimension === 'month' || (dimension === 'person' && personPeriod === 'month')" class="mini-picker" @click="showMonthPicker = true">
          <text class="mini-label">月份</text>
          <text class="mini-value">{{ Number(selectedMonth) }}月</text>
        </view>
        <view v-if="dimension === 'person'" class="mini-picker" @click="showPersonPicker = true">
          <text class="mini-label">成员</text>
          <text class="mini-value">{{ selectedPerson || '--' }}</text>
        </view>
      </view>

      <view v-if="dimension === 'person'" class="qs-segment person-period">
        <text class="qs-segment-item" :class="{ active: personPeriod === 'year' }" @click="switchPersonPeriod('year')">按年</text>
        <text class="qs-segment-item" :class="{ active: personPeriod === 'month' }" @click="switchPersonPeriod('month')">按月</text>
      </view>
    </view>

    <u-picker :show="showGroupPicker" :columns="groupColumns" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onGroupConfirm" @cancel="showGroupPicker = false"></u-picker>
    <u-picker :show="showYearPicker" :columns="yearColumns" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onYearConfirm" @cancel="showYearPicker = false"></u-picker>
    <u-picker :show="showMonthPicker" :columns="monthColumns" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onMonthConfirm" @cancel="showMonthPicker = false"></u-picker>
    <u-picker :show="showPersonPicker" :columns="personColumns" confirmColor="#E9C46A" cancelColor="#8AA79B" @confirm="onPersonConfirm" @cancel="showPersonPicker = false"></u-picker>

    <!-- 汇总 -->
    <view class="summary-row">
      <view class="summary-card qs-glass">
        <text class="summary-value" :class="summary.total >= 0 ? 'qs-gold' : 'qs-danger'">{{ summary.total >= 0 ? '+' : '' }}{{ summary.total }}</text>
        <text class="summary-label">总积分</text>
      </view>
      <view class="summary-card qs-glass">
        <text class="summary-value qs-jade">{{ summary.sessions }}</text>
        <text class="summary-label">参与场次</text>
      </view>
      <view class="summary-card qs-glass">
        <text class="summary-value">{{ summary.participants }}</text>
        <text class="summary-label">参与人数</text>
      </view>
    </view>

    <!-- 折线图 -->
    <view class="qs-glass chart-card">
      <view class="chart-head">
        <text class="qs-section-title">{{ chartTitle }}</text>
        <text class="qs-sub chart-hint">{{ chartHint }}</text>
      </view>
      <view class="chart-box" v-if="lineChartData.series.length > 0">
        <qiun-data-charts
          type="line"
          :canvas2d="true"
          :animation="false"
          :ontap="true"
          :tapLegend="false"
          :inScrollView="true"
          :tooltipShow="true"
          :chartData="lineChartData"
          :opts="lineChartOpts"
          :reshow="chartReshow"
          background="transparent"
        ></qiun-data-charts>
      </view>
      <view v-else class="qs-empty">
        <u-icon name="file-text" size="42" color="#4C6B5C"></u-icon>
        <text style="margin-top: 14rpx;">当前范围暂无数据</text>
      </view>
    </view>

    <!-- 排行（年/月维度） -->
    <view v-if="dimension !== 'person'" class="qs-glass rank-card">
      <view class="chart-head">
        <text class="qs-section-title">{{ dimension === 'year' ? '年度排行' : '月度排行' }}</text>
        <text class="qs-sub chart-hint">0 分不计入参与</text>
      </view>
      <view class="rank-table" v-if="ranking.length > 0">
        <view class="rank-head">
          <text class="cell rank-no">名次</text>
          <text class="cell name">姓名</text>
          <text class="cell num">场次</text>
          <text class="cell num">场均</text>
          <text class="cell total">总分</text>
        </view>
        <view v-for="item in ranking" :key="item.name" class="rank-row">
          <view class="cell rank-no">
            <text class="rank-badge" :class="'top' + (item.rank <= 3 ? item.rank : 0)">{{ item.rank }}</text>
          </view>
          <text class="cell name qs-text">{{ item.name }}</text>
          <text class="cell num qs-sub">{{ item.sessions }}</text>
          <text class="cell num qs-sub">{{ item.avg }}</text>
          <text class="cell total" :class="item.total >= 0 ? 'qs-jade' : 'qs-danger'">{{ item.total >= 0 ? '+' : '' }}{{ item.total }}</text>
        </view>
      </view>
      <view v-else class="qs-empty">暂无排行数据</view>
    </view>

    <!-- 个人分析 -->
    <view v-if="dimension === 'person' && personalStats" class="qs-glass analysis-card">
      <view class="chart-head">
        <text class="qs-section-title">个人数据分析</text>
        <text class="qs-sub chart-hint">0 分视为未参与</text>
      </view>
      <view class="analysis-grid">
        <view class="analysis-item">
          <text class="analysis-value" :class="personalStats.winRate >= 50 ? 'qs-jade' : 'qs-danger'">{{ personalStats.winRate }}%</text>
          <text class="analysis-label">胜率</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value" :class="personalStats.avgScore >= 0 ? 'qs-jade' : 'qs-danger'">{{ personalStats.avgScore >= 0 ? '+' : '' }}{{ personalStats.avgScore }}</text>
          <text class="analysis-label">场均积分</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value qs-gold">{{ personalStats.maxStreak }}次</text>
          <text class="analysis-label">最高连胜</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value qs-jade">+{{ personalStats.bestSession }}</text>
          <text class="analysis-label">最佳场次</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value qs-danger">{{ personalStats.worstSession }}</text>
          <text class="analysis-label">最差场次</text>
        </view>
      </view>
      <view class="radar-box" v-if="radarChartData.series.length > 0">
        <qiun-data-charts
          type="radar"
          :canvas2d="true"
          :chartData="radarChartData"
          :opts="radarChartOpts"
          :key="'radar-' + radarChartKey"
          background="transparent"
        ></qiun-data-charts>
      </view>
    </view>
  </view>
</template>

<script>
import dayjs from 'dayjs'
import qiunDataCharts from '../qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue'
import { ensureLogin, queryDocs, queryScores } from '@/utils/cloudbase'

const LINE_COLORS = ['#34D399', '#E9C46A', '#60A5FA', '#F472B6', '#A78BFA', '#FB923C', '#22D3EE', '#F87171', '#A3E635', '#E879F9']

export default {
  components: {
    qiunDataCharts
  },
  data() {
    return {
      groupList: [],
      selectedGroup: '',
      selectedGroupName: '',
      showGroupPicker: false,
      groupColumns: [[]],

      dimension: 'year',
      personPeriod: 'year',

      yearList: [],
      selectedYear: '',
      showYearPicker: false,
      yearColumns: [[]],

      selectedMonth: '01',
      showMonthPicker: false,

      memberList: [],
      selectedPerson: '',
      showPersonPicker: false,
      personColumns: [[]],

      allScores: [],
      summary: { total: 0, sessions: 0, participants: 0 },
      ranking: [],

      lineChartData: { categories: [], series: [] },
      chartReshow: false,
      lineChartOpts: {
        color: LINE_COLORS,
        padding: [30, 16, 0, 8],
        legend: { show: true, position: 'top', float: 'center', margin: 6, itemGap: 10, fontSize: 10, fontColor: '#C9DED3' },
        xAxis: { disableGrid: true, fontSize: 10, fontColor: '#8AA79B' },
        yAxis: { gridType: 'dash', gridColor: '#1C3A2D', dashLength: 4, fontSize: 10, fontColor: '#8AA79B' },
        // 注意：不要在这里放 tooltip 对象，uCharts 会因 tooltip.group 缺失抛出异常并中断后续系列绘制
        extra: {
          line: { type: 'curve', width: 2, activeType: 'hollow' },
          tooltip: {
            showBox: true,
            bgColor: '#0B221A',
            bgOpacity: 0.94,
            bgColor2: '#0B221A',
            linearType: 'custom',
            borderWidth: 1,
            borderColor: 'rgba(233,196,106,0.6)',
            borderRadius: 8,
            fontColor: '#F4FBF7',
            fontSize: 12
          }
        }
      },

      personalStats: null,
      radarChartData: { categories: [], series: [] },
      radarChartKey: 0,
      radarChartOpts: {
        padding: [5, 5, 5, 5],
        legend: { show: false },
        extra: {
          radar: {
            gridType: 'radar',
            gridColor: '#244538',
            gridCount: 4,
            opacity: 0.25,
            max: 100,
            labelColor: '#C9DED3'
          }
        }
      }
    }
  },
  computed: {
    monthColumns() {
      return [[...Array(12)].map((_, i) => ({ text: `${i + 1}月`, value: String(i + 1).padStart(2, '0') }))]
    },
    chartTitle() {
      if (this.dimension === 'person') {
        return this.personPeriod === 'month'
          ? `${this.selectedPerson} · ${Number(this.selectedMonth)}月每日`
          : `${this.selectedPerson} · ${this.selectedYear}年每月`
      }
      if (this.dimension === 'month') {
        return `${this.selectedYear}年${Number(this.selectedMonth)}月每日走势`
      }
      return `${this.selectedYear}年每月走势`
    },
    chartHint() {
      return this.dimension === 'person' ? '单条折线 · 0 分视为未参与' : '前 6 名每人一条折线 · 点击查看数值'
    }
  },
  onLoad() {
    this.initData()
  },
  methods: {
    async initData() {
      uni.showLoading({ title: '加载中...', mask: true })
      try {
        await this.loadGroups()
        await this.loadScores()
      } finally {
        uni.hideLoading()
      }
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
        this.groupColumns = [groups.map((g) => ({ text: g.groupName, value: g._id || g.id }))]

        if (groups.length > 0) {
          this.selectedGroup = groups[0]._id || groups[0].id
          this.selectedGroupName = groups[0].groupName
        }
      } catch (err) {
        console.error('加载群组失败:', err)
      }
    },

    async loadScores() {
      if (!this.selectedGroup) {
        this.allScores = []
        this.lineChartData = { categories: [], series: [] }
        return
      }
      try {
        await ensureLogin()
        this.allScores = await queryScores({ groupIds: [this.selectedGroup] })
        this.syncFilters()
        this.refresh()
      } catch (err) {
        console.error('加载积分失败:', err)
        this.allScores = []
      }
    },

    syncFilters() {
      const years = new Set()
      const names = new Set()
      this.allScores.forEach((record) => {
        if (record.date) years.add(record.date.slice(0, 4))
        ;(record.users || []).forEach((u) => {
          if ((parseInt(u.score) || 0) !== 0) names.add(u.name)
        })
      })

      this.yearList = Array.from(years).sort()
      const currentYear = dayjs().format('YYYY')
      if (this.yearList.length === 0) this.yearList = [currentYear]
      if (!this.yearList.includes(this.selectedYear)) {
        this.selectedYear = this.yearList[this.yearList.length - 1]
      }
      this.yearColumns = [this.yearList.map((y) => ({ text: y + '年', value: y }))]

      this.memberList = Array.from(names).sort()
      this.personColumns = [this.memberList.map((n) => ({ text: n, value: n }))]
      if (!this.memberList.includes(this.selectedPerson)) {
        this.selectedPerson = this.memberList[0] || ''
      }

      this.syncMonth(true)
    },

    syncMonth(force) {
      const monthsInYear = new Set()
      this.allScores.forEach((record) => {
        if (record.date && record.date.slice(0, 4) === this.selectedYear) {
          monthsInYear.add(record.date.slice(5, 7))
        }
      })
      const months = Array.from(monthsInYear).sort()
      if (months.length > 0) {
        if (force || !months.includes(this.selectedMonth)) {
          this.selectedMonth = months[months.length - 1]
        }
      } else if (force) {
        this.selectedMonth = this.selectedYear === dayjs().format('YYYY') ? dayjs().format('MM') : '01'
      }
    },

    switchDimension(dimension) {
      if (this.dimension === dimension) return
      this.dimension = dimension
      if (dimension === 'month') {
        this.syncMonth(false)
      }
      this.refresh()
    },

    switchPersonPeriod(period) {
      if (this.personPeriod === period) return
      this.personPeriod = period
      if (period === 'month') this.syncMonth(false)
      this.refresh()
    },

    async onGroupConfirm(e) {
      const item = e.value[0]
      this.selectedGroup = item.value
      this.selectedGroupName = item.text
      this.showGroupPicker = false
      this.selectedYear = ''
      this.selectedPerson = ''
      await this.loadScores()
    },

    onYearConfirm(e) {
      this.selectedYear = e.value[0].value
      this.showYearPicker = false
      this.syncMonth(true)
      this.refresh()
    },

    onMonthConfirm(e) {
      this.selectedMonth = e.value[0].value
      this.showMonthPicker = false
      this.refresh()
    },

    onPersonConfirm(e) {
      this.selectedPerson = e.value[0].value
      this.showPersonPicker = false
      this.refresh()
    },

    getPeriodPrefix() {
      if (this.dimension === 'year') return this.selectedYear
      if (this.dimension === 'month') return `${this.selectedYear}-${this.selectedMonth}`
      if (this.personPeriod === 'year') return this.selectedYear
      return `${this.selectedYear}-${this.selectedMonth}`
    },

    getPeriodRecords() {
      const prefix = this.getPeriodPrefix()
      return this.allScores.filter((r) => r.date && r.date.startsWith(prefix))
    },

    refresh() {
      if (this.dimension === 'person') {
        this.buildPerson()
      } else {
        this.buildGroup()
      }
    },

    // 数据渲染后触发一次重绘，避免首次进入时画布空白（需交互后才显示）
    triggerChartRefresh() {
      this.chartReshow = false
      this.$nextTick(() => {
        setTimeout(() => {
          this.chartReshow = true
        }, 60)
      })
    },

    buildGroup() {
      const isYear = this.dimension === 'year'
      const records = this.getPeriodRecords()

      const stats = {}
      let sessionCount = 0

      records.forEach((record) => {
        let hasParticipant = false
        ;(record.users || []).forEach((u) => {
          const score = parseInt(u.score) || 0
          if (score === 0) return
          hasParticipant = true
          if (!stats[u.name]) stats[u.name] = { total: 0, sessions: 0 }
          stats[u.name].total += score
          stats[u.name].sessions += 1
        })
        if (hasParticipant) sessionCount++
      })

      const members = Object.keys(stats)
        .map((name) => ({
          name,
          total: stats[name].total,
          sessions: stats[name].sessions,
          avg: stats[name].sessions ? Math.round(stats[name].total / stats[name].sessions) : 0
        }))
        .sort((a, b) => b.total - a.total)

      this.ranking = members.map((m, index) => ({ ...m, rank: index + 1 }))
      this.summary = {
        total: members.reduce((sum, m) => sum + m.total, 0),
        sessions: sessionCount,
        participants: members.length
      }

      const categories = this.buildCategories(isYear)
      const topMembers = members.slice(0, 6)
      const series = topMembers.map((m, index) => ({
        name: m.name,
        color: LINE_COLORS[index % LINE_COLORS.length],
        data: this.buildSeriesData(records, m.name, isYear)
      }))

      this.lineChartData = { categories, series }
      this.triggerChartRefresh()
    },

    buildCategories(isYear) {
      if (isYear) {
        return [...Array(12)].map((_, i) => `${i + 1}月`)
      }
      const days = dayjs(`${this.selectedYear}-${this.selectedMonth}-01`).daysInMonth()
      return [...Array(days)].map((_, i) => String(i + 1))
    },

    buildSeriesData(records, name, isYear) {
      const bucketCount = isYear ? 12 : dayjs(`${this.selectedYear}-${this.selectedMonth}-01`).daysInMonth()
      const buckets = [...Array(bucketCount)].fill(0)
      records.forEach((record) => {
        if (!record.date) return
        const entry = (record.users || []).find((u) => u.name === name)
        if (!entry) return
        const score = parseInt(entry.score) || 0
        if (score === 0) return
        const index = isYear
          ? parseInt(record.date.slice(5, 7)) - 1
          : parseInt(record.date.slice(8, 10)) - 1
        if (index >= 0 && index < bucketCount) buckets[index] += score
      })
      return buckets
    },

    buildPerson() {
      const name = this.selectedPerson
      const isYear = this.personPeriod === 'year'
      const records = this.getPeriodRecords()

      const myRecords = []
      records.forEach((record) => {
        const entry = (record.users || []).find((u) => u.name === name)
        if (!entry) return
        const score = parseInt(entry.score) || 0
        if (score === 0) return
        myRecords.push({
          date: record.date,
          score,
          time: record.createTime ? dayjs(record.createTime).valueOf() : 0
        })
      })
      myRecords.sort((a, b) => (a.date === b.date ? a.time - b.time : (a.date < b.date ? -1 : 1)))

      if (!name || myRecords.length === 0) {
        this.personalStats = null
        this.radarChartData = { categories: [], series: [] }
        this.radarChartKey++
        this.lineChartData = { categories: [], series: [] }
        this.summary = { total: 0, sessions: 0, participants: 1 }
        return
      }

      const totalScore = myRecords.reduce((sum, r) => sum + r.score, 0)
      const sessions = myRecords.length
      const winCount = myRecords.filter((r) => r.score > 0).length
      const winRate = Math.round((winCount / sessions) * 100)
      const avgScore = Math.round(totalScore / sessions)

      let maxStreak = 0
      let currentStreak = 0
      myRecords.forEach((r) => {
        if (r.score > 0) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          currentStreak = 0
        }
      })

      const bestSession = Math.max(...myRecords.map((r) => r.score))
      const worstSession = Math.min(...myRecords.map((r) => r.score))

      this.personalStats = { winRate, avgScore, maxStreak, bestSession, worstSession }
      this.summary = { total: totalScore, sessions, participants: 1 }

      const categories = this.buildCategories(isYear)
      this.lineChartData = {
        categories,
        series: [{ name, data: this.buildSeriesData(records, name, isYear) }]
      }
      this.triggerChartRefresh()

      const mean = avgScore
      const variance = myRecords.reduce((sum, r) => sum + Math.pow(r.score - mean, 2), 0) / sessions
      const stdDev = Math.sqrt(variance)
      const stability = mean !== 0 ? Math.max(0, Math.min(100, Math.round((1 - stdDev / Math.abs(mean)) * 100))) : 50

      this.radarChartData = {
        categories: ['胜率', '场均', '连胜', '最佳', '稳定度'],
        series: [
          {
            name,
            data: [
              winRate,
              Math.min(100, Math.max(0, (avgScore + 100) / 2)),
              Math.min(100, maxStreak * 20),
              Math.min(100, Math.max(0, bestSession)),
              stability
            ]
          }
        ]
      }
      this.radarChartKey++
    }
  }
}
</script>

<style scoped>
.stats-page {
  padding-top: 28rpx;
  padding-bottom: 40rpx;
}

.stats-hero {
  padding: 34rpx 32rpx;
  margin-bottom: 24rpx;
}

.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}

.hero-kicker {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.68);
  letter-spacing: 2rpx;
  margin-bottom: 8rpx;
}

.hero-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #fff9e8;
}

.hero-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 26rpx;
  background: rgba(0, 0, 0, 0.18);
  border: 1rpx solid rgba(233, 196, 106, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-card {
  padding: 22rpx 22rpx 26rpx;
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

.person-period {
  margin-top: 18rpx;
}

.summary-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 22rpx;
}

.summary-card {
  flex: 1;
  padding: 24rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-value {
  font-size: 40rpx;
  font-weight: 800;
  color: #f4fbf7;
  line-height: 1.2;
}

.summary-label {
  font-size: 21rpx;
  color: #8aa79b;
  margin-top: 8rpx;
}

.chart-card {
  padding: 26rpx 20rpx 22rpx;
  margin-bottom: 22rpx;
}

.chart-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 8rpx 10rpx;
}

.chart-hint {
  font-size: 21rpx;
}

.chart-box {
  width: 100%;
  height: 360px;
}

.rank-card {
  padding: 26rpx 22rpx;
}

.rank-table {
  margin-top: 8rpx;
}

.rank-head,
.rank-row {
  display: flex;
  align-items: center;
  padding: 18rpx 0;
}

.rank-head {
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
  padding-top: 6rpx;
  padding-bottom: 14rpx;
}

.rank-row {
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.rank-row:last-child {
  border-bottom: none;
}

.cell {
  font-size: 25rpx;
}

.cell.rank-no {
  width: 86rpx;
  display: flex;
  align-items: center;
}

.cell.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell.num {
  width: 100rpx;
  text-align: center;
}

.cell.total {
  width: 120rpx;
  text-align: right;
  font-weight: 700;
  color: #f4fbf7;
}

.rank-head .cell {
  font-size: 21rpx;
  color: #7E9C8E;
}

.rank-badge {
  width: 46rpx;
  height: 46rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: #b8ccc2;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-badge.top1 {
  background: linear-gradient(135deg, #f6d365, #fda085);
  color: #2a1c00;
}

.rank-badge.top2 {
  background: linear-gradient(135deg, #d7e1e8, #aebac4);
  color: #1d262c;
}

.rank-badge.top3 {
  background: linear-gradient(135deg, #d9a066, #b9723c);
  color: #2a1600;
}

.analysis-card {
  padding: 26rpx 22rpx;
  margin-top: 22rpx;
}

.analysis-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 10rpx;
}

.analysis-item {
  width: calc(33.33% - 10rpx);
  padding: 20rpx 8rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.045);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
  text-align: center;
  box-sizing: border-box;
}

.analysis-value {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #f4fbf7;
  margin-bottom: 6rpx;
}

.analysis-label {
  font-size: 21rpx;
  color: #8aa79b;
}

.radar-box {
  width: 100%;
  height: 320px;
  margin-top: 12rpx;
}
</style>
