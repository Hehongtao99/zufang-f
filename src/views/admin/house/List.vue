<template>
  <div class="admin-house-list">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>房源管理</span>
          <div class="filter">
            <el-select v-model="status" placeholder="状态筛选" clearable>
              <el-option label="全部" :value="-1" />
              <el-option label="待审核" :value="0" />
              <el-option label="已审核" :value="1" />
              <el-option label="已拒绝" :value="2" />
              <el-option label="已上架" :value="3" />
              <el-option label="已下架" :value="4" />
              <el-option label="已出租" :value="5" />
              <el-option label="已删除" :value="6" />
            </el-select>
            <el-button type="primary" @click="fetchHouseList">查询</el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="houseList"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="封面图" width="100">
          <template #default="scope">
            <el-image
              v-if="scope.row.coverImage"
              style="width: 80px; height: 60px"
              :src="getImageUrl(scope.row.coverImage)"
              fit="cover"
              :preview-src-list="[getImageUrl(scope.row.coverImage)]"
              preview-teleported
            />
            <span v-else>无</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="城市" width="100">
          <template #default="scope">
            {{ scope.row.city || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="区域" width="100">
          <template #default="scope">
            {{ scope.row.district || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="房东" width="100">
          <template #default="scope">
            {{ scope.row.ownerName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格(元/月)" width="120">
          <template #default="scope">
            {{ scope.row.price || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="roomType" label="户型" width="100">
          <template #default="scope">
            {{ formatRoomType(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="area" label="面积(㎡)" width="100">
          <template #default="scope">
            {{ scope.row.area || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="160">
          <template #default="scope">
            <el-button link @click="showHouseDetail(scope.row)">查看</el-button>
            <el-button type="success" link @click="editHouse(scope.row.id)">编辑</el-button>
            <template v-if="scope.row.status === 0">
              <el-button type="primary" link @click="showApproveDialog(scope.row)">审核</el-button>
            </template>
            <template v-if="scope.row.status === 1">
              <el-button type="success" link @click="changeStatus(scope.row.id, 3)">上架</el-button>
            </template>
            <template v-if="scope.row.status === 3">
              <el-button type="warning" link @click="changeStatus(scope.row.id, 4)">下架</el-button>
            </template>
            <template v-if="scope.row.status === 4">
              <el-button type="success" link @click="changeStatus(scope.row.id, 3)">上架</el-button>
            </template>
            <template v-if="scope.row.status === 5 || scope.row.status === 'RENTED'">
              <el-button type="warning" link @click="changeStatus(scope.row.id, 4)">下架</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 30, 50]"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 审核对话框 -->
    <el-dialog v-model="approveDialogVisible" title="房源审核" width="550px">
      <div class="approve-dialog">
        <div class="house-basic">
          <div><span>房源标题:</span>{{ currentHouse?.title }}</div>
          <div><span>所在小区:</span>{{ currentHouse?.communityName || '-' }}</div>
          <div><span>房东:</span>{{ currentHouse?.ownerName || '-' }}</div>
        </div>
        <el-divider></el-divider>
        <div class="approve-options">
          <el-radio-group v-model="approveForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
          <el-input
            v-if="!approveForm.approved"
            v-model="approveForm.reason"
            type="textarea"
            placeholder="请输入拒绝理由"
            rows="3"
          ></el-input>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approveDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitApprove" :loading="approveLoading">
            确 定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import { formatDate } from '@/utils/date'

const router = useRouter()

// 列表数据
const houseList = ref([])
const loading = ref(false)
const error = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const status = ref(-1)

// 审核对话框
const approveDialogVisible = ref(false)
const approveLoading = ref(false)
const currentHouse = ref(null)
const approveForm = ref({
  houseId: null,
  approved: true,
  reason: ''
})

// 获取房源列表
const fetchHouseList = async () => {
  loading.value = true
  error.value = false
  
  try {
    console.log('开始获取管理员房源列表，参数:', { 
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      status: status.value === -1 ? null : status.value
    })
    
    // 先判断当前用户是否登录
    const token = localStorage.getItem('token')
    if (!token) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }
    
    // 检查用户角色
    const userRole = localStorage.getItem('userRole')
    if (userRole !== 'ADMIN') {
      ElMessage.warning('您没有管理员权限')
      router.push('/')
      return
    }
    
    const response = await request.get('/admin/houses', {
      params: {
        pageNum: currentPage.value,
        pageSize: pageSize.value,
        status: status.value === -1 ? null : status.value
      }
    })
    
    console.log('获取管理员房源列表返回:', response)
    
    if (response.code === 200) {
      houseList.value = response.data.records || []
      total.value = response.data.total || 0
    } else {
      error.value = true
      ElMessage.error(response.message || '获取数据失败')
    }
  } catch (err) {
    console.error('获取房源列表失败:', err)
    error.value = true
    
    // 更详细的错误信息
    if (err.response) {
      console.error('错误状态码:', err.response.status)
      console.error('错误数据:', err.response.data)
      ElMessage.error(`服务器返回错误 (${err.response.status}): ${err.response?.data?.message || '未知错误'}`)
    } else if (err.request) {
      console.error('请求未收到响应:', err.request)
      ElMessage.error('服务器无响应，请检查网络连接')
    } else {
      ElMessage.error(err.message || '发送请求时出错')
    }
  } finally {
    loading.value = false
  }
}

// 处理图片URL
const getImageUrl = (url) => {
  if (!url) return ''
  
  // 如果已经是完整URL（以http或https开头），则直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 确保URL以/开头
  if (!url.startsWith('/')) {
    url = '/' + url
  }
  
  // 如果URL以/api开头，则移除/api前缀
  if (url.startsWith('/api/')) {
    url = url.substring(4)
  }
  
  // 如果是相对路径，加上API前缀
  return `/api${url}`
}

// 格式化户型
const formatRoomType = (house) => {
  if (!house.bedroomCount && !house.livingRoomCount && !house.bathroomCount) {
    return '-'
  }
  return `${house.bedroomCount || 0}室${house.livingRoomCount || 0}厅${house.bathroomCount || 0}卫`
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已审核',
    2: '已拒绝',
    3: '已上架',
    4: '已下架',
    5: '已出租',
    6: '已删除',
    'PENDING': '待审核',
    'APPROVED': '已审核',
    'REJECTED': '已拒绝',
    'ONLINE': '已上架',
    'OFFLINE': '已下架',
    'RENTED': '已出租',
    'DELETED': '已删除'
  }
  return statusMap[status] || '状态' + status
}

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'danger',
    3: 'primary',
    4: 'warning',
    5: 'success',
    6: 'info',
    'PENDING': 'info',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'ONLINE': 'primary',
    'OFFLINE': 'warning',
    'RENTED': 'success',
    'DELETED': 'info'
  }
  return typeMap[status] || 'info'
}

// 查看房源详情
const showHouseDetail = (house) => {
  router.push(`/admin/house/detail/${house.id}`)
}

// 编辑房源
const editHouse = (id) => {
  router.push(`/admin/house/edit/${id}`)
}

// 打开审核对话框
const showApproveDialog = (house) => {
  currentHouse.value = house
  approveForm.value = {
    houseId: house.id,
    approved: true,
    reason: ''
  }
  approveDialogVisible.value = true
}

// 提交审核
const submitApprove = async () => {
  // 验证表单
  if (!approveForm.value.approved && !approveForm.value.reason) {
    ElMessage.warning('请输入拒绝理由')
    return
  }
  
  approveLoading.value = true
  try {
    const response = await request.post('/admin/houses/approve', {
      houseId: approveForm.value.houseId,
      approved: approveForm.value.approved,
      reason: approveForm.value.reason
    })
    
    if (response.code === 200) {
      ElMessage.success(approveForm.value.approved ? '审核通过成功' : '审核拒绝成功')
      approveDialogVisible.value = false
      fetchHouseList() // 刷新列表
    } else {
      ElMessage.error(response.message || '审核操作失败')
    }
  } catch (err) {
    console.error('审核操作失败:', err)
    ElMessage.error(err.message || '审核操作失败')
  } finally {
    approveLoading.value = false
  }
}

// 修改状态（上架/下架）
const changeStatus = (houseId, newStatus) => {
  const actionText = newStatus === 3 ? '上架' : '下架'
  
  ElMessageBox.confirm(`确定要${actionText}该房源吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const url = `/admin/houses/${houseId}/${newStatus === 3 ? 'online' : 'offline'}`
      const response = await request.post(url)
      if (response.code === 200) {
        ElMessage.success(`${actionText}成功`)
        fetchHouseList() // 刷新列表
      } else {
        ElMessage.error(response.message || `${actionText}失败`)
      }
    } catch (err) {
      console.error(`${actionText}操作出错:`, err)
      ElMessage.error(err.message || `${actionText}操作失败`)
    }
  }).catch(() => {
    // 用户取消操作
  })
}

// 分页方法
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  fetchHouseList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchHouseList()
}

onMounted(() => {
  fetchHouseList()
})
</script>

<style scoped>
.admin-house-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.approve-dialog .house-basic {
  margin-bottom: 15px;
}

.approve-dialog .house-basic div {
  margin-bottom: 8px;
}

.approve-dialog .house-basic span {
  display: inline-block;
  width: 80px;
  color: #909399;
}

.approve-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
</style>