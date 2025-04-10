<template>
  <div class="appointment-page">
    <el-card class="appointment-card">
      <template #header>
        <div class="card-header">
          <h2>预约管理</h2>
          <el-button type="primary" @click="fetchAppointments">刷新</el-button>
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
        <div v-if="appointmentList.length === 0 && !loading" class="empty-result">
          <el-empty description="暂无预约记录" />
        </div>
        
        <el-table v-else :data="appointmentList" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          
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
                      <el-icon><picture-rounded /></el-icon>
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
          
          <el-table-column label="预约人" width="150">
            <template #default="scope">
              <div class="user-info">
                <span>{{ scope.row.userName }}</span>
                <div class="user-phone">
                  <el-icon><phone /></el-icon>
                  <span>{{ scope.row.phone }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="预约时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.appointmentTime) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
          
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button 
                v-if="scope.row.status === 'PENDING'" 
                type="success" 
                size="small"
                @click="handleAppointment(scope.row.id, 'APPROVED')"
              >
                同意
              </el-button>
              <el-button 
                v-if="scope.row.status === 'PENDING'" 
                type="danger" 
                size="small"
                @click="handleAppointment(scope.row.id, 'REJECTED')"
              >
                拒绝
              </el-button>
              <el-button 
                v-if="scope.row.status === 'APPROVED' && isBeforeAppointmentTime(scope.row.appointmentTime)" 
                type="warning" 
                size="small"
                @click="handleAppointment(scope.row.id, 'COMPLETED')"
              >
                完成看房
              </el-button>
              <el-button 
                v-if="scope.row.status === 'APPROVED' && isBeforeAppointmentTime(scope.row.appointmentTime)" 
                type="info" 
                size="small"
                @click="handleAppointment(scope.row.id, 'CANCELED')"
              >
                取消预约
              </el-button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, Phone, PictureRounded } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const error = ref(false)
const appointmentList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取预约列表
const fetchAppointments = async () => {
  loading.value = true
  error.value = false
  
  try {
    const response = await request.get('/landlord/appointments', {
      params: {
        pageNum: currentPage.value,
        pageSize: pageSize.value
      }
    })
    
    if (response && response.code === 200) {
      appointmentList.value = response.data.records || []
      total.value = response.data.total || 0
      
      // 处理图片URL
      appointmentList.value.forEach(item => {
        if (item.houseCoverImage && !item.houseCoverImage.startsWith('http')) {
          if (!item.houseCoverImage.startsWith('/')) {
            item.houseCoverImage = '/' + item.houseCoverImage
          }
          item.houseCoverImage = `/api${item.houseCoverImage}`
        }
      })
    } else {
      error.value = true
      ElMessage.error(response?.message || '获取数据失败')
    }
  } catch (err) {
    console.error('获取预约列表失败:', err)
    error.value = true
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchAppointments()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchAppointments()
}

// 查看房源详情
const viewHouseDetail = (id) => {
  router.push(`/landlord/house/detail/${id}`)
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'PENDING':
      return '待处理'
    case 'APPROVED':
    case 'ACCEPTED':
      return '已同意'
    case 'REJECTED':
      return '已拒绝'
    case 'COMPLETED':
      return '已完成'
    case 'CANCELED':
    case 'CANCELLED':
      return '已取消'
    default:
      return '未知状态'
  }
}

// 获取状态对应的标签类型
const getStatusType = (status) => {
  switch (status) {
    case 'PENDING':
      return 'info'
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    case 'COMPLETED':
      return 'primary'
    case 'CANCELED':
      return 'warning'
    default:
      return 'info'
  }
}

// 判断是否在预约时间之前
const isBeforeAppointmentTime = (appointmentTime) => {
  if (!appointmentTime) return false
  const now = new Date()
  const appointmentDate = new Date(appointmentTime)
  return now < appointmentDate
}

// 处理预约（同意/拒绝/完成/取消）
const handleAppointment = async (id, status) => {
  const actionText = {
    'APPROVED': '同意',
    'REJECTED': '拒绝',
    'COMPLETED': '完成',
    'CANCELED': '取消'
  }[status]
  
  ElMessageBox.confirm(`确定要${actionText}这条预约吗？`, '确认操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await request.post('/landlord/appointments/update-status', {
        id,
        status
      })
      
      if (response && response.code === 200) {
        ElMessage.success(`${actionText}预约成功`)
        fetchAppointments() // 刷新列表
      } else {
        ElMessage.error(response?.message || '操作失败')
      }
    } catch (err) {
      console.error(`${actionText}预约失败:`, err)
      ElMessage.error('操作失败')
    }
  }).catch(() => {
    // 用户取消，不做处理
  })
}

onMounted(() => {
  fetchAppointments()
})
</script>

<style scoped>
.appointment-page {
  padding: 20px;
}

.appointment-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-result {
  margin: 50px 0;
  text-align: center;
}

.house-info-cell {
  display: flex;
  align-items: center;
}

.house-cover {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  margin-right: 15px;
  cursor: pointer;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 60px;
  background-color: #f5f7fa;
}

.image-error .el-icon {
  font-size: 24px;
  color: #c0c4cc;
}

.house-info {
  flex: 1;
}

.house-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.house-title:hover {
  color: #409EFF;
}

.house-location {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 12px;
}

.house-location .el-icon {
  margin-right: 4px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-phone {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.user-phone .el-icon {
  margin-right: 4px;
  font-size: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 