<template>
  <div class="finance">
    <h2>财务管理</h2>
    
    <el-row :gutter="20" class="statistics">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>总收入</span>
            </div>
          </template>
          <div class="card-content">
            <span class="amount price">{{ formatCurrency(statistics.totalIncome) }}</span>
            <span class="unit">元</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>本月收入</span>
            </div>
          </template>
          <div class="card-content">
            <span class="amount price">{{ formatCurrency(statistics.monthlyIncome) }}</span>
            <span class="unit">元</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>违约金收入</span>
            </div>
          </template>
          <div class="card-content">
            <span class="amount price">{{ formatCurrency(statistics.penaltyIncome) }}</span>
            <span class="unit">元</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>押金总额</span>
              <el-tooltip content="已收到的押金总额，非收入">
                <el-icon><question-filled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="card-content">
            <span class="amount deposit">{{ formatCurrency(statistics.totalDeposit) }}</span>
            <span class="unit">元</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="statistics mt-20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>已出租房源</span>
            </div>
          </template>
          <div class="card-content">
            <span class="amount">{{ formatCount(statistics.rentedHouses) }}</span>
            <span class="unit">套</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>订单总数</span>
            </div>
          </template>
          <div class="card-content">
            <span class="amount">{{ formatCount(statistics.totalOrders) }}</span>
            <span class="unit">单</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" @click="goToTerminateManage" class="clickable-card">
          <template #header>
            <div class="card-header">
              <span>退租申请</span>
            </div>
          </template>
          <div class="card-content">
            <span class="amount">{{ statistics.terminateRequests || 0 }}</span>
            <span class="unit">个</span>
            <span class="tip ml-10">(点击查看)</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>本月订单</span>
            </div>
          </template>
          <div class="card-content">
            <span class="amount">{{ formatCount(statistics.monthlyOrders) }}</span>
            <span class="unit">单</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <div class="income-list">
      <h3>收入明细</h3>
      
      <div class="filter">
        <el-select v-model="queryParams.type" placeholder="收入类型" clearable>
          <el-option label="全部" value="" />
          <el-option label="租金收入" value="RENT" />
          <el-option label="违约金" value="PENALTY" />
          <el-option label="押金相关" value="DEPOSIT" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="fetchIncomeList">查询</el-button>
      </div>
      
      <el-table :data="incomeList" border stripe v-loading="loading">
        <el-table-column prop="orderNo" label="订单编号" width="180" />
        <el-table-column prop="houseTitle" label="房源" min-width="120" />
        <el-table-column label="租客" width="120">
          <template #default="scope">
            {{ scope.row.userName }}
          </template>
        </el-table-column>
        <el-table-column prop="incomeType" label="收入类型" width="120">
          <template #default="scope">
            <el-tag 
              :type="getIncomeTypeStyle(scope.row.incomeType)" 
              :effect="scope.row.amount < 0 ? 'plain' : 'light'">
              {{ scope.row.incomeTypeName || getIncomeTypeName(scope.row.incomeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="租金" width="120">
          <template #default="scope">
            <span :style="{ color: scope.row.amount < 0 ? '#F56C6C' : '#67C23A', fontWeight: '500' }">
              {{ scope.row.amount < 0 ? '-' : '+' }}¥ {{ Math.abs(scope.row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="押金" width="100" align="right">
          <template #default="scope">
            <span class="deposit" v-if="scope.row.deposit !== undefined && scope.row.deposit !== null">{{ formatCurrency(scope.row.deposit) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="总金额" width="120" align="right" sortable>
          <template #default="scope">
            <span :class="getAmountClass(scope.row)">
              <template v-if="scope.row.incomeType === 'RENT_LOSS' || scope.row.incomeType === 'TERMINATE'">
                -{{ formatCurrency(Math.abs(scope.row.amount || getTotalAmount(scope.row))) }}
              </template>
              <template v-else>
                {{ getAmountClass(scope.row) === 'refund' ? '-' : '+' }} 
                {{ formatCurrency(scope.row.amount || getTotalAmount(scope.row)) }}
              </template>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="租期" width="240">
          <template #default="scope">
            <!-- 优先显示已终止订单的实际租期信息 -->
            <template v-if="scope.row.status === 'TERMINATED' || scope.row.status === 'TERMINATE_APPROVED'">
              <div class="lease-term-info">
                <!-- 优先显示日期范围，然后再考虑显示天数 -->
                <template v-if="scope.row.leaseStartDate && (scope.row.actualTerminateDate || scope.row.leaseEndDate)">
                  <div>
                    {{ formatDate(scope.row.leaseStartDate) }} 至 {{ formatDate(scope.row.actualTerminateDate || scope.row.leaseEndDate) }}
                  </div>
                  <div class="term-info" v-if="scope.row.actualDays && scope.row.totalDays">
                    (实际租期: {{ scope.row.actualDays }}/{{ scope.row.totalDays }} 天)
                  </div>
                </template>
                <template v-else-if="scope.row.remark && scope.row.remark.includes('实际租期:')">
                  {{ extractLeaseTermInfo(scope.row.remark) }}
                </template>
                <template v-else-if="scope.row.terminateInfo && scope.row.terminateInfo.includes('实际租期:')">
                  {{ extractLeaseTermInfo(scope.row.terminateInfo) }}
                </template>
                <template v-else-if="scope.row.actualDays !== undefined && scope.row.totalDays !== undefined">
                  实际租期: {{ scope.row.actualDays }}/{{ scope.row.totalDays }} 天
                </template>
                <template v-else>
                  暂无完整租期信息
                </template>
              </div>
            </template>
            <!-- 特别处理违约金记录 -->
            <template v-else-if="scope.row.incomeType === 'PENALTY'">
              <div class="lease-term-info">
                <template v-if="scope.row.leaseStartDate && scope.row.leaseEndDate">
                  <div>
                    {{ formatDate(scope.row.leaseStartDate) }} 至 {{ formatDate(scope.row.leaseEndDate) }}
                  </div>
                  <div class="term-info" v-if="scope.row.totalDays">
                    (约定租期: {{ scope.row.totalDays }}天)
                  </div>
                </template>
                <template v-else>
                  与退租记录相关的违约金
                </template>
              </div>
            </template>
            <!-- 常规租期显示 -->
            <template v-else>
              <!-- 优先使用后端提供的租期信息 -->
              <template v-if="scope.row.leaseTermInfo">
                {{ scope.row.leaseTermInfo }}
              </template>
              <template v-else-if="scope.row.leaseStartDate && scope.row.leaseEndDate">
                <div class="lease-term-info">
                  <div>
                    {{ formatDate(scope.row.leaseStartDate) }} 至 {{ formatDate(scope.row.leaseEndDate) }}
                  </div>
                  <div class="term-info" v-if="scope.row.totalDays">
                    (共{{ scope.row.totalDays }}天)
                  </div>
                </div>
              </template>
              <template v-else>
                <span class="no-term-info">查看订单详情</span>
              </template>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="交易时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.transactionTime || scope.row.payTime) }}
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="scope">
            <!-- 显示退租信息 -->
            <template v-if="scope.row.terminateInfo">
              <div>{{ scope.row.terminateInfo }}</div>
            </template>
            <!-- 显示退租状态 -->
            <template v-if="scope.row.rentStatus">
              <div>{{ scope.row.rentStatus }}</div>
            </template>
            <!-- 显示默认备注或用户备注 -->
            <div>{{ scope.row.remark || getDefaultRemark(scope.row) }}</div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { QuestionFilled } from '@element-plus/icons-vue';

const router = useRouter();

// 状态变量
const loading = ref(false);
const statistics = ref({
  totalIncome: '0.00',
  monthlyIncome: '0.00',
  penaltyIncome: '0.00',
  totalOrders: 0,
  rentedHouses: 0,
  totalDeposit: '0.00',
  monthlyOrders: 0,
  terminateRequests: 0
});
const incomeList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const dateRange = ref([]);
const queryParams = reactive({
  type: ''
});

// 初始化
onMounted(() => {
  fetchStatistics();
  fetchIncomeList();
});

// 获取统计数据
const fetchStatistics = async () => {
  try {
    console.log('开始获取财务统计数据...');
    const res = await request({
      url: '/landlord/finance/statistics',
      method: 'get'
    });
    
    if (res.code === 200) {
      console.log('获取财务统计数据成功:', res.data);
      // 直接使用后端返回的数据，不再进行前端修正
      statistics.value = res.data;
      
      // 控制台输出，方便调试
      console.log('总收入:', statistics.value.totalIncome);
      console.log('本月收入:', statistics.value.monthlyIncome);
      console.log('违约金收入:', statistics.value.penaltyIncome);
      console.log('押金总额:', statistics.value.totalDeposit);
      console.log('退租申请数:', statistics.value.terminateRequests);
    } else {
      ElMessage.error(res.message || '获取统计数据失败');
      console.error('获取统计数据失败:', res.message);
    }
  } catch (error) {
    console.error('获取统计数据失败', error);
    ElMessage.error('获取统计数据失败');
  }
};

// 获取收入明细
const fetchIncomeList = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      type: queryParams.type || null
    };
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    const res = await request({
      url: '/landlord/finance/income',
      method: 'get',
      params
    });
    
    if (res.code === 200) {
      console.log('收入明细原始数据:', res.data.records);
      
      // 预处理一下数据，关联同一订单下的记录
      const orderMap = new Map();
      res.data.records.forEach(item => {
        if (!orderMap.has(item.orderId)) {
          orderMap.set(item.orderId, []);
        }
        orderMap.get(item.orderId).push(item);
      });
      
      // 处理收入明细数据，确保数值字段正确
      incomeList.value = res.data.records.map(item => {
        // 创建一个新对象，避免直接修改原始数据
        const processedItem = { ...item };
        
        // 将字符串数值转为数值类型
        if (processedItem.monthlyRent !== undefined) {
          processedItem.monthlyRent = parseFloat(processedItem.monthlyRent);
        }
        if (processedItem.deposit !== undefined) {
          processedItem.deposit = parseFloat(processedItem.deposit);
        }
        if (processedItem.totalAmount !== undefined) {
          processedItem.totalAmount = parseFloat(processedItem.totalAmount);
        }
        if (processedItem.penaltyAmount !== undefined) {
          processedItem.penaltyAmount = parseFloat(processedItem.penaltyAmount);
        }
        if (processedItem.amount !== undefined) {
          processedItem.amount = parseFloat(processedItem.amount);
        }
        
        // 尝试补充租期信息
        // 1. 如果同一订单有其他记录，可能有完整的租期信息
        if (processedItem.orderId && (!processedItem.leaseStartDate || !processedItem.leaseEndDate)) {
          const relatedRecords = orderMap.get(processedItem.orderId) || [];
          for (const related of relatedRecords) {
            if (related.leaseStartDate && !processedItem.leaseStartDate) {
              processedItem.leaseStartDate = related.leaseStartDate;
            }
            if (related.leaseEndDate && !processedItem.leaseEndDate) {
              processedItem.leaseEndDate = related.leaseEndDate;
            }
            if (related.actualTerminateDate && !processedItem.actualTerminateDate) {
              processedItem.actualTerminateDate = related.actualTerminateDate;
            }
            if (processedItem.leaseStartDate && processedItem.leaseEndDate) break;
          }
        }
        
        // 从备注中提取租期信息
        if (processedItem.remark) {
          const leaseTermInfo = parseLeaseTermFromRemark(processedItem.remark);
          if (leaseTermInfo) {
            // 将提取的租期信息添加到对象中
            Object.assign(processedItem, leaseTermInfo);
            console.log('从备注中提取的租期信息:', leaseTermInfo);
          }
        }
        
        // 根据收入类型处理特殊情况
        if (processedItem.incomeType === 'RENT') {
          // 对于租金收入，如果没有设置金额，则使用月租金
          if (processedItem.amount === undefined && processedItem.monthlyRent !== undefined) {
            processedItem.amount = processedItem.monthlyRent;
          }
        } else if (processedItem.incomeType === 'PENALTY') {
          // 对于违约金收入，使用违约金金额
          if (processedItem.amount === undefined && processedItem.penaltyAmount !== undefined) {
            processedItem.amount = processedItem.penaltyAmount;
          }
        } else if (processedItem.incomeType === 'DEPOSIT') {
          // 对于押金收入，使用押金金额
          if (processedItem.amount === undefined && processedItem.deposit !== undefined) {
            processedItem.amount = processedItem.deposit;
          }
        } else if (processedItem.incomeType === 'TERMINATE') {
          // 对于退租记录，确保金额正确，如果是负数表示退款
          if (processedItem.amount !== undefined) {
            // 确保数据类型正确
            if (typeof processedItem.amount === 'string') {
              processedItem.amount = parseFloat(processedItem.amount);
            }
            
            // 添加特定的标记和说明
            if (processedItem.amount < 0) {
              // 负值表示退款
              processedItem.isRefund = true;
              if (!processedItem.terminateInfo) {
                const absAmount = Math.abs(processedItem.amount);
                processedItem.terminateInfo = `退款金额: ${absAmount.toFixed(2)}元`;
              }
            }
            
            // 如果是退租记录但没有租期信息，尝试从订单信息中计算
            if (!processedItem.actualDays && processedItem.leaseStartDate && processedItem.actualTerminateDate) {
              try {
                const startDate = new Date(processedItem.leaseStartDate);
                const endDate = new Date(processedItem.leaseEndDate);
                const terminateDate = new Date(processedItem.actualTerminateDate);
                
                // 计算总天数和实际使用天数
                const totalDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
                const actualDays = Math.round((terminateDate - startDate) / (1000 * 60 * 60 * 24));
                
                // 设置租期信息
                processedItem.totalDays = totalDays > 0 ? totalDays : 1;
                processedItem.actualDays = actualDays > 0 ? actualDays : 1;
                
                console.log('计算的租期信息:', { totalDays, actualDays });
              } catch (e) {
                console.error('计算租期天数失败:', e);
              }
            }
          }
        }
        
        // 确保有一个可用的总金额显示
        if (processedItem.amount === undefined) {
          processedItem.amount = getTotalAmount(processedItem);
        }
        
        console.log('处理后的收入项:', processedItem);
        return processedItem;
      });
      
      console.log('处理后的收入明细数据:', incomeList.value);
      total.value = res.data.total;
    } else {
      ElMessage.error(res.message || '获取收入明细失败');
    }
  } catch (error) {
    console.error('获取收入明细失败', error);
    ElMessage.error('获取收入明细失败');
  } finally {
    loading.value = false;
  }
};

// 计算订单总金额
const getTotalAmount = (order) => {
  // 如果有后端返回的amount字段，优先使用
  if (order.amount !== undefined && order.amount !== null) {
    return parseFloat(order.amount);
  }
  
  // 如果是押金收入，只算押金
  if (order.incomeType === 'DEPOSIT') {
    return parseFloat(order.deposit || 0);
  }
  
  // 如果是租金收入，根据租金情况计算
  if (order.incomeType === 'RENT' || !order.incomeType) {
    if (order.monthlyRent !== undefined && order.monthlyRent !== null) {
      return parseFloat(order.monthlyRent);
    }
  }
  
  // 如果是违约金收入
  if (order.incomeType === 'PENALTY' && order.penaltyAmount !== undefined && order.penaltyAmount !== null) {
    return parseFloat(order.penaltyAmount);
  }
  
  // 如果有totalAmount但没有具体分类
  if (order.totalAmount !== undefined && order.totalAmount !== null) {
    if (order.deposit !== undefined && order.deposit !== null) {
      // 总金额减去押金
      return parseFloat(order.totalAmount) - parseFloat(order.deposit);
    }
    return parseFloat(order.totalAmount);
  }
  
  return 0;
};

// 获取金额显示类型
const getAmountClass = (order) => {
  if (order.incomeType === 'DEPOSIT_REFUND' || 
      order.incomeType === 'RENT_LOSS' || 
      (order.incomeType === 'TERMINATE' && order.amount < 0)) {
    return 'refund';
  }
  return 'income';
};

// 获取默认备注
const getDefaultRemark = (order) => {
  if (order.status === 'PAID') return '租金与押金支付';
  if (order.status === 'TERMINATED') return '租约已终止';
  if (order.status === 'ACTIVE') return '租约进行中';
  if (order.incomeType === 'TERMINATE' && order.amount < 0) return `提前终止租约，退还剩余租金`;
  if (order.penaltyAmount && order.penaltyAmount > 0) return '提前终止违约金';
  return '订单交易';
};

// 获取收入类型名称
const getIncomeTypeName = (type) => {
  const map = {
    'RENT': '租金收入',
    'TERMINATE': '退租记录',
    'PENALTY': '违约金收入',
    'RENT_LOSS': '退款记录'
  };
  return map[type] || type;
};

// 获取收入类型样式
const getIncomeTypeStyle = (type) => {
  const map = {
    'RENT': 'success',
    'TERMINATE': 'danger',
    'PENALTY': 'warning'
  };
  return map[type] || 'info';
};

// 前往退租管理页
const goToTerminateManage = () => {
  console.log('导航到退租管理页面');
  ElMessage.info('正在跳转到退租管理页面...');
  router.push('/landlord/terminate');
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchIncomeList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchIncomeList();
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '暂无';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '暂无';
  const date = new Date(dateStr);
  return `${formatDate(dateStr)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 在script部分添加数值格式化函数
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '0.00';
  
  try {
    // 如果是字符串，先尝试转换为数字
    const num = typeof value === 'string' ? parseFloat(value) : value;
    // 检查是否是有效数字
    if (isNaN(num)) return '0.00';
    // 格式化为2位小数
    return num.toFixed(2);
  } catch (e) {
    console.error('格式化金额失败:', e, value);
    return '0.00';
  }
};

// 格式化整数统计数
const formatCount = (value) => {
  if (value === undefined || value === null) return 0;
  
  try {
    // 尝试转换为整数
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  } catch (e) {
    console.error('格式化统计数失败:', e, value);
    return 0;
  }
};

// 提取实际租期信息
const extractLeaseTermInfo = (text) => {
  if (!text) return '暂无租期信息';
  
  // 尝试从文本中提取"实际租期: x/y 天"格式的信息
  const match = text.match(/实际租期:\s*(\d+)\/(\d+)\s*天/);
  if (match && match.length >= 3) {
    const actualDays = match[1];
    const totalDays = match[2];
    return `实际租期: ${actualDays}/${totalDays} 天`;
  }
  
  // 如果没有找到标准格式，尝试提取包含"实际租期"的整段文本
  const termIndex = text.indexOf('实际租期:');
  if (termIndex >= 0) {
    const endIndex = text.indexOf(',', termIndex);
    if (endIndex > termIndex) {
      return text.substring(termIndex, endIndex).trim();
    } else {
      // 如果没有逗号，提取到字符串结束
      return text.substring(termIndex).trim();
    }
  }
  
  return text;
};

// 从备注中尝试提取租期信息
const parseLeaseTermFromRemark = (remark) => {
  if (!remark) return null;
  
  // 尝试解析"实际租期: x/y 天"格式
  const actualTermMatch = remark.match(/实际租期:\s*(\d+)\/(\d+)\s*天/);
  if (actualTermMatch && actualTermMatch.length >= 3) {
    return {
      actualDays: parseInt(actualTermMatch[1]),
      totalDays: parseInt(actualTermMatch[2])
    };
  }
  
  // 尝试解析"剩余天数: x 天"格式
  const remainingDaysMatch = remark.match(/剩余天数:\s*(\d+)\s*天/);
  if (remainingDaysMatch && remainingDaysMatch.length >= 2) {
    return {
      remainingDays: parseInt(remainingDaysMatch[1])
    };
  }
  
  return null;
};
</script>

<style scoped>
.finance {
  padding: 20px;
  
  h2 {
    margin-bottom: 20px;
    font-weight: 500;
  }
  
  h3 {
    margin: 30px 0 20px;
    font-weight: 500;
  }
  
  .statistics {
    .el-card {
      border-radius: 8px;
      
      .card-header {
        display: flex;
        align-items: center;
        
        .el-icon {
          margin-left: 5px;
          font-size: 16px;
          color: #909399;
        }
      }
      
      .card-content {
        text-align: center;
        padding: 15px 0;
        
        .amount {
          font-size: 24px;
          font-weight: 500;
          margin-right: 5px;
          
          &.price {
            color: #67c23a;
          }
          
          &.deposit {
            color: #409eff;
          }
        }
        
        .unit {
          font-size: 14px;
          color: #606266;
        }
        
        .ml-10 {
          margin-left: 10px;
        }
      }
    }
  }
  
  .mt-20 {
    margin-top: 20px;
  }
  
  .income-list {
    margin-top: 30px;
    
    .filter {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    
    .price {
      color: #67c23a;
      font-weight: 500;
    }
    
    .deposit {
      color: #409eff;
      font-weight: 500;
    }
    
    .refund {
      color: #f56c6c;
      font-weight: 500;
    }
    
    .lease-term-info {
      line-height: 1.4;
      
      .term-info {
        color: #909399;
        font-size: 0.9em;
      }
    }
  }
}

.clickable-card {
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.tip {
  font-size: 12px;
  color: #909399;
}

/* 新增样式 */
.lease-term-info {
  display: flex;
  flex-direction: column;
  
  .term-info {
    margin-top: 2px;
    color: #606266;
    font-size: 12px;
  }
}

.no-term-info {
  color: #909399;
  font-size: 13px;
  font-style: italic;
}
</style> 