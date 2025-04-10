<template>
  <div class="order-detail-container">
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <h2>订单详情</h2>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <div v-loading="loading">
        <!-- 错误提示 -->
        <el-alert
          v-if="error"
          title="获取订单数据失败"
          type="error"
          description="请稍后再试或联系管理员"
          show-icon
          :closable="false"
          style="margin-bottom: 20px;"
        />
        
        <!-- 订单基本信息 -->
        <div v-if="orderDetail">
          <el-descriptions title="订单信息" :column="3" border>
            <el-descriptions-item label="订单编号">{{ orderDetail.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(orderDetail.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusType(orderDetail.status)">{{ getStatusText(orderDetail.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">{{ orderDetail.payMethod || '未支付' }}</el-descriptions-item>
            <el-descriptions-item label="支付时间">{{ formatDateTime(orderDetail.payTime) || '未支付' }}</el-descriptions-item>
            <el-descriptions-item label="交易流水号">{{ orderDetail.transactionId || '无' }}</el-descriptions-item>
          </el-descriptions>
          
          <!-- 退租信息 -->
          <el-descriptions v-if="isTerminated" title="退租信息" :column="2" border class="mt-4">
            <el-descriptions-item label="租期">
              {{ formatDate(orderDetail.startDate) }} 至 {{ formatDate(orderDetail.endDate) }}
              <span class="ml-2">(共{{ calculateTotalDays(orderDetail.startDate, orderDetail.endDate) }}天)</span>
            </el-descriptions-item>
            <el-descriptions-item label="实际租期">
              {{ formatDate(orderDetail.startDate) }} 至 {{ formatDate(orderDetail.actualTerminateDate) }}
              <span class="ml-2">(共{{ calculateActualDays(orderDetail.startDate, orderDetail.actualTerminateDate) }}天/{{ calculateTotalDays(orderDetail.startDate, orderDetail.endDate) }}天)</span>
            </el-descriptions-item>
            <el-descriptions-item label="退租原因">{{ orderDetail.terminateReason || '未提供' }}</el-descriptions-item>
            <el-descriptions-item label="退租申请时间">{{ formatDateTime(orderDetail.terminateRequestTime) }}</el-descriptions-item>
            <el-descriptions-item label="期望退租日期">{{ formatDate(orderDetail.expectedTerminateDate) }}</el-descriptions-item>
            <el-descriptions-item label="实际退租日期">{{ formatDate(orderDetail.actualTerminateDate) }}</el-descriptions-item>
            <el-descriptions-item label="未使用租期">
              {{ calculateRemainingDays(orderDetail.actualTerminateDate, orderDetail.endDate) }} 天
              <el-tooltip content="实际退租日期到租约结束日期之间的天数（由房东设置实际退租日期）" placement="top">
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-descriptions-item>
            <el-descriptions-item label="违约金">
              ¥{{ orderDetail.penaltyAmount || '0.00' }}
              <span v-if="orderDetail.isPenaltyPaid" class="ml-2 success-text">(已支付)</span>
              <span v-else class="ml-2 warning-text">(未支付)</span>
            </el-descriptions-item>
          </el-descriptions>
          
          <!-- 费用信息 -->
          <el-descriptions title="费用信息" :column="3" border class="mt-4">
            <el-descriptions-item label="月租金">¥{{ orderDetail.monthlyRent || '0.00' }}</el-descriptions-item>
            <el-descriptions-item label="押金">¥{{ orderDetail.deposit || '0.00' }}</el-descriptions-item>
            <el-descriptions-item label="服务费">¥{{ orderDetail.serviceFee || '0.00' }}</el-descriptions-item>
            <el-descriptions-item label="总金额">
              <span class="primary-text font-bold">¥{{ orderDetail.totalAmount || '0.00' }}</span>
            </el-descriptions-item>
            <el-descriptions-item v-if="isTerminated" label="应退还金额">
              <span class="success-text font-bold">¥{{ calculateRefundAmount() }}</span>
              <el-tooltip content="未使用天数 × 日租金" placement="top">
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-descriptions-item>
          </el-descriptions>
          
          <!-- 房源和租户信息 -->
          <div class="additional-info mt-4">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card shadow="hover" class="info-card">
                  <template #header>
                    <div class="card-header">
                      <h3>房源信息</h3>
                      <el-button type="text" @click="viewHouseDetail(orderDetail.houseId)">
                        查看房源 <el-icon><ArrowRight /></el-icon>
                      </el-button>
                    </div>
                  </template>
                  <div class="house-info" v-if="orderDetail.houseInfo">
                    <div class="house-title">{{ orderDetail.houseInfo.title }}</div>
                    <div class="house-address">
                      <el-icon><Location /></el-icon>
                      {{ orderDetail.houseInfo.address }}
                    </div>
                    <div class="house-specs">
                      {{ orderDetail.houseInfo.area }}㎡ | 
                      {{ orderDetail.houseInfo.bedroomCount }}室{{ orderDetail.houseInfo.livingRoomCount }}厅{{ orderDetail.houseInfo.bathroomCount }}卫
                    </div>
                  </div>
                </el-card>
              </el-col>
              
              <el-col :span="12">
                <el-card shadow="hover" class="info-card">
                  <template #header>
                    <div class="card-header">
                      <h3>租户信息</h3>
                    </div>
                  </template>
                  <div class="tenant-info" v-if="orderDetail.userInfo">
                    <p><strong>姓名:</strong> {{ orderDetail.userInfo.realName || orderDetail.userInfo.nickname || orderDetail.userInfo.username }}</p>
                    <p><strong>联系电话:</strong> {{ orderDetail.userInfo.phone || orderDetail.userPhone || '未提供' }}</p>
                    <p><strong>邮箱:</strong> {{ orderDetail.userInfo.email || '未提供' }}</p>
                    <p><strong>身份证号:</strong> {{ orderDetail.userInfo.idCard || orderDetail.userIdCard || '未提供' }}</p>
                    <p v-if="orderDetail.userInfo.emergencyContact"><strong>紧急联系人:</strong> {{ orderDetail.userInfo.emergencyContact }}</p>
                    <p v-if="orderDetail.userInfo.emergencyPhone"><strong>紧急联系电话:</strong> {{ orderDetail.userInfo.emergencyPhone }}</p>
                  </div>
                  <div class="tenant-info" v-else>
                    <p><strong>姓名:</strong> {{ orderDetail.userName || orderDetail.userRealName || '未提供' }}</p>
                    <p><strong>联系电话:</strong> {{ orderDetail.userPhone || '未提供' }}</p>
                    <p v-if="orderDetail.userEmail"><strong>邮箱:</strong> {{ orderDetail.userEmail }}</p>
                    <p v-if="orderDetail.userIdCard"><strong>身份证号:</strong> {{ orderDetail.userIdCard }}</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Location, 
  ArrowRight, 
  QuestionFilled 
} from '@element-plus/icons-vue'
import { getLandlordOrderDetail } from '@/api/order'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const error = ref(false)
const orderDetail = ref(null)

// 计算属性：是否是退租状态
const isTerminated = computed(() => {
  if (!orderDetail.value) return false
  const terminatedStatuses = ['TERMINATED', 'TERMINATE_APPROVED']
  return terminatedStatuses.includes(orderDetail.value.status)
})

// 获取订单详情
const fetchOrderDetail = async () => {
  const orderId = route.params.id
  if (!orderId) {
    error.value = true
    return
  }
  
  loading.value = true
  error.value = false
  
  try {
    const res = await getLandlordOrderDetail(orderId)
    if (res.code === 200 && res.data) {
      orderDetail.value = res.data
      console.log('订单详情:', orderDetail.value)

      // 调试日志：检查租户信息是否存在
      if (orderDetail.value.userInfo) {
        console.log('租户信息存在:', orderDetail.value.userInfo)
      } else {
        console.log('未接收到租户信息，尝试从API响应中提取')
        
        // 尝试从API响应中提取租户信息并构建userInfo对象
        const userInfo = {
          realName: orderDetail.value.userRealName || orderDetail.value.userName,
          nickname: orderDetail.value.userName,
          username: orderDetail.value.userName,
          phone: orderDetail.value.userPhone,
          email: orderDetail.value.userEmail || '',
          idCard: orderDetail.value.userIdCard || ''
        }
        
        // 将提取的用户信息添加到orderDetail
        orderDetail.value.userInfo = userInfo
        console.log('构建的租户信息:', orderDetail.value.userInfo)
      }

      // 调试日志：检查房源信息是否存在
      if (!orderDetail.value.houseInfo) {
        console.log('未接收到房源信息，尝试从API响应中提取')
        
        // 尝试从API响应中提取房源信息并构建houseInfo对象
        const houseInfo = {
          title: orderDetail.value.houseTitle,
          address: orderDetail.value.houseAddress,
          coverImage: orderDetail.value.houseCoverImage || orderDetail.value.houseImage
        }
        
        // 将提取的房源信息添加到orderDetail
        orderDetail.value.houseInfo = houseInfo
        console.log('构建的房源信息:', orderDetail.value.houseInfo)
      }
    } else {
      error.value = true
      ElMessage.error(res.message || '获取订单详情失败')
    }
  } catch (err) {
    console.error('获取订单详情出错:', err)
    error.value = true
    ElMessage.error('获取订单详情失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '暂无'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '暂无'
  const date = new Date(dateStr)
  return `${formatDate(dateStr)} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    'UNPAID': 'info',
    'PAID': 'success',
    'CANCELLED': 'danger',
    'PAYMENT_CANCELLED': 'warning',
    'REFUNDING': 'warning',
    'REFUNDED': 'info',
    'COMPLETED': 'success',
    'TERMINATE_REQUESTED': 'warning',
    'TERMINATE_APPROVED': 'warning',
    'TERMINATED': 'info'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'UNPAID': '待支付',
    'PAID': '已支付',
    'CANCELLED': '已取消',
    'PAYMENT_CANCELLED': '取消支付',
    'REFUNDING': '退款中',
    'REFUNDED': '已退款',
    'COMPLETED': '已完成',
    'TERMINATE_REQUESTED': '申请退租',
    'TERMINATE_APPROVED': '退租待确认',
    'TERMINATED': '已退租'
  }
  return statusMap[status] || status
}

// 计算总天数
const calculateTotalDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 计算实际天数
const calculateActualDays = (startDate, actualTerminateDate) => {
  if (!startDate || !actualTerminateDate) return 0
  const start = new Date(startDate)
  const terminateDate = new Date(actualTerminateDate)
  
  // 确保计算的是从开始日期到实际退租日期（包含退租当天）
  const diffTime = Math.abs(terminateDate - start)
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // 加1是为了包含退租当天
  
  console.log(`计算实际租期: 从 ${formatDate(startDate)} 到 ${formatDate(actualTerminateDate)}, 共 ${days} 天`)
  return days
}

// 计算剩余天数
const calculateRemainingDays = (actualTerminateDate, endDate) => {
  if (!actualTerminateDate || !endDate) return 0
  const terminateDate = new Date(actualTerminateDate)
  const end = new Date(endDate)
  
  // 如果实际退租日期晚于租约结束日期，返回0
  if (terminateDate >= end) {
    console.log(`实际退租日期 ${formatDate(actualTerminateDate)} 晚于或等于租约结束日期 ${formatDate(endDate)}, 剩余天数为0`)
    return 0
  }
  
  // 计算从实际退租日期（不包含当天）到租约结束日期的天数
  const terminateNextDay = new Date(terminateDate)
  terminateNextDay.setDate(terminateDate.getDate() + 1) // 从实际退租日期的下一天开始算
  
  const diffTime = Math.abs(end - terminateNextDay)
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  console.log(`计算剩余天数: 从 ${formatDate(terminateNextDay)} 到 ${formatDate(endDate)}, 共 ${days} 天`)
  return days
}

// 计算应退还金额
const calculateRefundAmount = () => {
  if (!orderDetail.value) return '0.00'
  
  const {startDate, endDate, actualTerminateDate, monthlyRent, totalAmount, deposit} = orderDetail.value
  if (!startDate || !endDate || !actualTerminateDate || !monthlyRent) return '0.00'
  
  // 计算剩余天数 - 从实际退租日期后一天到租约结束日期
  const remainingDays = calculateRemainingDays(actualTerminateDate, endDate)
  
  // 如果没有剩余天数，返回0
  if (remainingDays <= 0) {
    console.log('没有剩余天数，应退还金额为0')
    return '0.00'
  }
  
  // 计算总天数
  const totalDays = calculateTotalDays(startDate, endDate)
  
  // 计算每日租金 - 使用月租金除以30作为每日租金
  const dailyRent = monthlyRent / 30
  
  // 计算退款金额 = 每日租金 × 剩余天数
  const refundAmount = dailyRent * remainingDays
  
  console.log(`计算退款金额详情:`)
  console.log(`- 租期: ${formatDate(startDate)} 至 ${formatDate(endDate)}, 共${totalDays}天`)
  console.log(`- 实际租期: ${formatDate(startDate)} 至 ${formatDate(actualTerminateDate)}`)
  console.log(`- 剩余未使用天数: ${remainingDays}天 (从${formatDate(new Date(new Date(actualTerminateDate).getTime() + 86400000))}开始)`)
  console.log(`- 月租金: ¥${monthlyRent}, 每日租金: ¥${dailyRent.toFixed(2)}`)
  console.log(`- 退款金额: ¥${refundAmount.toFixed(2)} = ¥${dailyRent.toFixed(2)}/天 × ${remainingDays}天`)
  
  return refundAmount.toFixed(2)
}

// 查看房源详情
const viewHouseDetail = (id) => {
  router.push(`/landlord/house/detail/${id}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 生命周期钩子
onMounted(() => {
  fetchOrderDetail()
})
</script>

<style scoped>
.order-detail-container {
  padding: 20px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2, .card-header h3 {
  margin: 0;
}

.mt-4 {
  margin-top: 20px;
}

.ml-1 {
  margin-left: 5px;
}

.ml-2 {
  margin-left: 10px;
}

.primary-text {
  color: #409EFF;
}

.success-text {
  color: #67C23A;
}

.warning-text {
  color: #E6A23C;
}

.font-bold {
  font-weight: bold;
}

.house-info, .tenant-info {
  padding: 10px 0;
}

.house-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.house-address, .house-specs {
  color: #666;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.house-address .el-icon {
  margin-right: 5px;
}

.info-card {
  height: 100%;
}
</style> 