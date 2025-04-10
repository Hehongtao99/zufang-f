<template>
  <div class="appointment-list">
    <h2>预约管理</h2>
    
    <div class="filter">
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
        <el-option label="待确认" value="PENDING" />
        <el-option label="已接受" value="ACCEPTED" />
        <el-option label="已拒绝" value="REJECTED" />
        <el-option label="已完成" value="COMPLETED" />
        <el-option label="已取消" value="CANCELLED" />
      </el-select>
      <el-button type="primary" @click="fetchAppointmentList">查询</el-button>
    </div>
    
    <el-table :data="appointmentList" border stripe v-loading="loading">
      <el-table-column label="房源图片" width="100">
        <template #default="scope">
          <el-image 
            style="width: 60px; height: 60px; border-radius: 5px;" 
            :src="scope.row.houseCoverImage" 
            fit="cover"
            :preview-src-list="[scope.row.houseCoverImage]"
            :class="{ 'deleted-house-image': scope.row.houseDeleted }"
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
          <span v-if="scope.row.houseDeleted" class="deleted-badge">(已删除)</span>
        </template>
      </el-table-column>
      <el-table-column label="预约时间" width="160">
        <template #default="scope">
          {{ formatDateTime(scope.row.appointmentTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="userName" label="租客" width="120" />
      <el-table-column prop="phone" label="联系电话" width="120" />
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <template v-if="scope.row.status === 'PENDING'">
            <el-button type="success" size="small" @click="acceptAppointment(scope.row.id)">
              接受
            </el-button>
            <el-button type="danger" size="small" @click="showRejectDialog(scope.row.id)">
              拒绝
            </el-button>
          </template>
          <template v-if="scope.row.status === 'ACCEPTED'">
            <el-button type="primary" size="small" @click="completeAppointment(scope.row.id)">
              标记完成
            </el-button>
          </template>
          <el-button size="small" @click="viewAppointmentDetail(scope.row)">
            查看详情
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

    <!-- 拒绝预约弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝预约" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input 
            v-model="rejectForm.reason" 
            type="textarea" 
            rows="4" 
            placeholder="请输入拒绝原因，租客将会看到此信息"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="rejectAppointment" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预约详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="预约详情" width="600px">
      <template v-if="currentAppointment">
        <div class="appointment-info">
          <div class="info-item">
            <span class="label">房源名称：</span>
            <span>
              {{ currentAppointment.houseTitle }}
              <span v-if="currentAppointment.houseDeleted" class="deleted-badge">(已删除)</span>
            </span>
          </div>
          <div class="info-item">
            <span class="label">预约时间：</span>
            <span>{{ formatDateTime(currentAppointment.appointmentTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">租客姓名：</span>
            <span>{{ currentAppointment.userName }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话：</span>
            <span>{{ currentAppointment.phone }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态：</span>
            <el-tag :type="getStatusType(currentAppointment.status)">
              {{ getStatusText(currentAppointment.status) }}
            </el-tag>
          </div>
          <div class="info-item" v-if="currentAppointment.remark">
            <span class="label">备注：</span>
            <span>{{ currentAppointment.remark }}</span>
          </div>
          <div class="info-item" v-if="currentAppointment.rejectReason">
            <span class="label">拒绝原因：</span>
            <span>{{ currentAppointment.rejectReason }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span>{{ formatDateTime(currentAppointment.createTime) }}</span>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { PictureFilled } from '@element-plus/icons-vue';
import request from '@/utils/request';

// 状态变量
const loading = ref(false);
const submitting = ref(false);
const appointmentList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const statusFilter = ref('');
const rejectDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const currentAppointment = ref(null);
const currentAppointmentId = ref(null);
const rejectForm = ref({
  reason: ''
});

// 初始化
onMounted(() => {
  fetchAppointmentList();
});

// 获取预约列表
const fetchAppointmentList = async () => {
  loading.value = true;
  try {
    const res = await request({
      url: '/landlord/appointments',
      method: 'get',
      params: {
        page: currentPage.value,
        size: pageSize.value,
        status: statusFilter.value
      }
    });
    
    if (res.code === 200) {
      appointmentList.value = res.data.records;
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

// 接受预约
const acceptAppointment = (id) => {
  ElMessageBox.confirm('确定接受这个预约吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  }).then(async () => {
    try {
      const res = await request({
        url: `/landlord/appointments/${id}/accept`,
        method: 'post'
      });
      
      if (res.code === 200) {
        ElMessage.success('预约已接受');
        fetchAppointmentList();
      } else {
        ElMessage.error(res.message || '接受预约失败');
      }
    } catch (error) {
      console.error('接受预约失败', error);
      ElMessage.error('接受预约失败');
    }
  }).catch(() => {});
};

// 显示拒绝弹窗
const showRejectDialog = (id) => {
  currentAppointmentId.value = id;
  rejectForm.value.reason = '';
  rejectDialogVisible.value = true;
};

// 拒绝预约
const rejectAppointment = async () => {
  if (!rejectForm.value.reason) {
    ElMessage.warning('请输入拒绝原因');
    return;
  }
  
  submitting.value = true;
  try {
    const res = await request({
      url: `/landlord/appointments/${currentAppointmentId.value}/reject`,
      method: 'post',
      data: {
        reason: rejectForm.value.reason
      }
    });
    
    if (res.code === 200) {
      ElMessage.success('预约已拒绝');
      rejectDialogVisible.value = false;
      fetchAppointmentList();
    } else {
      ElMessage.error(res.message || '拒绝预约失败');
    }
  } catch (error) {
    console.error('拒绝预约失败', error);
    ElMessage.error('拒绝预约失败');
  } finally {
    submitting.value = false;
  }
};

// 标记完成
const completeAppointment = (id) => {
  ElMessageBox.confirm('确定将此预约标记为已完成吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
  }).then(async () => {
    try {
      const res = await request({
        url: `/landlord/appointments/${id}/complete`,
        method: 'post'
      });
      
      if (res.code === 200) {
        ElMessage.success('预约已标记为完成');
        fetchAppointmentList();
      } else {
        ElMessage.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败', error);
      ElMessage.error('操作失败');
    }
  }).catch(() => {});
};

// 查看预约详情
const viewAppointmentDetail = (appointment) => {
  currentAppointment.value = appointment;
  detailDialogVisible.value = true;
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
    case 'ACCEPTED':
      return 'success';
    case 'REJECTED':
      return 'danger';
    case 'COMPLETED':
      return 'info';
    case 'CANCELLED':
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
      return '已接受';
    case 'APPROVED':
      return '已接受';
    case 'REJECTED':
      return '已拒绝';
    case 'COMPLETED':
      return '已完成';
    case 'CANCELLED':
    case 'CANCELED':
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

.appointment-info {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 10px;
  display: flex;
  align-items: flex-start;
}

.label {
  width: 100px;
  font-weight: bold;
}

.deleted-house-image {
  filter: grayscale(100%);
  opacity: 0.7;
}

.deleted-badge {
  color: #F56C6C;
  font-size: 12px;
  margin-left: 5px;
}
</style> 