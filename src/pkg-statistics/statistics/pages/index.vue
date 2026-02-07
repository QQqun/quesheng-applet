<template>
  <view class="page-container">
    <!-- 查询条件 -->
    <view class="section">
      <!-- 组选择 -->
      <view class="form-item">
        <text class="label">选择群组</text>
        <view class="picker-display" @click="showGroupPicker = true">
          <text class="picker-text">{{ selectedGroupName || '请选择群组' }}</text>
          <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>
      
      <!-- 年份选择 -->
      <view class="form-item">
        <text class="label">选择年份</text>
        <view class="picker-display" @click="showYearPicker = true">
          <text class="picker-text">{{ selectedYear || '请选择年份' }}</text>
          <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>
      
      <!-- 月份选择 -->
      <view class="form-item">
        <text class="label">选择月份</text>
        <view class="picker-display" @click="showMonthPicker = true">
          <text class="picker-text">{{ selectedMonthName || '请选择月份' }}</text>
          <u-icon name="arrow-right" color="#9ca3af" size="16"></u-icon>
        </view>
      </view>
    </view>
    
    <!-- 群组选择器 -->
    <u-picker :show="showGroupPicker" :columns="groupColumns" @confirm="onGroupConfirm" @cancel="showGroupPicker = false"></u-picker>
    
    <!-- 年份选择器 -->
    <u-picker :show="showYearPicker" :columns="yearColumns" @confirm="onYearConfirm" @cancel="showYearPicker = false"></u-picker>
    
    <!-- 月份选择器 -->
    <u-picker :show="showMonthPicker" :columns="monthColumns" @confirm="onMonthConfirm" @cancel="showMonthPicker = false"></u-picker>
    
    <!-- 年积分统计 -->
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
    
    <!-- 积分统计表格 -->
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
    
    <!-- 积分柱状图 -->
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

export default {
  components: {
    qiunDataCharts
  },
  data() {
    return {
      // 群组相关
      groupList: [],
      selectedGroup: '',
      selectedGroupName: '',
      showGroupPicker: false,
      groupColumns: [{value: '2026-01', label: '2026年1月'}],
      
      // 时间相关
      timeType: 0, // 0: 按月, 1: 按年
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
      
      // 统计数据
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
    // 初始化数据
    initData() {
      this.loadYears();
      this.loadMonthColumns();
      this.loadGroups();
    },
    
    // 加载群组列表
    loadGroups() {
      const cachedData = uni.getStorageSync('groups') || [];
      this.groupList = cachedData.map(item => ({
        label: item.groupName,
        value: item.id
      }));
      
      // 设置 picker 列数据 - 必须是二维数组 [[...]]，格式为 {text: '', value: ''}
      this.groupColumns = [this.groupList.map(item => ({
        text: item.label,
        value: item.value
      }))]
      
      // 默认选择第一个群组
      if (this.groupList.length > 0) {
        this.selectedGroup = this.groupList[0].value;
        this.selectedGroupName = this.groupList[0].label;
        this.loadStatistics();
      }
    },
    
    // 加载年份列表
    loadYears() {
      const cachedData = uni.getStorageSync('groupData') || [];
      const years = new Set();
      
      cachedData.forEach(group => {
        group.data.forEach(item => {
          const year = item.date.split('-')[0];
          years.add(year);
        });
      });
      
      this.yearList = Array.from(years).map(year => ({
        value: year,
        label: year + '年'
      }));
      
      // 设置 picker 列数据 - 格式为 {text: '', value: ''}
      this.yearColumns = [this.yearList.map(item => ({
        text: item.label,
        value: item.value
      }))];
      
      // 默认选择当前年份
      const currentYear = new Date().getFullYear().toString();
      this.selectedYear = currentYear;
      this.selectedMonth = "";
    },
    
    // 加载月份列数据
    loadMonthColumns() {
      this.monthColumns = [this.monthList.map(item => ({
        text: item.label,
        value: item.value
      }))];
    },
    
    // 群组选择确认
    onGroupConfirm(e) {
      console.log(e);
      this.selectedGroupName = e.value[0].text;
      this.selectedGroup = e.value[0].value;
      this.loadStatistics();
      this.showGroupPicker = false;
    },
    
    // 年份选择确认
    onYearConfirm(e) {
      const index = e.value[0];
      this.selectedYear = e.value[0].value;
      this.loadStatistics();
      this.showYearPicker = false;
    },
    
    // 月份选择确认
    onMonthConfirm(e) {
      console.log(e);
      this.selectedMonth = e.value[0].value;
      this.selectedMonthName = e.value[0].text;
      this.loadStatistics();
      this.showMonthPicker = false;
    },
    
    // 加载统计数据
    loadStatistics() {
      if (!this.selectedGroup) return;
      
      const cachedData = uni.getStorageSync('groupData') || [];
      const groupRecord = cachedData.find(item => item.groupId === this.selectedGroup);
      
      if (!groupRecord) return;
      
      if(this.selectedYear && !this.selectedMonth) {
        // 按年统计
        console.log('按年统计', this.selectedYear);
        this.calculateYearStats(groupRecord.data);
      }
      if(this.selectedYear && this.selectedMonth) {
        // 按月统计
        console.log('按月统计', this.selectedYear, this.selectedMonth);
        this.calculateMonthStats(groupRecord.data);
      }
    },
    
    // 计算年统计数据
    calculateYearStats(data) {
      const year = this.selectedYear;
      const yearData = data.filter(item => item.date.startsWith(year));
      
      // 计算每个人的年积分
      const userStats = {};
      yearData.forEach(item => {
        item.users.forEach(user => {
          if (!userStats[user.name]) {
            userStats[user.name] = 0;
          }
          userStats[user.name] += Number(user.score) || 0;
        });
      });
      
      // 转换为数组
      this.yearStats = Object.keys(userStats).map(name => ({
        name,
        totalScore: userStats[name]
      }));
      
      // 设置当前时间段统计
      this.periodStats = Object.keys(userStats).map(name => ({
        name,
        total: userStats[name]
      }));
      
      // 准备图表数据
      this.prepareYearChartData(yearData);
    },
    
    // 计算月统计数据
    calculateMonthStats(data) {
      const month = this.selectedMonth;
      const date = this.selectedYear + '-' + month;
      const monthData = data.filter(item => item.date.startsWith(date));
      
      // 计算每个人的月积分
      const userStats = {};
      monthData.forEach(item => {
        item.users.forEach(user => {
          if (!userStats[user.name]) {
            userStats[user.name] = 0;
          }
          userStats[user.name] += Number(user.score) || 0;
        });
      });
      
      // 设置当前时间段统计
      this.periodStats = Object.keys(userStats).map(name => ({
        name,
        total: userStats[name]
      }));
      
      // 准备图表数据
      this.prepareMonthChartData(monthData);
    },
    
    // 准备年图表数据
    prepareYearChartData(data) {
      // 如果数据为空，清空图表
      if (!data || data.length === 0) {
        this.chartData = {
          categories: [],
          series: []
        };
        this.yearStats = [];
        this.periodStats = [];
        this.chartKey++;
        this.updateChartYAxis([]);
        return;
      }
      
      // 按日期分组
      const dateMap = {};
      data.forEach(item => {
        dateMap[item.date] = item.users;
      });
      
      // 获取所有日期和用户
      const dates = Object.keys(dateMap).sort();
      const users = new Set();
      dates.forEach(date => {
        dateMap[date].forEach(user => {
          users.add(user.name);
        });
      });
      
      // 准备图表数据
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
      
      // 根据数据计算Y轴最大值和最小值
      this.updateChartYAxis(series);
    },
    
    // 准备月图表数据
    prepareMonthChartData(data) {
      // 如果数据为空，清空图表
      if (!data || data.length === 0) {
        console.log('无数据');
        this.chartData = {
          categories: [],
          series: []
        };
        this.periodStats = [];
        this.chartKey++;
        this.updateChartYAxis([]);
        return;
      }
      
      // 按日期分组
      const dateMap = {};
      data.forEach(item => {
        dateMap[item.date] = item.users;
      });
      
      // 获取所有日期和用户
      const dates = Object.keys(dateMap).sort();
      const users = new Set();
      dates.forEach(date => {
        dateMap[date].forEach(user => {
          users.add(user.name);
        });
      });
      
      // 准备图表数据
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
      
      // 根据数据计算Y轴最大值和最小值
      this.updateChartYAxis(series);
    },
    
    updateChartYAxis(series) {
      this.chartKey++;
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
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #1f2937;
}

/* 表单项 */
.form-item {
  margin-bottom: 16px;
}

.label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

/* picker 显示 */
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

/* 年积分统计 */
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

/* 统计表格 */
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

/* 图表容器 */
.chart-container {
  height: 400px;
}
</style>