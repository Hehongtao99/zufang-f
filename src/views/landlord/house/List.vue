<template>
  <div class="house-list">
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <h2>我的房源</h2>
          <el-button type="primary" @click="addHouse">发布新房源</el-button>
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
      
      <el-table
        v-loading="loading"
        :data="houseList"
        style="width: 100%"
        row-key="id"
        border
        stripe
        empty-text="暂无房源数据"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="封面图" width="100">
          <template #default="scope">
            <el-image
              style="width: 80px; height: 60px"
              :src="getImageUrl(scope.row.coverImage)"
              fit="cover"
              :preview-src-list="[getImageUrl(scope.row.coverImage)]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="price" label="月租(元)" width="120">
          <template #default="scope">
            {{ scope.row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="area" label="面积(㎡)" width="90" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.city }}{{ scope.row.district }}{{ scope.row.address }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'PENDING'" type="warning">待审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'APPROVED'" type="success">已审核</el-tag>
            <el-tag v-else-if="scope.row.status === 'REJECTED'" type="danger">已拒绝</el-tag>
            <el-tag v-else-if="scope.row.status === 'RENTED'" type="info">已出租</el-tag>
            <el-tag v-else-if="scope.row.status === 'OFFLINE'" type="info">已下架</el-tag>
            <el-tag v-else>未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="170">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="180">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 'OFFLINE'"
              link
              type="primary"
              size="small"
              @click="onlineHouse(scope.row.id)"
            >
              上架
            </el-button>
            <el-button
              v-if="scope.row.status === 'APPROVED' && scope.row.status !== 'RENTED'"
              link
              type="warning"
              size="small"
              @click="offlineHouse(scope.row.id)"
            >
              下架
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="viewHouse(scope.row.id)"
            >
              查看
            </el-button>
            <el-button
              v-if="scope.row.status !== 'RENTED'"
              link
              type="success"
              size="small"
              @click="editHouse(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="deleteHouse(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const error = ref(false)
const houseList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取我的房源列表
const fetchHouseList = async () => {
  loading.value = true
  error.value = false
  
  try {
    console.log('开始获取房东房源列表，参数:', { pageNum: currentPage.value, pageSize: pageSize.value })
    const response = await request.get('/house/landlord', {
      params: {
        pageNum: currentPage.value,
        pageSize: pageSize.value
      }
    })
    
    console.log('获取房东房源列表返回:', response)
    
    if (response && response.code === 200) {
      houseList.value = response.data.records || []
      total.value = response.data.total || 0
    } else {
      error.value = true
      ElMessage.error(response?.message || '获取数据失败')
    }
  } catch (err) {
    console.error('获取房源列表失败:', err)
    error.value = true
    
    // 未授权的错误处理
    if (err.response && err.response.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      // 清除登录信息
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      // 跳转到登录页
      router.replace('/login')
    } else {
      ElMessage.error('获取数据失败')
    }
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
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

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchHouseList()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchHouseList()
}

// 添加房源
const addHouse = () => {
  router.push('/landlord/house/add')
}

// 查看房源
const viewHouse = (id) => {
  router.push(`/landlord/house/detail/${id}`)
}

// 编辑房源
const editHouse = (row) => {
  console.log('编辑房源:', row.id);
  router.push(`/landlord/house/edit/${row.id}`);
}

// 上架房源
const onlineHouse = async (id) => {
  try {
    const response = await request.post(`/houses/online/${id}`)
    
    if (response && response.code === 200) {
      ElMessage.success('房源已上架')
      fetchHouseList()
    } else {
      ElMessage.error(response?.message || '操作失败')
    }
  } catch (err) {
    console.error('上架房源失败:', err)
    ElMessage.error('操作失败: ' + (err.response?.data?.message || err.message || '未知错误'))
  }
}

// 下架房源
const offlineHouse = async (id) => {
  try {
    const response = await request.post(`/houses/offline/${id}`)
    
    if (response && response.code === 200) {
      ElMessage.success('房源已下架')
      fetchHouseList()
    } else {
      ElMessage.error(response?.message || '操作失败')
    }
  } catch (err) {
    console.error('下架房源失败:', err)
    ElMessage.error('操作失败: ' + (err.response?.data?.message || err.message || '未知错误'))
  }
}

// 删除房源
const deleteHouse = (id) => {
  ElMessageBox.confirm('确定要删除此房源吗？此操作不可恢复', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await request.delete(`/house/${id}`)
      
      if (response && response.code === 200) {
        ElMessage.success('房源已删除')
        fetchHouseList()
      } else {
        ElMessage.error(response?.message || '删除失败')
      }
    } catch (err) {
      console.error('删除房源失败:', err)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchHouseList()
})
</script>

<style scoped>
.house-list {
  padding: 20px;
}

.list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 