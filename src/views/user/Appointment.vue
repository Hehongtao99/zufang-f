<template>
  <div class="appointment-list">
    <h2>我的预约</h2>
    
    <div class="filter">
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
        <el-option label="待确认" value="PENDING" />
        <el-option label="已接受" value="APPROVED" />
        <el-option label="已拒绝" value="REJECTED" />
        <el-option label="已完成" value="COMPLETED" />
        <el-option label="已取消" value="CANCELED" />
      </el-select>
      <el-button type="primary" @click="fetchAppointmentList">查询</el-button>
    </div>
    
    <el-table :data="appointmentList" border stripe v-loading="loading">
      <el-table-column label="房源图片" width="100">
        <template #default="scope">
          <el-image 
            style="width: 60px; height: 60px; border-radius: 5px;" 
            :src="scope.row.houseImage" 
            fit="cover"
            :preview-src-list="[scope.row.houseImage]"
            :class="{ 'deleted-house-image': scope.row.isHouseDeleted }"
          >
            <template #error>
              <div class="image-error">
                <el-icon><PictureFilled /></el-icon>
              </div>
            </template>
          </el-image>
        </template>
      </el-table-column>
      <el-table-column prop="houseTitle" label="房源名称" min-width="200">
        <template #default="scope">
          {{ scope.row.houseTitle }}
          <span v-if="scope.row.isHouseDeleted" class="deleted-badge">(已删除)</span>
        </template>
      </el-table-column>
      <el-table-column label="预约时间" width="160">
        <template #default="scope">
          {{ formatDateTime(scope.row.appointmentTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="landlordName" label="房东" width="120" />
      <el-table-column prop="landlordPhone" label="联系电话" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button 
            v-if="scope.row.status === 'PENDING'" 
            type="danger" 
            size="small" 
            @click="cancelAppointment(scope.row.id)"
          >
            取消
          </el-button>
          <el-button 
            v-if="scope.row.status === 'APPROVED' && !scope.row.isHouseDeleted" 
            type="success" 
            size="small" 
            @click="viewHouseDetail(scope.row.houseId)"
          >
            查看房源
          </el-button>
          <el-tag 
            v-if="scope.row.isHouseDeleted" 
            type="danger" 
            size="small"
          >
            房源已删除
          </el-tag>
          <el-button 
            v-if="scope.row.status === 'REJECTED'" 
            size="small" 
            @click="viewRejectReason(scope.row)"
          >
            查看原因
          </el-button>
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

    <!-- 驳回原因弹窗 -->
    <el-dialog v-model="rejectReasonVisible" title="驳回原因" width="500px">
      <div class="reject-reason-container">
        <div v-if="currentRejectReason === '房东未提供拒绝原因'" class="no-reason">
          <el-icon class="reason-icon"><WarningFilled /></el-icon>
          <p>房东未提供拒绝原因</p>
        </div>
        <div v-else class="has-reason">
          <div class="reason-label">房东拒绝理由：</div>
          <div class="reason-content">{{ currentRejectReason }}</div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="rejectReasonVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { PictureFilled, WarningFilled } from '@element-plus/icons-vue';
import request from '@/utils/request';

const router = useRouter();

// 状态变量
const loading = ref(false);
const appointmentList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const statusFilter = ref('');
const rejectReasonVisible = ref(false);
const currentRejectReason = ref('');

// 初始化
onMounted(() => {
  fetchAppointmentList();
});

// 获取预约列表
const fetchAppointmentList = async () => {
  loading.value = true;
  try {
    const res = await request({
      url: '/user/appointments',
      method: 'get',
      params: {
        page: currentPage.value,
        size: pageSize.value,
        status: statusFilter.value
      }
    });
    
    if (res.code === 200) {
      // 打印返回的数据，查看拒绝原因字段
      console.log('预约列表数据:', res.data.records);
      
      // 统一处理房源删除标志，确保所有记录都使用isHouseDeleted字段
      appointmentList.value = res.data.records.map(appointment => {
        // 处理可能存在的命名不一致问题
        if (appointment.houseDeleted !== undefined && appointment.isHouseDeleted === undefined) {
          appointment.isHouseDeleted = appointment.houseDeleted;
        }
        // 如果两者都没有，默认为false
        if (appointment.isHouseDeleted === undefined) {
          appointment.isHouseDeleted = false;
        }
        // 检查拒绝原因相关字段
        console.log('预约ID:', appointment.id, '拒绝相关字段:', {
          rejectReason: appointment.rejectReason,
          reject_reason: appointment.reject_reason,
          remark: appointment.remark,
          status: appointment.status
        });
        return appointment;
      });
      total.value = res.data.total;
    } else {
      ElMessage.error(res.message || '获取预约列表失败');
    }
  } catch (error) {
    console.error('获取预约列表失败', error);
    ElMessage.error('获取预约列表失败');
  } finally {
    loading.value = false;
  }
};

// 取消预约
const cancelAppointment = (id) => {
  ElMessageBox.confirm('确定要取消这个预约吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      const res = await request({
        url: `/user/appointments/${id}/cancel`,
        method: 'post'
      });
      
      if (res.code === 200) {
        ElMessage.success('预约已取消');
        fetchAppointmentList();
      } else {
        ElMessage.error(res.message || '取消预约失败');
      }
    } catch (error) {
      console.error('取消预约失败', error);
      ElMessage.error('取消预约失败');
    }
  }).catch(() => {});
};

// 查看房源详情
const viewHouseDetail = (houseId) => {
  router.push(`/user/house/detail/${houseId}`);
};

// 查看驳回原因
const viewRejectReason = (appointment) => {
  console.log('查看拒绝原因, 完整数据:', appointment);
  
  // 检查remark字段，在后端这是保存拒绝原因的字段
  const reason = appointment.remark && appointment.remark.trim() !== '' ? 
    appointment.remark : '房东未提供拒绝原因';
  
  currentRejectReason.value = reason;
  console.log('设置拒绝原因:', currentRejectReason.value);
  rejectReasonVisible.value = true;
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchAppointmentList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchAppointmentList();
};

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取状态对应的样式
const getStatusType = (status) => {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'COMPLETED':
      return 'info';
    case 'CANCELED':
      return '';
    default:
      return 'info';
  }
};

// 获取状态对应的文本
const getStatusText = (status) => {
  switch (status) {
    case 'PENDING':
      return '待确认';
    case 'ACCEPTED':
    case 'APPROVED':
      return '已接受';
    case 'REJECTED':
      return '已拒绝';
    case 'COMPLETED':
      return '已完成';
    case 'CANCELED':
    case 'CANCELLED':
      return '已取消';
    default:
      return '未知状态';
  }
};
</script>

<style scoped>
.appointment-list {
  padding: 20px;
}

.filter {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}

.reject-reason-container {
  padding: 20px;
  min-height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.no-reason {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #909399;
}

.reason-icon {
  font-size: 32px;
  color: #E6A23C;
  margin-bottom: 10px;
}

.has-reason {
  width: 100%;
}

.reason-label {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.reason-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #E6A23C;
  font-size: 15px;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
  min-height: 60px;
}

.deleted-badge {
  color: #F56C6C;
  font-size: 12px;
  margin-left: 5px;
}

.deleted-house-image {
  filter: grayscale(100%);
  opacity: 0.7;
}
</style> 