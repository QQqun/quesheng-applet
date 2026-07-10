<template>
  <view class="page-container">
    <view class="section">
      <view class="form-item">
        <text class="label">选择群组</text>
        <view class="picker-display" @click="showGroupPicker = true">
          <text class="picker-text">{{ selectedGroupName || '请选择群组' }}</text>
          <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>

      <view class="form-item">
        <text class="label">选择年份</text>
        <view class="picker-display" @click="showYearPicker = true">
          <text class="picker-text">{{ selectedYear === 'all' ? '全部' : (selectedYear ? selectedYear + '年' : '请选择年份') }}</text>
          <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>

      <view class="form-item" v-if="selectedYear !== 'all'">
        <text class="label">选择月份</text>
        <view class="picker-display" @click="showMonthPicker = true">
          <text class="picker-text">{{ selectedMonthName || '请选择月份' }}</text>
          <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>
    </view>

    <u-picker :show="showGroupPicker" :columns="groupColumns" @confirm="onGroupConfirm" @cancel="showGroupPicker = false"></u-picker>
    <u-picker :show="showYearPicker" :columns="yearColumns" @confirm="onYearConfirm" @cancel="showYearPicker = false"></u-picker>
    <u-picker :show="showMonthPicker" :columns="monthColumns" @confirm="onMonthConfirm" @cancel="showMonthPicker = false"></u-picker>

    <view class="section" v-if="timeType === 1">
      <view class="section-header">
        <text class="section-title">年积分统计</text>
      </view>
      <view class="year-stats">
        <view v-for="(stat, index) in yearStats" :key="index" class="year-stat-item">
          <text class="stat-name">{{ stat.name }}</text>
          <text class="stat-value" :class="stat.totalScore >= 0 ? 'positive' : 'negative'">{{ stat.totalScore >= 0 ? '+' : '' }}{{ stat.totalScore }}</text>
        </view>
      </view>
    </view>

    <view class="section" v-if="periodStats.length > 0">
      <view class="section-header">
        <text class="section-title">{{ selectedYear === 'all' ? '全部积分统计' : '当前时间段统计' }}</text>
      </view>
      <view class="stats-table">
        <view class="table-header">
          <text class="table-cell">姓名</text>
          <text class="table-cell">总分</text>
        </view>
        <view class="table-row" v-for="(stat, index) in periodStats" :key="index">
          <text class="table-cell">{{ stat.name }}</text>
          <text class="table-cell" :class="stat.total >= 0 ? 'positive' : 'negative'">{{ stat.total >= 0 ? '+' : '' }}{{ stat.total }}</text>
        </view>
      </view>
    </view>

    <!-- 个人数据分析 -->
    <view class="section" v-if="personalStats">
      <view class="section-header">
        <text class="section-title">个人数据分析</text>
      </view>
      <view class="analysis-grid">
        <view class="analysis-item">
          <text class="analysis-value" :class="personalStats.winRate >= 50 ? 'positive' : 'negative'">{{ personalStats.winRate }}%</text>
          <text class="analysis-label">胜率</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value" :class="personalStats.avgScore >= 0 ? 'positive' : 'negative'">{{ personalStats.avgScore >= 0 ? '+' : '' }}{{ personalStats.avgScore }}</text>
          <text class="analysis-label">场均积分</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value positive">{{ personalStats.maxStreak }}次</text>
          <text class="analysis-label">最高连胜</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value positive">+{{ personalStats.bestSession }}</text>
          <text class="analysis-label">最佳场次</text>
        </view>
        <view class="analysis-item">
          <text class="analysis-value negative">{{ personalStats.worstSession }}</text>
          <text class="analysis-label">最差场次</text>
        </view>
      </view>
      <view class="chart-container" v-show="radarChartData.series.length > 0" style="height: 300px;">
        <qiun-data-charts type="radar" :canvas2d="true" :chartData="radarChartData" :opts="radarChartOpts" :key="radarChartKey"></qiun-data-charts>
      </view>
    </view>

    <!-- 分享按钮（已隐藏） -->
    <view class="share-section" v-if="false">
      <u-button text="分享统计" type="primary" color="#22C55E" @click="handleShare" icon="share-square"></u-button>
    </view>

    <!-- 分享 Canvas 和预览弹窗（已隐藏） -->
    <view class="share-canvas-wrapper" v-if="false">
      <canvas id="shareCanvas" type="2d" :style="{ width: '750rpx', height: '1200rpx' }"></canvas>
    </view>

    <u-popup :show="false" mode="center" :round="16" @close="showSharePreview = false" :safeAreaInsetBottom="false">
      <view class="share-preview">
        <image :src="shareImagePath" mode="widthFix" class="share-image"></image>
        <view class="share-actions">
          <u-button text="保存到相册" type="primary" color="#22C55E" @click="handleSaveImage"></u-button>
          <u-button text="关闭" @click="showSharePreview = false"></u-button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import qiunDataCharts from '../qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';
import { ensureLogin, queryDocs, queryAllDocs, db } from '@/utils/cloudbase'
import { drawShareCard, saveToAlbum } from '@/utils/shareCard'

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
      groupColumns: [{value: '2026-01', label: '2026年1月'}],

      timeType: 0,
      yearList: [],
      showYearPicker: false,
      yearColumns: [[]],
      monthList: [
        { value: '', label: '全部' },
        { value: '01', label: '1月' },
        { value: '02', label: '2月' },
        { value: '03', label: '3月' },
        { value: '04', label: '4月' },
        { value: '05', label: '5月' },
        { value: '06', label: '6月' },
        { value: '07', label: '7月' },
        { value: '08', label: '8月' },
        { value: '09', label: '9月' },
        { value: '10', label: '10月' },
        { value: '11', label: '11月' },
        { value: '12', label: '12月' }
      ],
      selectedYear: 'all',
      selectedMonth: '',
      selectedMonthName: '全部',
      showMonthPicker: false,
      monthColumns: [[]],

      yearStats: [],
      periodStats: [],
      currentScores: [],

      // 个人分析
      personalStats: null,
      radarChartData: { categories: [], series: [] },
      radarChartKey: 0,
      radarChartOpts: {
        padding: [5, 5, 5, 5],
        extra: {
          radar: {
            gridType: 'radar',
            gridColor: '#e5e7eb',
            gridCount: 4,
            opacity: 0.2,
            max: 100
          }
        },
        legend: { show: false }
      },

      // 分享
      showShareCanvas: false,
      showSharePreview: false,
      shareImagePath: ''
    }
  },
  onLoad() {
    this.initData();
  },
  // onShareAppMessage() {
  //   return {
  //     title: '雀圣积分统计',
  //     path: '/pages/index/index'
  //   }
  // },
  methods: {
    async initData() {
      this.loadMonthColumns();
      await this.loadGroups();
      await this.loadYears();
      this.loadStatistics();
    },

    async loadGroups() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const userPhone = userInfo.phone || ''
        const userName = userInfo.nickName || userPhone
        
        let cachedData = []
        if (userPhone) {
          cachedData = await queryDocs('groups', { members: userPhone })
        }
        if (cachedData.length === 0 && userName) {
          const legacyData = await queryDocs('groups', { members: userName })
          cachedData = cachedData.concat(legacyData)
        }
        const seen = new Set()
        cachedData = cachedData.filter(g => {
          const key = g._id || g.id
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        this.groupList = cachedData.map(item => ({
          label: item.groupName,
          value: item._id || item.id
        }));

        this.groupColumns = [this.groupList.map(item => ({
          text: item.label,
          value: item.value
        }))]

        if (this.groupList.length > 0) {
          this.selectedGroup = this.groupList[0].value;
          this.selectedGroupName = this.groupList[0].label;
        }
      } catch (err) {
        console.error('加载群组失败:', err)
      }
    },

    async loadYears() {
      try {
        const groupIds = this.groupList.map(g => g.value)
        if (groupIds.length === 0) return
        const _ = db.command
        const scores = await queryAllDocs('scores', {
          groupId: _.in(groupIds)
        })
        const years = new Set();

        scores.forEach(item => {
          if (item.date) {
            const year = item.date.split('-')[0];
            years.add(year);
          }
        });

        this.yearList = [
          { value: 'all', label: '全部' },
          ...Array.from(years).sort().map(year => ({
            value: year,
            label: year + '年'
          }))
        ];

        this.yearColumns = [this.yearList.map(item => ({
          text: item.label,
          value: item.value
        }))];

        this.selectedYear = 'all';
        this.selectedMonth = "";
      } catch (err) {
        console.error('加载年份失败:', err)
      }
    },

    loadMonthColumns() {
      this.monthColumns = [this.monthList.map(item => ({
        text: item.label,
        value: item.value
      }))];
    },

    async onGroupConfirm(e) {
      this.selectedGroupName = e.value[0].text;
      this.selectedGroup = e.value[0].value;
      await this.loadYears();
      this.loadStatistics();
      this.showGroupPicker = false;
    },

    onYearConfirm(e) {
      this.selectedYear = e.value[0].value;
      if (this.selectedYear === 'all') {
        this.selectedMonth = '';
        this.selectedMonthName = '全部';
      }
      this.loadStatistics();
      this.showYearPicker = false;
    },

    onMonthConfirm(e) {
      this.selectedMonth = e.value[0].value;
      this.selectedMonthName = e.value[0].text;
      this.loadStatistics();
      this.showMonthPicker = false;
    },

    async loadStatistics() {
      if (!this.selectedGroup) return;

      try {
        const scores = await queryDocs('scores', {
          groupId: this.selectedGroup
        })

        if (!scores || scores.length === 0) {
          this.yearStats = [];
          this.periodStats = [];
          this.personalStats = null;
          this.radarChartData = { categories: [], series: [] };
          this.radarChartKey++;
          return;
        };

        this.currentScores = scores;

        let filteredScores = scores;
        if (this.selectedYear === 'all') {
          this.calculateAllStats(scores);
        } else if (this.selectedYear && !this.selectedMonth) {
          filteredScores = scores.filter(item => item.date && item.date.startsWith(this.selectedYear));
          this.calculateYearStats(scores);
        } else if (this.selectedYear && this.selectedMonth) {
          filteredScores = scores.filter(item => item.date && item.date.startsWith(this.selectedYear + '-' + this.selectedMonth));
          this.calculateMonthStats(scores);
        }

        this.calculatePersonalAnalysis(filteredScores);
      } catch (err) {
        console.error('加载统计失败:', err)
      }
    },

    calculateAllStats(data) {
      const userStats = {};
      data.forEach(item => {
        if (item.users) {
          item.users.forEach(user => {
            if (!userStats[user.name]) {
              userStats[user.name] = 0;
            }
            userStats[user.name] += Number(user.score) || 0;
          });
        }
      });

      this.yearStats = [];
      this.periodStats = Object.keys(userStats).map(name => ({
        name,
        total: userStats[name]
      }));
    },

    calculateYearStats(data) {
      const year = this.selectedYear;
      const yearData = data.filter(item => item.date && item.date.startsWith(year));

      const userStats = {};
      yearData.forEach(item => {
        if (item.users) {
          item.users.forEach(user => {
            if (!userStats[user.name]) {
              userStats[user.name] = 0;
            }
            userStats[user.name] += Number(user.score) || 0;
          });
        }
      });

      this.yearStats = Object.keys(userStats).map(name => ({
        name,
        totalScore: userStats[name]
      }));

      this.periodStats = Object.keys(userStats).map(name => ({
        name,
        total: userStats[name]
      }));
    },

    calculateMonthStats(data) {
      const month = this.selectedMonth;
      const date = this.selectedYear + '-' + month;
      const monthData = data.filter(item => item.date && item.date.startsWith(date));

      const userStats = {};
      monthData.forEach(item => {
        if (item.users) {
          item.users.forEach(user => {
            if (!userStats[user.name]) {
              userStats[user.name] = 0;
            }
            userStats[user.name] += Number(user.score) || 0;
          });
        }
      });

      this.periodStats = Object.keys(userStats).map(name => ({
        name,
        total: userStats[name]
      }));
    },

    calculatePersonalAnalysis(scores) {
      const userInfo = uni.getStorageSync('userInfo');
      const userName = userInfo.nickName || userInfo.phone || '';

      const myRecords = [];
      (scores || []).forEach(record => {
        const userEntry = (record.users || []).find(u => u.name === userName);
        if (userEntry) {
          myRecords.push({
            date: record.date,
            score: Number(userEntry.score) || 0,
            groupId: record.groupId
          });
        }
      });

      if (myRecords.length === 0) {
        this.personalStats = null;
        this.radarChartData = { categories: [], series: [] };
        this.radarChartKey++;
        return;
      }

      const winCount = myRecords.filter(r => r.score > 0).length;
      const winRate = myRecords.length > 0 ? Math.round(winCount / myRecords.length * 100) : 0;

      const totalScore = myRecords.reduce((sum, r) => sum + r.score, 0);
      const avgScore = myRecords.length > 0 ? Math.round(totalScore / myRecords.length) : 0;

      let maxStreak = 0, currentStreak = 0;
      myRecords.forEach(r => {
        if (r.score > 0) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak) }
        else { currentStreak = 0 }
      });

      const bestSession = Math.max(...myRecords.map(r => r.score));
      const worstSession = Math.min(...myRecords.map(r => r.score));

      this.personalStats = { winRate, avgScore, maxStreak, bestSession, worstSession };

      // 雷达图数据归一化
      const mean = avgScore;
      const variance = myRecords.length > 0
        ? myRecords.reduce((sum, r) => sum + Math.pow(r.score - mean, 2), 0) / myRecords.length
        : 0;
      const stdDev = Math.sqrt(variance);
      const stability = mean !== 0 ? Math.max(0, Math.min(100, Math.round((1 - stdDev / Math.abs(mean)) * 100))) : 50;

      this.radarChartData = {
        categories: ['胜率', '场均', '连胜', '最佳', '稳定度'],
        series: [{
          name: userName,
          data: [
            winRate,
            Math.min(100, Math.max(0, (avgScore + 100) / 2)),
            Math.min(100, maxStreak * 20),
            Math.min(100, Math.max(0, bestSession)),
            stability
          ]
        }]
      };
      this.radarChartKey++;
    },

    async handleShare() {
      this.showShareCanvas = true;
      await this.$nextTick();
      setTimeout(async () => {
        try {
          const dataList = this.periodStats
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
            .map((s, i) => ({
              name: s.name,
              score: s.total,
              rank: i + 1
            }));
          const tempFilePath = await drawShareCard({
            canvasId: 'shareCanvas',
            title: this.selectedGroupName + ' - 积分统计',
            subtitle: this.selectedYear === 'all' ? '全部' : this.selectedYear + '年' + (this.selectedMonthName || ''),
            dataList
          });
          this.shareImagePath = tempFilePath;
          this.showSharePreview = true;
        } catch (err) {
          console.error('生成分享卡失败:', err);
          uni.showToast({ title: '生成失败', icon: 'none' });
        }
      }, 500);
    },

    async handleSaveImage() {
      try {
        await saveToAlbum(this.shareImagePath);
        uni.showToast({ title: '已保存到相册', icon: 'success' });
        this.showSharePreview = false;
        this.showShareCanvas = false;
      } catch (err) {
        console.error('保存失败:', err);
        uni.showToast({ title: '保存失败，请授权相册权限', icon: 'none' });
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

.section {
  margin-top: 20px;
  background-color: white;
  padding: 20px;
  border-radius: 16px;
  margin: 20px 16px 0;
  box-sizing: border-box;
}

.section-header {
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
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

.year-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.year-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 12px;
}

.stat-name {
  font-size: 16px;
  color: #1f2937;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #22C55E;
}

.stat-value.positive {
  color: #22C55E;
}

.stat-value.negative {
  color: #ef4444;
}

.stats-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background-color: #f3f4f6;
  font-weight: bold;
}

.table-row {
  display: flex;
  border-top: 1px solid #e5e7eb;
}

.table-cell {
  flex: 1;
  padding: 12px;
  text-align: center;
  font-size: 14px;
  color: #1f2937;
}

.table-cell.positive {
  color: #22C55E;
  font-weight: bold;
}

.table-cell.negative {
  color: #ef4444;
  font-weight: bold;
}

.empty-text {
  color: #9ca3af;
  font-size: 14px;
}

/* 个人分析 */
.analysis-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.analysis-item {
  flex: 1;
  min-width: 80px;
  background-color: #f9fafb;
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  box-sizing: border-box;
}

.analysis-value {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  display: block;
  margin-bottom: 4px;
}

.analysis-value.positive {
  color: #22C55E;
}

.analysis-value.negative {
  color: #ef4444;
}

.analysis-label {
  font-size: 12px;
  color: #9ca3af;
}

/* 分享 */
.share-section {
  margin: 20px 16px;
}

.share-canvas-wrapper {
  position: fixed;
  left: -9999px;
  top: -9999px;
}

.share-preview {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  width: 340px;
  box-sizing: border-box;
}

.share-image {
  width: 100%;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
}

.share-actions {
  display: flex;
  gap: 16rpx;
}

.share-actions u-button {
  flex: 1;
}
</style>
