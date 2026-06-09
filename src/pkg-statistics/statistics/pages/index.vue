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
          <text class="picker-text">{{ selectedYear || '请选择年份' }}</text>
          <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>
      
      <view class="form-item">
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
          <text class="stat-value">{{ stat.totalScore }}</text>
        </view>
      </view>
    </view>
    
    <view class="section" v-if="periodStats.length > 0">
      <view class="section-header">
        <text class="section-title">当前时间段统计</text>
      </view>
      <view class="stats-table">
        <view class="table-header">
          <text class="table-cell">姓名</text>
          <text class="table-cell">总分</text>
        </view>
        <view class="table-row" v-for="(stat, index) in periodStats" :key="index">
          <text class="table-cell">{{ stat.name }}</text>
          <text class="table-cell" :class="stat.total >= 0 ? 'positive' : 'negative'">{{ stat.total }}</text>
        </view>
      </view>
    </view>
    
    <view class="section">
      <view class="section-header">
        <text class="section-title">积分数据</text>
      </view>
      <view class="chart-container" v-show="chartData.series.length > 0">
        <qiun-data-charts type="column" :canvas2d="true" :chartData="chartData" :opts="chartOpts" :key="chartKey"></qiun-data-charts>
      </view>
      <view class="empty-chart" v-show="chartData.series.length === 0">
        <text class="empty-text">暂无数据</text>
      </view>
    </view>
  </view>
</template>

<script>
import qiunDataCharts from '../qiun-data-charts/components/qiun-data-charts/qiun-data-charts.vue';
import { ensureLogin, queryDocs } from '../../../utils/cloudbase'

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
      selectedYear: '',
      selectedMonth: '',
      selectedMonthName: '',
      showMonthPicker: false,
      monthColumns: [[]],
      
      yearStats: [],
      periodStats: [],
      chartKey: 0,
      chartData: {
        categories: [],
        series: []
      },
      chartOpts: {
        padding: [15, 15, 0, 15],
        enableDataLabel: false,
        dataLabel: 'value',
        xAxis: {
          disableGrid: true,
          labelCount: 5,
          rotateLabel: false,
          itemCount: 5,
          scrollShow: true,
          label: {
            show: true
          }
        },
        yAxis: {
          gridType: 'dash',
          dashLength: 4,
          splitNumber: 5,
          data: {
            min: -500,
            max: 500,
          },
          label: {
            show: true
          }
        },
        extra: {
          column: {
            type: 'group',
            width: 30,
            activeBgColor: '#000000',
            activeBgOpacity: 0.08,
            linearType: 'none'
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          float: 'center'
        }
      }
    }
  },
  onLoad() {
    this.initData();
  },
  methods: {
    async initData() {
      this.loadMonthColumns();
      await this.loadGroups();
      this.loadYears();
    },
    
    async loadGroups() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const cachedData = await queryDocs('groups', {
          creatorId: userInfo.username
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
          this.loadStatistics();
        }
      } catch (err) {
        console.error('加载群组失败:', err)
      }
    },
    
    async loadYears() {
      try {
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const scores = await queryDocs('scores', {
          creatorId: userInfo.username
        })
        const years = new Set();
        
        scores.forEach(item => {
          if (item.date) {
            const year = item.date.split('-')[0];
            years.add(year);
          }
        });
        
        this.yearList = Array.from(years).map(year => ({
          value: year,
          label: year + '年'
        }));
        
        this.yearColumns = [this.yearList.map(item => ({
          text: item.label,
          value: item.value
        }))];
        
        const currentYear = new Date().getFullYear().toString();
        this.selectedYear = currentYear;
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
    
    onGroupConfirm(e) {
      this.selectedGroupName = e.value[0].text;
      this.selectedGroup = e.value[0].value;
      this.loadStatistics();
      this.showGroupPicker = false;
    },
    
    onYearConfirm(e) {
      this.selectedYear = e.value[0].value;
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
        await ensureLogin()
        const userInfo = uni.getStorageSync('userInfo')
        const scores = await queryDocs('scores', {
          groupId: this.selectedGroup,
          creatorId: userInfo.username
        })
        
        if (!scores || scores.length === 0) return;
        
        if(this.selectedYear && !this.selectedMonth) {
          this.calculateYearStats(scores);
        }
        if(this.selectedYear && this.selectedMonth) {
          this.calculateMonthStats(scores);
        }
      } catch (err) {
        console.error('加载统计失败:', err)
      }
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
      
      this.prepareYearChartData(yearData);
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
      
      this.prepareMonthChartData(monthData);
    },
    
    prepareYearChartData(data) {
      if (!data || data.length === 0) {
        this.chartData = {
          categories: [],
          series: []
        };
        this.yearStats = [];
        this.periodStats = [];
        this.chartKey++;
        return;
      }
      
      const dateMap = {};
      data.forEach(item => {
        if (item.date && item.users) {
          dateMap[item.date] = item.users;
        }
      });
      
      const dates = Object.keys(dateMap).sort();
      const users = new Set();
      dates.forEach(date => {
        dateMap[date].forEach(user => {
          users.add(user.name);
        });
      });
      
      const series = [];
      const userList = Array.from(users);
      
      userList.forEach(user => {
        const dataPoints = dates.map(date => {
          const userData = dateMap[date].find(u => u.name === user);
          return userData ? Number(userData.score) || 0 : 0;
        });
        
        series.push({
          name: user,
          data: dataPoints
        });
      });
      
      this.chartData = {
        categories: dates,
        series
      };
      
      this.chartKey++;
    },
    
    prepareMonthChartData(data) {
      if (!data || data.length === 0) {
        this.chartData = {
          categories: [],
          series: []
        };
        this.periodStats = [];
        this.chartKey++;
        return;
      }
      
      const dateMap = {};
      data.forEach(item => {
        if (item.date && item.users) {
          dateMap[item.date] = item.users;
        }
      });
      
      const dates = Object.keys(dateMap).sort();
      const users = new Set();
      dates.forEach(date => {
        dateMap[date].forEach(user => {
          users.add(user.name);
        });
      });
      
      const series = [];
      const userList = Array.from(users);
      
      userList.forEach(user => {
        const dataPoints = dates.map(date => {
          const userData = dateMap[date].find(u => u.name === user);
          return userData ? Number(userData.score) || 0 : 0;
        });
        
        series.push({
          name: user,
          data: dataPoints
        });
      });
      
      this.chartData = {
        categories: dates,
        series
      };
      
      this.chartKey++;
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

.chart-container {
  height: 400px;
}
</style>
