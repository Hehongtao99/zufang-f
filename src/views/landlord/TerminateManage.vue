<template>
  <div class="terminate-manage-page">
    <el-card class="terminate-card">
      <template #header>
        <div class="card-header">
          <h2>退租管理</h2>
          <div class="header-right">
            <el-select v-model="queryParams.status" placeholder="退租状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="申请中" value="TERMINATE_REQUESTED" />
              <el-option label="已批准" value="TERMINATE_APPROVED" />
              <el-option label="已退租" value="TERMINATED" />
              <el-option label="已拒绝" value="TERMINATE_REJECTED" />
            </el-select>
            <el-button type="primary" @click="fetchTerminateRequests">查询</el-button>
          </div>
        </div>
      </template>
      
      <el-alert
        v-if="error"
        title="获取数据失败"
        type="error"
        description="连接服务器时发生错误，请稍后再试"
        closable
        show-icon
      />
      
      <div v-loading="loading">
        <div v-if="terminateList.length === 0 && !loading" class="empty-result">
          <el-empty description="暂无退租申请" />
        </div>
        
        <el-table v-else :data="terminateList" style="width: 100%">
          <el-table-column prop="orderNo" label="订单编号" width="120" />
          
          <el-table-column label="房源信息" min-width="250">
            <template #default="scope">
              <div class="house-info-cell">
                <el-image 
                  :src="scope.row.houseCoverImage" 
                  fit="cover"
                  class="house-cover"
                  @click="viewHouseDetail(scope.row.houseId)"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><picture-failed /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="house-info">
                  <h3 class="house-title" @click="viewHouseDetail(scope.row.houseId)">{{ scope.row.houseTitle }}</h3>
                  <div class="house-location">
                    <el-icon><location /></el-icon>
                    <span>{{ scope.row.houseAddress }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="租客信息" width="160">
            <template #default="scope">
              <div>
                <p><strong>姓名:</strong> {{ scope.row.userName }}</p>
                <p><strong>电话:</strong> {{ scope.row.userPhone || '未提供' }}</p>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="退租详情" min-width="250">
            <template #default="scope">
              <div>
                <p><strong>退租原因:</strong> 
                  <el-tooltip 
                    effect="dark" 
                    content="如果退租原因不正确，请点击查看订单获取完整信息" 
                    placement="top"
                  >
                    <span>{{ getTerminateReason(scope.row) }}</span>
                  </el-tooltip>
                </p>
                <p><strong>申请时间:</strong> {{ formatDateTime(getTerminateRequestTime(scope.row)) }}</p>
                <p><strong>期望退租日期:</strong> {{ formatDate(getExpectedTerminateDate(scope.row)) }}</p>
                <p v-if="scope.row.actualTerminateDate"><strong>实际退租日期:</strong> {{ formatDate(scope.row.actualTerminateDate) }}</p>
                <p v-if="scope.row.terminateRejectReason"><strong>拒绝原因:</strong> {{ scope.row.terminateRejectReason }}</p>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="剩余租期" width="180">
            <template #default="scope">
              <div>
                <p><strong>原租期:</strong> {{ formatDate(scope.row.leaseStartDate) }} 至 {{ formatDate(scope.row.leaseEndDate) }}</p>
                <p><strong>期望退租:</strong> {{ formatDate(getExpectedTerminateDate(scope.row)) }}</p>
                <p><strong>剩余天数:</strong> {{ calculateSmartRemainingDays(scope.row) }} 天</p>
                <p><strong>违约金:</strong> ¥{{ scope.row.penaltyAmount || calculateSmartPenalty(scope.row) }}</p>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <div class="button-group">
                <div v-if="scope.row.status === 'TERMINATE_REQUESTED'">
                  <el-button type="success" @click="handleApprove(scope.row)">批准</el-button>
                  <el-button type="danger" @click="handleReject(scope.row)">拒绝</el-button>
                </div>
                <div v-else-if="scope.row.status === 'TERMINATE_APPROVED'">
                  <el-button type="primary" @click="handleConfirmTermination(scope.row)">确认退租</el-button>
                </div>
                <el-button type="info" link @click="viewOrderDetail(scope.row.orderId)">查看订单</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :background="true"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
    
    <!-- 拒绝退租对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝退租申请"
      width="500px"
    >
      <!-- 添加申请信息展示区域 -->
      <el-descriptions title="退租申请信息" :column="1" border>
        <el-descriptions-item label="订单ID">{{ rejectForm.orderId }}</el-descriptions-item>
        <el-descriptions-item label="退租原因">{{ rejectForm.terminateReason }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDateTime(rejectForm.terminateRequestTime) }}</el-descriptions-item>
        <el-descriptions-item label="期望退租日期">{{ formatDate(rejectForm.expectedTerminateDate) }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider content-position="center">拒绝理由</el-divider>
      
      <el-form :model="rejectForm" label-width="120px">
        <el-form-item label="拒绝原因" required>
          <el-input 
            v-model="rejectForm.reason" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入拒绝原因"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReject" :disabled="!rejectForm.reason">确认拒绝</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批准退租对话框 -->
    <el-dialog
      v-model="approveDialogVisible"
      title="批准退租申请"
      width="500px"
    >
      <div v-if="currentTerminate">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <p>
            <strong>批准退租将向租客发送通知并允许租客退租。</strong><br>
            请设置实际退租日期和违约金金额，这将影响退款计算。
          </p>
        </el-alert>
        
        <el-divider content-position="center">退租申请信息</el-divider>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="申请原因">{{ currentTerminate.terminateReason }}</el-descriptions-item>
          <el-descriptions-item label="租客期望退租日">
            <strong>{{ formatDate(currentTerminate.expectedTerminateDate) }}</strong>
          </el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatDateTime(currentTerminate.terminateRequestTime) }}</el-descriptions-item>
          <el-descriptions-item label="租约期限">
            {{ formatDate(currentTerminate.leaseStartDate || currentTerminate.startDate) }} 至 
            {{ formatDate(currentTerminate.leaseEndDate || currentTerminate.endDate) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="center">退租设置</el-divider>
        <el-form label-width="150px" class="mt-4">
          <el-form-item 
            label="实际退租日期" 
            required
            :rules="[{ required: true, message: '请选择实际退租日期' }]"
          >
            <el-date-picker
              v-model="actualTerminateDate"
              type="date"
              placeholder="选择实际退租日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="updateCalculations"
            ></el-date-picker>
            <div class="form-item-tip">
              实际退租日期（含当天）到租约结束日期的租金将退还给租客
            </div>
          </el-form-item>
          
          <el-descriptions :column="1" border class="calculation-result">
            <el-descriptions-item label="月租金">
              ¥{{ currentTerminate.monthlyRent || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="剩余租期">
              <strong>{{ calculatedRemainingDays }}</strong> 天
            </el-descriptions-item>
            <el-descriptions-item label="应退租金">
              <strong class="refund-amount">¥{{ calculatedRefundAmount }}</strong>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-form-item 
            label="违约金金额"
            :rules="[{ type: 'number', message: '请输入有效的金额' }]"
          >
            <el-input-number
              v-model="penaltyAmount"
              :min="0"
              :precision="2"
              :step="100"
            ></el-input-number>
            <div class="form-item-tip">
              违约金默认为剩余租金的30%，您可以根据情况调整
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApprove" :disabled="!actualTerminateDate">确认批准</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, PictureRounded as PictureFailed } from '@element-plus/icons-vue'
import { 
  handleTerminateRequest, 
  confirmTermination, 
  getTerminateRequests, 
  getUserOrderDetail, 
  getLandlordOrderDetail,
  getTerminateDetail
} from '@/api/order'

const router = useRouter()
const loading = ref(false)
const error = ref(false)
const terminateList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 查询参数
const queryParams = reactive({
  status: ''
})

// 拒绝对话框
const rejectDialogVisible = ref(false)
const rejectForm = reactive({
  orderId: null,
  reason: '',
  terminateReason: '',
  terminateRequestTime: '',
  expectedTerminateDate: ''
})

// 批准对话框
const approveDialogVisible = ref(false)
const currentTerminate = ref(null)
const actualTerminateDate = ref('')
const penaltyAmount = ref(0)

// 新增用于显示的计算结果变量
const calculatedRemainingDays = ref(0);
const calculatedRefundAmount = ref('0.00');

// 获取退租申请列表
const fetchTerminateRequests = async () => {
  loading.value = true
  error.value = false
  try {
    const res = await getTerminateRequests({
      page: currentPage.value,
      size: pageSize.value,
      status: queryParams.status || null
    })
    
    if (res.code === 200) {
      // 处理返回的数据，确保字段一致性
      const records = res.data.records || [];
      terminateList.value = records.map(record => {
        // 添加调试信息
        console.log('原始记录:', record);
        
        // 使用字段映射转换
        return transformTerminateRecord(record);
      });
      
      total.value = res.data.total || 0
    } else {
      error.value = true
      ElMessage.error(res.message || '获取退租申请列表失败')
    }
  } catch (error) {
    console.error('获取退租申请列表失败:', error)
    error.value = true
    ElMessage.error('获取退租申请列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 数据转换函数 - 确保字段一致性
const transformTerminateRecord = (record) => {
  // 打印所有字段，帮助调试
  console.log('原始记录所有字段名:', Object.keys(record));
  console.log('原始记录完整内容:', JSON.stringify(record));
  
  // 保留原始数据的同时，添加或重命名必要字段
  const transformed = { ...record };
  
  // 确保orderId字段存在
  if (!transformed.orderId && transformed.id) {
    transformed.orderId = transformed.id;
  }
  
  // 添加更全面的字段名检查 - 退租原因
  const possibleReasonFields = [
    'terminateReason',    // 首选字段名
    'terminationReason',  // 替代字段名
    'reasonForTermination',
    'reason',
    'terminateRemarks',
    'terminationRemarks',
    'remarks',
    'comment'
  ];
  
  for (const field of possibleReasonFields) {
    if (record[field] && !transformed.terminateReason) {
      transformed.terminateReason = record[field];
      console.log(`找到退租原因字段: ${field} = ${record[field]}`);
      break;
    }
  }
  
  // 添加更全面的字段名检查 - 申请时间
  const possibleRequestTimeFields = [
    'terminateRequestTime',     // 首选字段名
    'terminationRequestTime',   // 替代字段名
    'requestTime',
    'applicationTime',
    'applyTime',
    'createTime',
    'createDate',
    'createdAt',
    'createAt',
    'terminateTime',
    'terminationTime',
    'requestDate',
    'terminateDate'
  ];
  
  for (const field of possibleRequestTimeFields) {
    if (record[field] && !transformed.terminateRequestTime) {
      transformed.terminateRequestTime = record[field];
      console.log(`找到申请时间字段: ${field} = ${record[field]}`);
      break;
    }
  }
  
  // 添加更全面的字段名检查 - 期望退租日期
  const possibleExpectedDateFields = [
    'expectedTerminateDate',     // 首选字段名
    'expectedTerminationDate',   // 替代字段名
    'expectedDate',
    'planTerminateDate',
    'plannedTerminationDate',
    'terminatePlanDate',
    'terminationPlanDate',
    'expectedEndDate',
    'endDate'
  ];
  
  for (const field of possibleExpectedDateFields) {
    if (record[field] && !transformed.expectedTerminateDate) {
      transformed.expectedTerminateDate = record[field];
      console.log(`找到期望退租日期字段: ${field} = ${record[field]}`);
      break;
    }
  }
  
  // 检查嵌套对象中的字段
  const nestedObjects = ['termination', 'terminateInfo', 'terminationInfo', 'info'];
  for (const objName of nestedObjects) {
    if (record[objName] && typeof record[objName] === 'object') {
      const nestedObj = record[objName];
      console.log(`发现嵌套对象 ${objName}:`, nestedObj);
      
      // 检查退租原因
      if (!transformed.terminateReason) {
        for (const field of possibleReasonFields) {
          if (nestedObj[field]) {
            transformed.terminateReason = nestedObj[field];
            console.log(`从嵌套对象找到退租原因: ${objName}.${field} = ${nestedObj[field]}`);
            break;
          }
        }
      }
      
      // 检查申请时间
      if (!transformed.terminateRequestTime) {
        for (const field of possibleRequestTimeFields) {
          if (nestedObj[field]) {
            transformed.terminateRequestTime = nestedObj[field];
            console.log(`从嵌套对象找到申请时间: ${objName}.${field} = ${nestedObj[field]}`);
            break;
          }
        }
      }
      
      // 检查期望退租日期
      if (!transformed.expectedTerminateDate) {
        for (const field of possibleExpectedDateFields) {
          if (nestedObj[field]) {
            transformed.expectedTerminateDate = nestedObj[field];
            console.log(`从嵌套对象找到期望退租日期: ${objName}.${field} = ${nestedObj[field]}`);
            break;
          }
        }
      }
    }
  }
  
  // 确保字段至少有默认值
  transformed.terminateReason = transformed.terminateReason || '未提供';
  transformed.terminateRequestTime = transformed.terminateRequestTime || '';
  transformed.expectedTerminateDate = transformed.expectedTerminateDate || '';
  
  console.log('转换后记录:', transformed);
  return transformed;
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchTerminateRequests()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchTerminateRequests()
}

// 查看房源详情
const viewHouseDetail = (id) => {
  router.push(`/landlord/house/detail/${id}`)
}

// 查看订单详情
const viewOrderDetail = (id) => {
  router.push(`/landlord/order/detail/${id}`)
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
  switch (status) {
    case 'TERMINATE_REQUESTED':
      return 'warning'
    case 'TERMINATE_APPROVED':
      return 'success'
    case 'TERMINATED':
      return 'info'
    case 'TERMINATE_REJECTED':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'TERMINATE_REQUESTED':
      return '申请中'
    case 'TERMINATE_APPROVED':
      return '已批准'
    case 'TERMINATED':
      return '已退租'
    case 'TERMINATE_REJECTED':
      return '已拒绝'
    default:
      return '状态' + status
  }
}

// 计算剩余天数
const calculateSmartRemainingDays = (record) => {
  try {
    console.log('计算剩余天数，原始记录:', record);
    
    // 获取期望退租日期
    const expectedDate = getExpectedTerminateDate(record);
    console.log('期望退租日期:', expectedDate);
    
    // 获取租期结束日期
    const endDate = record.leaseEndDate || record.endDate;
    console.log('租期结束日期:', endDate);
    
    if (!expectedDate || !endDate) {
      console.warn('缺少计算所需日期信息');
      return 0;
    }
    
    // 解析日期
    const expectedDateObj = new Date(expectedDate);
    const endDateObj = new Date(endDate);
    
    // 计算毫秒差并转换为天数
    const timeDiff = endDateObj.getTime() - expectedDateObj.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // 确保返回非负数
    return Math.max(0, daysDiff);
  } catch (error) {
    console.error('计算剩余天数时出错:', error);
    return 0;
  }
}

// 计算违约金
const calculateSmartPenalty = (record) => {
  try {
    console.log('计算违约金，原始记录:', record);
    
    // 如果已有违约金，直接返回
    if (record.penaltyAmount && !isNaN(parseFloat(record.penaltyAmount))) {
      return parseFloat(record.penaltyAmount).toFixed(2);
    }
    
    // 获取月租金
    const monthlyRent = parseFloat(record.monthlyRent || 0);
    if (!monthlyRent) {
      console.warn('无法获取月租金信息');
      return '0.00';
    }
    
    // 获取剩余天数和总租期
    const remainingDays = calculateSmartRemainingDays(record);
    console.log('剩余天数:', remainingDays);
    
    const totalDays = record.leaseTerm * 30; // 估算总租期，以月为单位
    console.log('估算总租期(天):', totalDays);
    
    // 如果没有剩余天数，违约金为0
    if (remainingDays <= 0) {
      return '0.00';
    }
    
    // 计算日租金
    const dailyRent = monthlyRent / 30;
    
    // 计算剩余租金
    const remainingRent = dailyRent * remainingDays;
    
    // 违约金为剩余租金的30%（可根据实际业务规则调整）
    const penaltyRate = record.penaltyRate || 0.3;
    const penalty = remainingRent * penaltyRate;
    
    // 设置最低违约金（如果有）
    const minPenalty = parseFloat(record.minPenalty || 0);
    const finalPenalty = Math.max(penalty, minPenalty);
    
    console.log('计算的违约金:', finalPenalty.toFixed(2));
    return finalPenalty.toFixed(2);
  } catch (error) {
    console.error('计算违约金时出错:', error);
    return '0.00';
  }
}

// 帮助函数：获取退租原因，检查多个可能的字段和嵌套对象
const getTerminateReason = (record) => {
  console.log('获取退租原因，原始记录:', record);
  console.log('记录字段名:', Object.keys(record));
  
  // 检查直接字段 - 退租原因
  const directFields = [
    'terminateReason',
    'reason',
    'terminationReason',
    'remark',
    'remarks',
    'terminateMessage',
    'message',
    'reasonForTermination',
    'comments',
    'content',
    'terminateRemarks'
  ];
  
  // 先检查直接字段
  for (const field of directFields) {
    if (record[field] && record[field].trim() !== '') {
      console.log(`直接找到退租原因字段: ${field} = ${record[field]}`);
      return record[field];
    }
  }
  
  // 检查所有可能的嵌套对象中的所有可能字段
  const nestedFields = [
    'terminateDetail',
    'terminateRequest',
    'terminateInfo',
    'terminationDetail',
    'terminationRequest',
    'terminationInfo',
    'detail',
    'request',
    'info',
    'terminate',
    'termination',
    'application',
    'data'
  ];
  
  for (const nestedField of nestedFields) {
    const nestedObj = record[nestedField];
    if (nestedObj && typeof nestedObj === 'object') {
      console.log(`检查嵌套对象 ${nestedField}:`, nestedObj);
      
      for (const field of directFields) {
        if (nestedObj[field] && nestedObj[field].trim() !== '') {
          console.log(`从嵌套对象 ${nestedField} 找到退租原因字段: ${field} = ${nestedObj[field]}`);
          return nestedObj[field];
        }
      }
    }
  }
  
  // 尝试一些特殊模式
  if (record.application && record.application.reason) {
    return record.application.reason;
  }
  
  if (record.terminateApplication && record.terminateApplication.reason) {
    return record.terminateApplication.reason;
  }
  
  // 遍历记录的所有顶级字段，查找嵌套对象中的reason
  for (const key in record) {
    const value = record[key];
    if (value && typeof value === 'object') {
      if (value.reason && value.reason.trim() !== '') {
        console.log(`从字段 ${key} 找到退租原因: ${value.reason}`);
        return value.reason;
      }
      
      // 二层嵌套
      for (const subKey in value) {
        const subValue = value[subKey];
        if (subValue && typeof subValue === 'object' && subValue.reason && subValue.reason.trim() !== '') {
          console.log(`从二层嵌套字段 ${key}.${subKey} 找到退租原因: ${subValue.reason}`);
          return subValue.reason;
        }
      }
    }
  }
  
  return '未提供';
}

// 帮助函数：获取申请时间，检查多个可能的字段和嵌套对象
const getTerminateRequestTime = (record) => {
  // 先检查直接字段
  if (record.terminateRequestTime) return record.terminateRequestTime;
  
  // 检查嵌套对象
  if (record.terminateDetail?.requestTime) return record.terminateDetail.requestTime;
  if (record.terminateRequest?.requestTime) return record.terminateRequest.requestTime;
  if (record.terminateInfo?.requestTime) return record.terminateInfo.requestTime;
  
  // 检查替代字段名
  if (record.requestTime) return record.requestTime;
  if (record.createTime) return record.createTime;
  if (record.terminationRequestTime) return record.terminationRequestTime;
  
  return '';
}

// 帮助函数：获取期望退租日期，检查多个可能的字段和嵌套对象
const getExpectedTerminateDate = (record) => {
  console.log('获取期望退租日期，原始记录:', record);
  
  // 检查日期是否是租期结束日期，如果是，尝试寻找其他字段
  const isLeaseEndDate = record.expectedTerminateDate === record.leaseEndDate;
  if (isLeaseEndDate) {
    console.log('期望退租日期与租期结束日期相同，尝试寻找其他字段');
  }
  
  // 直接字段 - 期望退租日期
  const directFields = [
    'expectedTerminateDate',
    'expectedDate',
    'expectedTerminationDate',
    'terminateDate',
    'terminationDate',
    'plannedTerminateDate',
    'planTerminateDate',
    'planDate',
    'userExpectedDate',
    'expectedEndDate',
    'endDate',
    'requestedTerminateDate'
  ];
  
  // 特殊情况：如果当前日期与租期结束日期相同，优先尝试其他字段
  if (isLeaseEndDate) {
    // 跳过 expectedTerminateDate 字段，先尝试其他字段
    for (let i = 1; i < directFields.length; i++) {
      const field = directFields[i];
      if (record[field] && record[field] !== record.leaseEndDate) {
        console.log(`找到非租期结束日期的期望退租日期字段: ${field} = ${record[field]}`);
        return record[field];
      }
    }
  } else {
    // 正常情况下，按顺序检查所有字段
    for (const field of directFields) {
      if (record[field]) {
        console.log(`直接找到期望退租日期字段: ${field} = ${record[field]}`);
        return record[field];
      }
    }
  }
  
  // 检查所有可能的嵌套对象中的所有可能字段
  const nestedFields = [
    'terminateDetail',
    'terminateRequest',
    'terminateInfo',
    'terminationDetail',
    'terminationRequest',
    'terminationInfo',
    'detail',
    'request',
    'info',
    'terminate',
    'termination',
    'application',
    'data'
  ];
  
  for (const nestedField of nestedFields) {
    const nestedObj = record[nestedField];
    if (nestedObj && typeof nestedObj === 'object') {
      console.log(`检查嵌套对象 ${nestedField}:`, nestedObj);
      
      for (const field of directFields) {
        if (nestedObj[field] && (!isLeaseEndDate || nestedObj[field] !== record.leaseEndDate)) {
          console.log(`从嵌套对象 ${nestedField} 找到期望退租日期字段: ${field} = ${nestedObj[field]}`);
          return nestedObj[field];
        }
      }
      
      // 还可以检查特定的字段名，比如expectedDate
      if (nestedObj.expectedDate && (!isLeaseEndDate || nestedObj.expectedDate !== record.leaseEndDate)) {
        console.log(`从嵌套对象 ${nestedField} 找到期望退租日期字段: expectedDate = ${nestedObj.expectedDate}`);
        return nestedObj.expectedDate;
      }
    }
  }
  
  // 尝试一些特殊模式
  if (record.application && record.application.expectedDate && 
      (!isLeaseEndDate || record.application.expectedDate !== record.leaseEndDate)) {
    return record.application.expectedDate;
  }
  
  if (record.terminateApplication && record.terminateApplication.expectedDate && 
      (!isLeaseEndDate || record.terminateApplication.expectedDate !== record.leaseEndDate)) {
    return record.terminateApplication.expectedDate;
  }
  
  // 遍历记录的所有顶级字段，查找嵌套对象中的期望日期
  for (const key in record) {
    const value = record[key];
    if (value && typeof value === 'object') {
      // 检查所有可能的日期字段名
      for (const dateField of directFields) {
        if (value[dateField] && (!isLeaseEndDate || value[dateField] !== record.leaseEndDate)) {
          console.log(`从字段 ${key} 找到期望退租日期: ${value[dateField]}`);
          return value[dateField];
        }
      }
      
      // 二层嵌套
      for (const subKey in value) {
        const subValue = value[subKey];
        if (subValue && typeof subValue === 'object') {
          for (const dateField of directFields) {
            if (subValue[dateField] && (!isLeaseEndDate || subValue[dateField] !== record.leaseEndDate)) {
              console.log(`从二层嵌套字段 ${key}.${subKey} 找到期望退租日期: ${subValue[dateField]}`);
              return subValue[dateField];
            }
          }
        }
      }
    }
  }
  
  // 如果所有尝试都失败，返回原始的expectedTerminateDate
  return record.expectedTerminateDate || '';
}

// 更新计算结果的方法
const updateCalculations = () => {
  if (!currentTerminate.value || !actualTerminateDate.value) {
    calculatedRemainingDays.value = 0;
    calculatedRefundAmount.value = '0.00';
    return;
  }
  
  try {
    // 获取租期结束日期
    const endDate = currentTerminate.value.leaseEndDate || currentTerminate.value.endDate;
    
    if (!endDate) {
      console.warn('缺少租期结束日期信息');
      return;
    }
    
    // 解析日期
    const endDateObj = new Date(endDate);
    const actualDateObj = new Date(actualTerminateDate.value);
    
    // 计算毫秒差并转换为天数
    const timeDiff = endDateObj.getTime() - actualDateObj.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // 确保返回非负数
    calculatedRemainingDays.value = Math.max(0, daysDiff);
    
    // 计算退款金额
    const monthlyRent = parseFloat(currentTerminate.value.monthlyRent || 0);
    const dailyRent = monthlyRent / 30;
    calculatedRefundAmount.value = (dailyRent * calculatedRemainingDays.value).toFixed(2);
    
    console.log('更新计算结果 - 剩余天数:', calculatedRemainingDays.value);
    console.log('更新计算结果 - 退款金额:', calculatedRefundAmount.value);
    
    // 更新违约金建议值 (30% 的剩余租金)
    if (calculatedRemainingDays.value > 0) {
      const suggestedPenalty = parseFloat(calculatedRefundAmount.value) * 0.3;
      // 只有当没有手动修改过时才更新
      if (!penaltyAmount.value || penaltyAmount.value === 0) {
        penaltyAmount.value = Math.round(suggestedPenalty * 100) / 100; // 四舍五入到分
      }
    }
  } catch (error) {
    console.error('计算剩余天数和退款金额时出错:', error);
    calculatedRemainingDays.value = 0;
    calculatedRefundAmount.value = '0.00';
  }
};

// 处理批准退租
const handleApprove = async (terminate) => {
  console.log('批准退租，接收到的订单数据：', terminate);
  
  try {
    // 详细记录原始数据
    console.log('退租记录字段列表:', Object.keys(terminate));
    console.log('退租记录详细内容:', JSON.stringify(terminate, null, 2));
    
    // 记录源数据中的关键字段
    console.log('原始记录中的重要字段:');
    console.log('订单ID:', terminate.orderId || terminate.id);
    console.log('租期开始日期:', terminate.leaseStartDate || terminate.startDate);
    console.log('租期结束日期:', terminate.leaseEndDate || terminate.endDate);
    console.log('期望退租日期:', getExpectedTerminateDate(terminate));
    console.log('月租金:', terminate.monthlyRent);
    
    // 构建更完整的数据
    const mergedData = { ...terminate };
    
    // 确保有订单ID
    if (!mergedData.orderId && mergedData.id) {
      mergedData.orderId = mergedData.id;
    }
    
    // 确保有租期信息
    if (!mergedData.leaseStartDate && mergedData.startDate) {
      mergedData.leaseStartDate = mergedData.startDate;
    }
    
    if (!mergedData.leaseEndDate && mergedData.endDate) {
      mergedData.leaseEndDate = mergedData.endDate;
    }
    
    // 设置默认退租日期为期望退租日期
    const expectedDate = getExpectedTerminateDate(mergedData);
    actualTerminateDate.value = expectedDate || '';
    
    // 将转换后的数据保存到 currentTerminate
    currentTerminate.value = mergedData;
    
    // 打开对话框
    approveDialogVisible.value = true;
    
    // 初始计算结果
    setTimeout(() => {
      updateCalculations();
    }, 100);
  } catch (error) {
    console.error('处理批准退租时出错:', error);
    ElMessage.error('处理退租请求时出错');
  }
}

// 处理拒绝退租
const handleReject = async (terminate) => {
  console.log('处理拒绝退租，接收到的订单数据：', terminate);
  
  // 获取订单ID，优先使用orderId，如果没有则使用id
  const orderId = terminate?.orderId || terminate?.id;
  
  if (!orderId) {
    console.error('拒绝退租失败：缺少订单ID或订单数据', terminate);
    ElMessage.error('订单数据不完整，无法处理');
    return;
  }
  
  // 现在我们可以使用专门的退租详情API
  ElMessage.info('正在获取退租详情...');
  try {
    const detailRes = await getTerminateDetail(orderId);
    if (detailRes.code === 200 && detailRes.data) {
      console.log('从专门API获取到退租详情:', detailRes.data);
      processOrderDetail(terminate, detailRes.data);
      return;
    } else {
      console.warn('从专门API获取退租详情失败，尝试其他API:', detailRes);
    }
  } catch (error) {
    console.error('从专门API获取退租详情出错，尝试其他API:', error);
  }
  
  // 如果获取专门退租详情失败，退回到原来的方式
  // 尝试从API获取完整订单详情 - 优先使用房东API
  try {
    // 尝试使用房东API获取订单详情
    const detailRes = await getLandlordOrderDetail(orderId);
    if (detailRes.code === 200 && detailRes.data) {
      console.log('从房东API获取到完整订单详情:', detailRes.data);
      processOrderDetail(terminate, detailRes.data);
    } else {
      console.warn('从房东API获取订单详情失败，尝试用户API:', detailRes);
      // 如果房东API失败，尝试用户API
      try {
        const userDetailRes = await getUserOrderDetail(orderId);
        if (userDetailRes.code === 200 && userDetailRes.data) {
          console.log('从用户API获取到完整订单详情:', userDetailRes.data);
          processOrderDetail(terminate, userDetailRes.data);
        } else {
          console.warn('从用户API获取订单详情也失败，使用原始数据:', userDetailRes);
          fallbackToOriginalData(terminate);
        }
      } catch (error) {
        console.error('从用户API获取订单详情出错，使用原始数据:', error);
        fallbackToOriginalData(terminate);
      }
    }
  } catch (error) {
    console.error('从房东API获取订单详情出错，尝试用户API:', error);
    // 如果房东API出错，尝试用户API
    try {
      const userDetailRes = await getUserOrderDetail(orderId);
      if (userDetailRes.code === 200 && userDetailRes.data) {
        console.log('从用户API获取到完整订单详情:', userDetailRes.data);
        processOrderDetail(terminate, userDetailRes.data);
      } else {
        console.warn('从用户API获取订单详情也失败，使用原始数据:', userDetailRes);
        fallbackToOriginalData(terminate);
      }
    } catch (userError) {
      console.error('从用户API获取订单详情也出错，使用原始数据:', userError);
      fallbackToOriginalData(terminate);
    }
  }
}

// 处理获取到的订单详情
const processOrderDetail = (originalData, detailData) => {
  // 直接输出完整原始数据和详情数据，用于排查问题
  console.log('原始订单数据(完整):', JSON.stringify(originalData, null, 2));
  console.log('API返回的详情数据(完整):', JSON.stringify(detailData, null, 2));
  
  // 检查退租记录中的终止相关信息
  if (detailData.terminateDetail) {
    console.log('找到terminateDetail对象:', detailData.terminateDetail);
  }
  
  if (detailData.terminateRequest) {
    console.log('找到terminateRequest对象:', detailData.terminateRequest);
  }
  
  if (detailData.terminateInfo) {
    console.log('找到terminateInfo对象:', detailData.terminateInfo);
  }
  
  // 合并原始数据和详情数据，详情数据优先
  const mergedData = { ...originalData, ...detailData };
  
  // 创建特定字段的直接引用，确保重要信息被正确获取
  let terminateReasonValue = detailData.terminateReason || originalData.terminateReason || '未提供';
  let expectedTerminateDateValue = detailData.expectedTerminateDate || originalData.expectedTerminateDate || '';
  let terminateRequestTimeValue = detailData.terminateRequestTime || originalData.terminateRequestTime || '';
  
  // 检查各种可能的嵌套对象
  const possibleNestedObjects = [
    detailData.terminateDetail,
    detailData.terminateRequest,
    detailData.terminateInfo,
    originalData.terminateDetail,
    originalData.terminateRequest,
    originalData.terminateInfo
  ];
  
  // 从嵌套对象中提取字段
  for (const obj of possibleNestedObjects) {
    if (obj && typeof obj === 'object') {
      // 检查退租原因
      if (obj.reason && !terminateReasonValue) {
        terminateReasonValue = obj.reason;
        console.log('从嵌套对象中找到退租原因:', obj.reason);
      }
      
      // 检查期望退租日期
      if (obj.expectedDate && !expectedTerminateDateValue) {
        expectedTerminateDateValue = obj.expectedDate;
        console.log('从嵌套对象中找到期望退租日期:', obj.expectedDate);
      }
      
      // 检查申请时间
      if (obj.requestTime && !terminateRequestTimeValue) {
        terminateRequestTimeValue = obj.requestTime;
        console.log('从嵌套对象中找到申请时间:', obj.requestTime);
      }
    }
  }
  
  // 转换数据，但优先使用我们手动提取的关键字段
  const transformedTerminate = transformTerminateRecord(mergedData);
  
  // 覆盖转换结果中的关键字段
  if (terminateReasonValue !== '未提供') {
    transformedTerminate.terminateReason = terminateReasonValue;
  }
  
  if (expectedTerminateDateValue) {
    transformedTerminate.expectedTerminateDate = expectedTerminateDateValue;
  }
  
  if (terminateRequestTimeValue) {
    transformedTerminate.terminateRequestTime = terminateRequestTimeValue;
  }
  
  console.log('最终使用的值 - 退租原因:', transformedTerminate.terminateReason);
  console.log('最终使用的值 - 期望退租日期:', transformedTerminate.expectedTerminateDate);
  console.log('最终使用的值 - 申请时间:', transformedTerminate.terminateRequestTime);
  
  // 设置表单数据
  rejectForm.orderId = transformedTerminate.orderId;
  rejectForm.terminateReason = transformedTerminate.terminateReason;
  rejectForm.terminateRequestTime = transformedTerminate.terminateRequestTime;
  rejectForm.expectedTerminateDate = transformedTerminate.expectedTerminateDate;
  rejectForm.reason = '';
  
  console.log('拒绝表单数据：', rejectForm);
  rejectDialogVisible.value = true;
}

// 当获取详情失败时，回退到使用原始数据
const fallbackToOriginalData = (terminate) => {
  // 应用数据转换，确保字段一致性
  const transformedTerminate = transformTerminateRecord(terminate);
  
  rejectForm.orderId = transformedTerminate.orderId;
  rejectForm.terminateReason = transformedTerminate.terminateReason;
  rejectForm.terminateRequestTime = transformedTerminate.terminateRequestTime;
  rejectForm.expectedTerminateDate = transformedTerminate.expectedTerminateDate;
  rejectForm.reason = '';
  
  console.log('拒绝表单数据(使用原始数据)：', rejectForm);
  rejectDialogVisible.value = true;
}

// 提交拒绝
const submitReject = async () => {
  if (!rejectForm.reason.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  
  if (!rejectForm.orderId) {
    console.error('拒绝退租时缺少订单ID', rejectForm);
    ElMessage.error('订单信息不完整，无法处理');
    return;
  }
  
  const params = {
    orderId: rejectForm.orderId,
    approved: false,
    rejectReason: rejectForm.reason
  };
  
  console.log('发送拒绝退租请求参数:', params);
  
  try {
    ElMessage.info('正在提交拒绝请求...');
    const res = await handleTerminateRequest(params)
    
    if (res.code === 200) {
      ElMessage.success('退租申请已拒绝')
      rejectDialogVisible.value = false
      fetchTerminateRequests()
    } else {
      console.error('拒绝退租请求返回错误:', res);
      ElMessage.error(res.message || '拒绝退租申请失败')
    }
  } catch (error) {
    console.error('拒绝退租申请失败:', error)
    ElMessage.error('拒绝退租申请失败: ' + error.message)
  }
}

// 处理确认退租
const handleConfirmTermination = (terminate) => {
  console.log('处理确认退租，接收到的订单数据：', terminate);
  
  // 应用数据转换，确保字段一致性
  const transformedTerminate = transformTerminateRecord(terminate);
  
  // 检查必要的ID字段
  if (!transformedTerminate.orderId) {
    console.error('确认退租失败：缺少订单ID', transformedTerminate);
    ElMessage.error('订单数据不完整，无法处理');
    return;
  }
  
  // 在确认前，计算退款金额并显示给用户
  const remainingDays = calculateSmartRemainingDays(transformedTerminate);
  const monthlyRent = transformedTerminate.monthlyRent || 0;
  const dailyRent = monthlyRent / 30;
  const refundAmount = dailyRent * remainingDays;
  
  let confirmMessage = `确认完成退租流程吗？此操作将确认租客已退租`;
  
  if (remainingDays > 0 && refundAmount > 0) {
    confirmMessage += `，并将退还押金和剩余租金 ¥${refundAmount.toFixed(2)}（${remainingDays}天）`;
  } else {
    confirmMessage += `，并将退还押金`;
  }
  
  confirmMessage += `。`
  
  ElMessageBox.confirm(
    confirmMessage,
    '确认退租',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const res = await confirmTermination(transformedTerminate.orderId)
      if (res.code === 200) {
        ElMessage.success('退租流程已完成')
        fetchTerminateRequests()
      } else {
        ElMessage.error(res.message || '确认退租失败')
      }
    } catch (error) {
      console.error('确认退租失败:', error)
      ElMessage.error('确认退租失败: ' + error.message)
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

// 提交批准
const submitApprove = async () => {
  if (!currentTerminate.value || !actualTerminateDate.value) {
    ElMessage.warning('请选择实际退租日期')
    return
  }
  
  if (!currentTerminate.value.orderId) {
    console.error('批准退租时缺少订单ID', currentTerminate.value);
    ElMessage.error('订单信息不完整，无法处理');
    return;
  }
  
  // 确保actualTerminateDateStr是字符串格式，格式为YYYY-MM-DD
  const formattedDate = actualTerminateDate.value instanceof Date 
    ? formatDate(actualTerminateDate.value)
    : actualTerminateDate.value;
  
  // 调试日志，确认日期格式正确
  console.log('批准退租 - 实际退租日期:', actualTerminateDate.value);
  console.log('批准退租 - 格式化后的日期:', formattedDate);
  console.log('批准退租 - 计算的剩余天数:', calculatedRemainingDays.value);
  console.log('批准退租 - 计算的退款金额:', calculatedRefundAmount.value);
  
  const params = {
    orderId: currentTerminate.value.orderId,
    approved: true,
    actualTerminateDateStr: formattedDate,
    penaltyAmount: penaltyAmount.value,
    refundAmount: parseFloat(calculatedRefundAmount.value),
    remainingDays: calculatedRemainingDays.value
  };
  
  console.log('发送批准退租请求参数:', params);
  
  try {
    const res = await handleTerminateRequest(params)
    
    if (res.code === 200) {
      ElMessage.success('退租申请批准成功')
      approveDialogVisible.value = false
      fetchTerminateRequests()
    } else {
      ElMessage.error(res.message || '批准退租申请失败')
    }
  } catch (error) {
    console.error('批准退租申请失败:', error)
    ElMessage.error('批准退租申请失败: ' + error.message)
  }
}

onMounted(() => {
  fetchTerminateRequests()
})
</script>

<style scoped>
.terminate-manage-page {
  padding: 20px;
}

.terminate-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 10px;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.house-info-cell {
  display: flex;
  align-items: center;
}

.house-cover {
  width: 100px;
  height: 70px;
  margin-right: 15px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 20px;
}

.house-info {
  flex: 1;
}

.house-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  cursor: pointer;
}

.house-title:hover {
  color: #409eff;
}

.house-location {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 13px;
}

.house-location .el-icon {
  margin-right: 5px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.mt-4 {
  margin-top: 15px;
}

/* 新增样式 */
.form-item-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  margin-left: 3px;
  line-height: 1.4;
}

.el-divider__text {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}

.el-descriptions {
  margin-bottom: 15px;
}

.el-alert {
  margin-bottom: 15px;
}

.calculation-result {
  margin: 15px 0;
  background-color: #f5f7fa;
}

.refund-amount {
  color: #67c23a;
  font-size: 16px;
}
</style> 