<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Delete, Edit, Check, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTerminateList, confirmTerminate, handleTerminateRequest } from '@/api/order'

// 列表数据
const tableData = ref([])
const loading = ref(false)
const drawerVisible = ref(false)
const currentRow = ref(null)

// 分页参数
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 获取退租申请列表
const fetchTerminateList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.currentPage,
      size: pagination.pageSize
    }
    const res = await getTerminateList(params)
    if (res.code === 200) {
      tableData.value = res.data.records || []
      pagination.total = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取退租申请列表失败')
    }
  } catch (error) {
    console.error('获取退租申请列表失败:', error)
    ElMessage.error('获取退租申请列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 计算违约金金额
const calculatePenalty = (row) => {
  if (!row || !actualTerminateDate.value) return 0
  
  // 如果退租日期晚于或等于租约结束日期，无需违约金
  const leaseEndDate = row.leaseEndDate
  if (!leaseEndDate || new Date(actualTerminateDate.value) >= new Date(leaseEndDate)) {
    return 0
  }
  
  // 计算剩余天数
  const actualDate = new Date(actualTerminateDate.value)
  const endDate = new Date(leaseEndDate)
  const remainingDays = Math.ceil((endDate - actualDate) / (1000 * 60 * 60 * 24))
  
  // 计算每日租金
  const monthlyRent = row.monthlyRent || 0
  const dailyRent = monthlyRent / 30
  
  // 计算剩余租金
  const remainingRent = dailyRent * remainingDays
  
  // 违约金为剩余租金的一定比例（如30%）
  const penaltyRate = 0.3
  const penalty = remainingRent * penaltyRate
  
  return parseFloat(penalty.toFixed(2))
}

// 确认退租完成表单
const confirmForm = reactive({
  checkoutPhotos: []
})

// 退租处理变量
const actualTerminateDate = ref('')
const penaltyAmount = ref(null)
const rejectReason = ref('')
const remark = ref('')

// 关闭抽屉并重置表单
const closeDrawer = () => {
  drawerVisible.value = false
  currentRow.value = null
  actualTerminateDate.value = ''
  penaltyAmount.value = null
  rejectReason.value = ''
  remark.value = ''
}

// 批准退租申请
const handleApprove = (row) => {
  // 检查是否已设置实际退租日期
  if (!actualTerminateDate.value) {
    ElMessage.warning('请选择实际退租日期');
    return;
  }

  // 计算违约金金额（如果未手动设置）
  const calculatedPenalty = calculatePenalty(row);
  const finalPenaltyAmount = penaltyAmount.value || calculatedPenalty;

  // 确认对话框
  ElMessageBox.confirm(
    `您确定要批准此退租申请吗？
    • 实际退租日期: ${actualTerminateDate.value}
    • 违约金金额: ¥${finalPenaltyAmount}
    • 备注: ${remark.value || '无'}`,
    '确认批准退租',
    {
      confirmButtonText: '确认批准',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 确认批准
    if (!row || !row.orderId) {
      console.error('批准退租时缺少订单ID', row);
      ElMessage.error('订单信息不完整，无法处理');
      return;
    }
    
    const params = {
      orderId: row.orderId,
      approved: true,
      actualTerminateDateStr: actualTerminateDate.value,
      penaltyAmount: finalPenaltyAmount,
      remark: remark.value
    };
    
    console.log('发送批准退租请求参数:', params);
    
    handleTerminateRequest(params).then(res => {
      if (res.code === 200) {
        ElMessage.success('已批准退租申请');
        fetchTerminateList(); // 刷新列表
        closeDrawer();
      } else {
        ElMessage.error(res.msg || '操作失败');
      }
    }).catch(err => {
      console.error('批准退租出错:', err);
      ElMessage.error('批准退租失败，请稍后重试');
    });
  }).catch(() => {
    // 用户取消
  });
};

// 拒绝退租申请
const handleReject = (row) => {
  if (!rejectReason.value) {
    ElMessage.warning('请填写拒绝原因');
    return;
  }

  ElMessageBox.confirm(
    `您确定要拒绝此退租申请吗？\n拒绝原因: ${rejectReason.value}`,
    '确认拒绝退租',
    {
      confirmButtonText: '确认拒绝',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 确认拒绝
    if (!row || !row.orderId) {
      console.error('拒绝退租时缺少订单ID', row);
      ElMessage.error('订单信息不完整，无法处理');
      return;
    }
    
    const params = {
      orderId: row.orderId,
      approved: false,
      rejectReason: rejectReason.value
    };
    
    console.log('发送拒绝退租请求参数:', params);
    
    handleTerminateRequest(params).then(res => {
      if (res.code === 200) {
        ElMessage.success('已拒绝退租申请');
        fetchTerminateList(); // 刷新列表
        closeDrawer();
      } else {
        ElMessage.error(res.msg || '操作失败');
      }
    }).catch(err => {
      console.error('拒绝退租出错:', err);
      ElMessage.error('拒绝退租失败，请稍后重试');
    });
  }).catch(() => {
    // 用户取消
  });
}; 
</script> 