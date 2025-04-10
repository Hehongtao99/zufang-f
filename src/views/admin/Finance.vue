<template>
  <div class="finance-container">
    <h1>财务管理</h1>
    <el-card class="finance-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="收入统计" name="income">
          <div class="income-stats">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">总收入</div>
                  <div class="stat-value">¥ {{ totalIncome.toFixed(2) }}</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">本月收入</div>
                  <div class="stat-value">¥ {{ monthlyIncome.toFixed(2) }}</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">服务费收入</div>
                  <div class="stat-value">¥ {{ serviceFee.toFixed(2) }}</div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                  <div class="stat-title">违约金收入</div>
                  <div class="stat-value">¥ {{ penaltyIncome.toFixed(2) }}</div>
                </el-card>
              </el-col>
            </el-row>
            
            <!-- 收入类型分布 -->
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="12">
                <el-card class="chart-card" v-loading="loading">
                  <div class="chart-title">收入类型分布</div>
                  <div id="income-pie-chart" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="chart-card" v-loading="loading">
                  <div class="chart-title">月度收入趋势</div>
                  <div id="income-chart" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
        <el-tab-pane label="交易记录" name="transactions">
          <el-table
            v-loading="loading"
            :data="transactions"
            style="width: 100%"
            border>
            <el-table-column prop="orderNo" label="订单编号" width="180" />
            <el-table-column prop="houseTitle" label="房源标题" width="180">
              <template #default="scope">
                {{ scope.row.houseTitle || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="userRealName" label="租客" width="120">
              <template #default="scope">
                {{ scope.row.userRealName || scope.row.userName || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="payTime" label="支付时间" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.payTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="金额" width="140">
              <template #default="scope">
                <span :style="{ color: scope.row.displayAmount < 0 ? '#F56C6C' : '' }">
                  {{ scope.row.displayAmount < 0 ? '-' : '' }}¥ {{ scope.row.displayAmount ? Math.abs(scope.row.displayAmount).toFixed(2) : scope.row.totalAmount ? scope.row.totalAmount.toFixed(2) : '0.00' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="penaltyAmount" label="违约金" width="120">
              <template #default="scope">
                <span v-if="scope.row.penaltyAmount && scope.row.penaltyAmount > 0" style="color: #F56C6C;">
                  ¥ {{ scope.row.penaltyAmount.toFixed(2) }}
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="交易类型" width="100">
              <template #default="scope">
                <el-tag :type="getTransactionType(scope.row.status, scope.row.hasPenalty)">
                  {{ scope.row.hasPenalty ? '违约金' : getTransactionTypeText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="transactionId" label="交易流水号" width="180">
              <template #default="scope">
                {{ scope.row.transactionId || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const activeTab = ref('income');
const totalIncome = ref(0);
const monthlyIncome = ref(0);
const serviceFee = ref(0);
const penaltyIncome = ref(0);
const loading = ref(false);
const incomeChart = ref(null);
const incomePieChart = ref(null);
const monthlyData = ref([]);

// 交易记录相关
const transactions = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 获取统计数据
const fetchStatsData = async () => {
  loading.value = true;
  try {
    const res = await request({
      url: '/admin/stats',
      method: 'get'
    });
    
    totalIncome.value = parseFloat(res.data.income || 0);
    monthlyIncome.value = parseFloat(res.data.monthlyIncome || 0);
    
    // 服务费计算为总收入的3%
    serviceFee.value = totalIncome.value * 0.03;
    
    // 违约金收入 - 可以从后端获取或者模拟计算
    penaltyIncome.value = parseFloat(res.data.penaltyIncome || 0);
    
    // 处理月度收入数据
    if (res.data.monthlyIncomeData) {
      monthlyData.value = res.data.monthlyIncomeData;
      initIncomeChart();
      initIncomePieChart();
    }
  } catch (error) {
    ElMessage.error('获取财务统计数据失败');
    console.error('获取财务统计数据失败:', error);
  } finally {
    loading.value = false;
  }
};

// 初始化收入趋势图
const initIncomeChart = () => {
  if (!monthlyData.value || monthlyData.value.length === 0) return;
  
  const chartDom = document.getElementById('income-chart');
  if (!chartDom) return;
  
  if (incomeChart.value) {
    incomeChart.value.dispose();
  }
  
  incomeChart.value = echarts.init(chartDom);
  
  const months = monthlyData.value.map(item => item.month);
  const incomes = monthlyData.value.map(item => parseFloat(item.income));
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br />收入: ¥{c}'
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [{
      data: incomes,
      type: 'line',
      smooth: true,
      lineStyle: {
        color: '#409EFF'
      },
      itemStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ]
        }
      }
    }]
  };
  
  incomeChart.value.setOption(option);
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', () => {
    incomeChart.value && incomeChart.value.resize();
  });
};

// 初始化收入类型饼图
const initIncomePieChart = () => {
  const chartDom = document.getElementById('income-pie-chart');
  if (!chartDom) return;
  
  if (incomePieChart.value) {
    incomePieChart.value.dispose();
  }
  
  incomePieChart.value = echarts.init(chartDom);
  
  const rentalIncome = totalIncome.value - serviceFee.value - penaltyIncome.value;
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: ['租金收入', '服务费收入', '违约金收入']
    },
    series: [
      {
        type: 'pie',
        radius: '70%',
        center: ['50%', '50%'],
        data: [
          { value: rentalIncome, name: '租金收入' },
          { value: serviceFee.value, name: '服务费收入' },
          { value: penaltyIncome.value, name: '违约金收入' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };
  
  incomePieChart.value.setOption(option);
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', () => {
    incomePieChart.value && incomePieChart.value.resize();
  });
};

// 获取交易记录数据
const fetchTransactions = async () => {
  loading.value = true;
  try {
    const res = await request({
      url: '/admin/orders',
      method: 'get',
      params: {
        page: currentPage.value,
        size: pageSize.value,
        // 包含所有可能的交易状态
        status: 'PAID,COMPLETED,ACTIVE,TERMINATED,TERMINATE_REQUESTED,REFUNDING,REFUNDED'
      }
    });
    
    if (res.data && res.data.records) {
      console.log('交易记录数据:', res.data.records);
      // 处理交易记录数据，为退租记录添加负号
      transactions.value = res.data.records.map(record => {
        // 复制原始数据
        const newRecord = { ...record };
        
        // 如果是退租或退款记录，显示负数金额
        if (['TERMINATED', 'REFUNDED'].includes(record.status)) {
          newRecord.displayAmount = -Math.abs(record.totalAmount || 0);
        } else if (record.penaltyAmount && record.penaltyAmount > 0) {
          // 如果有违约金，显示正常金额
          newRecord.hasPenalty = true;
        } else {
          // 正常交易记录
          newRecord.displayAmount = record.totalAmount || 0;
        }
        
        return newRecord;
      });
      total.value = res.data.total;
    }
  } catch (error) {
    ElMessage.error('获取交易记录失败');
    console.error('获取交易记录失败:', error);
  } finally {
    loading.value = false;
  }
};

// 处理分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchTransactions();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTransactions();
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 获取状态样式
const getStatusType = (status) => {
  const map = {
    'UNPAID': 'warning',
    'PAID': 'success',
    'CANCELLED': 'danger',
    'PAYMENT_CANCELLED': 'info',
    'REFUNDING': 'warning',
    'REFUNDED': 'info',
    'COMPLETED': 'success',
    'ACTIVE': 'success',
    'TERMINATE_REQUESTED': 'warning',
    'TERMINATED': 'info'
  };
  return map[status] || 'info';
};

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    'UNPAID': '待支付',
    'PAID': '已支付',
    'CANCELLED': '已取消',
    'PAYMENT_CANCELLED': '取消支付',
    'REFUNDING': '退款中',
    'REFUNDED': '已退款',
    'COMPLETED': '已完成',
    'ACTIVE': '租赁中',
    'TERMINATE_REQUESTED': '申请退租',
    'TERMINATED': '已退租'
  };
  return map[status] || status;
};

// 获取交易类型文本
const getTransactionTypeText = (status) => {
  const map = {
    'UNPAID': '租房',
    'PAID': '租房',
    'CANCELLED': '取消',
    'PAYMENT_CANCELLED': '取消支付',
    'REFUNDING': '退款',
    'REFUNDED': '退款',
    'COMPLETED': '租房', 
    'ACTIVE': '租房',
    'TERMINATE_REQUESTED': '退租申请',
    'TERMINATED': '退租'
  };
  
  // 检查是否有违约金
  return map[status] || status;
};

// 获取交易类型颜色
const getTransactionType = (status, hasPenalty) => {
  // 如果有违约金，使用特殊颜色
  if (hasPenalty) {
    return 'danger';
  }
  
  const map = {
    'UNPAID': '',
    'PAID': 'success',
    'CANCELLED': 'danger',
    'PAYMENT_CANCELLED': 'info',
    'REFUNDING': 'warning',
    'REFUNDED': 'danger',
    'COMPLETED': 'success',
    'ACTIVE': 'success', 
    'TERMINATE_REQUESTED': 'warning',
    'TERMINATED': 'danger'
  };
  return map[status] || 'info';
};

// 监听标签切换
watch(activeTab, (newVal) => {
  if (newVal === 'transactions') {
    fetchTransactions();
  }
});

onMounted(() => {
  fetchStatsData();
  
  // 监听窗口大小变化，调整图表尺寸
  window.addEventListener('resize', () => {
    incomeChart.value && incomeChart.value.resize();
    incomePieChart.value && incomePieChart.value.resize();
  });
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('resize', () => {
    incomeChart.value && incomeChart.value.resize();
    incomePieChart.value && incomePieChart.value.resize();
  });
});
</script>

<style scoped>
.finance-container {
  padding: 20px;
}

.finance-card {
  margin-bottom: 20px;
}

.income-stats {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.chart-card {
  margin-top: 20px;
}

.chart-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
  text-align: center;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 