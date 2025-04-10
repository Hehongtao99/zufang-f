<template>
  <div class="house-approve">
    <el-card class="approve-card">
      <template #header>
        <div class="card-header">
          <h2>房源审核</h2>
          <div class="actions">
            <el-button type="success" @click="approveHouse" :loading="submitting">通过</el-button>
            <el-button type="danger" @click="showRejectDialog" :loading="submitting">拒绝</el-button>
            <el-button @click="goBack">返回</el-button>
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
      
      <div v-loading="loading" class="house-detail">
        <template v-if="houseInfo">
          <div class="section">
            <h3>基本信息</h3>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="标题" :span="3">{{ houseInfo.title }}</el-descriptions-item>
              <el-descriptions-item label="月租">{{ houseInfo.price?.toFixed(2) }} 元</el-descriptions-item>
              <el-descriptions-item label="面积">{{ houseInfo.area }} 平方米</el-descriptions-item>
              <el-descriptions-item label="发布时间">{{ formatDate(houseInfo.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="地址" :span="3">{{ houseInfo.city || '' }}{{ houseInfo.district || '' }}{{ houseInfo.address || '' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="section">
            <h3>房源图片</h3>
            <div v-if="houseInfo.coverImage" class="cover-image">
              <div class="image-label">封面图片</div>
              <el-image
                style="width: 300px;"
                :src="getImageUrl(houseInfo.coverImage)"
                fit="cover"
                :preview-src-list="[getImageUrl(houseInfo.coverImage)]"
              />
            </div>
            
            <div v-if="houseInfo.images && houseInfo.images.length > 0" class="house-images">
              <div class="image-label">房源图片</div>
              <el-image
                v-for="(image, index) in houseInfo.images"
                :key="index"
                style="width: 200px; height: 150px; margin-right: 10px; margin-bottom: 10px;"
                :src="getImageUrl(typeof image === 'string' ? image : image.url)"
                fit="cover"
                :preview-src-list="houseInfo.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))"
              />
            </div>
          </div>
          
          <div class="section">
            <h3>房源详情</h3>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="描述" :span="3">{{ houseInfo.description || '暂无描述' }}</el-descriptions-item>
              <el-descriptions-item label="房型">{{ houseInfo.bedroomCount || 0 }}室{{ houseInfo.livingRoomCount || 0 }}厅{{ houseInfo.bathroomCount || 0 }}卫</el-descriptions-item>
              <el-descriptions-item label="朝向">{{ houseInfo.orientation || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="楼层">{{ houseInfo.floor || 0 }}/{{ houseInfo.totalFloor || 0 }}</el-descriptions-item>
              <el-descriptions-item label="装修情况">{{ houseInfo.decoration || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="是否有电梯">{{ houseInfo.hasElevator ? '有' : '无' }}</el-descriptions-item>
              <el-descriptions-item label="是否有停车位">{{ houseInfo.hasParking ? '有' : '无' }}</el-descriptions-item>
              <el-descriptions-item label="房源类型">{{ houseInfo.houseType === 'APARTMENT' ? '公寓' : '别墅' }}</el-descriptions-item>
              <el-descriptions-item label="出租类型">{{ houseInfo.rentType === 'WHOLE' ? '整租' : '合租' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          
          <div class="section">
            <h3>房东信息</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="房东ID">{{ houseInfo.ownerId || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="房东昵称">{{ houseInfo.ownerName || '未知' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </div>
    </el-card>
    
    <!-- 拒绝原因对话框 -->
    <el-dialog
      v-model="rejectDialogVisible"
      title="拒绝原因"
      width="500px"
    >
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" prop="rejectReason">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="rejectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="rejectHouse" :loading="submitting">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const error = ref(false)
const houseInfo = ref(null)
const submitting = ref(false)

// 拒绝对话框
const rejectDialogVisible = ref(false)
const rejectForm = reactive({
  rejectReason: ''
})

// 处理图片URL
const getImageUrl = (url) => {
  if (!url) return '';
  
  // 如果已经是完整URL（以http或https开头），则直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 确保URL以/开头
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // 如果URL以/api开头，则移除/api前缀
  if (url.startsWith('/api/')) {
    url = url.substring(4);
  }
  
  // 如果是相对路径，加上API前缀
  return `/api${url}`;
};

// 获取房源信息
const fetchHouseInfo = async () => {
  const houseId = route.params.id
  if (!houseId) {
    ElMessage.error('房源ID不能为空')
    router.push('/admin/house/list')
    return
  }
  
  loading.value = true
  error.value = false
  
  try {
    const response = await axios.get(`/api/house/info/${houseId}`)
    
    if (response.data.code === 200) {
      houseInfo.value = response.data.data
      
      // 如果房源状态不是待审核，提示信息
      if (houseInfo.value.status !== 'PENDING' && houseInfo.value.status !== '0') {
        ElMessage.warning(`当前房源状态为：${getStatusText(houseInfo.value.status)}，无需审核`)
      }
    } else {
      error.value = true
      ElMessage.error(response.data.message || '获取数据失败')
    }
  } catch (err) {
    console.error('获取房源信息失败:', err)
    error.value = true
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'PENDING':
    case '0':
      return '待审核'
    case 'APPROVED':
    case '1':
      return '已审核'
    case 'REJECTED':
    case '2':
      return '已拒绝'
    case 'ONLINE':
    case '3':
      return '已上架'
    case 'OFFLINE':
    case '4':
      return '已下架'
    default:
      return '未知'
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 审核通过
const approveHouse = async () => {
  if (!houseInfo.value || (houseInfo.value.status !== 'PENDING' && houseInfo.value.status !== '0')) {
    ElMessage.warning('当前房源状态不是待审核，无法审核')
    return
  }
  
  ElMessageBox.confirm('确定审核通过该房源吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    submitting.value = true
    try {
      const response = await axios.post('/api/admin/houses/approve', {
        houseId: houseInfo.value.id,
        approved: true
      })
      
      if (response.data.code === 200) {
        ElMessage.success('审核通过成功')
        router.push('/admin/house/list')
      } else {
        ElMessage.error(response.data.message || '操作失败')
      }
    } catch (err) {
      console.error('审核通过失败:', err)
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  }).catch(() => {})
}

// 显示拒绝对话框
const showRejectDialog = () => {
  if (!houseInfo.value || (houseInfo.value.status !== 'PENDING' && houseInfo.value.status !== '0')) {
    ElMessage.warning('当前房源状态不是待审核，无法审核')
    return
  }
  
  rejectForm.rejectReason = ''
  rejectDialogVisible.value = true
}

// 拒绝房源
const rejectHouse = async () => {
  if (!rejectForm.rejectReason) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  
  submitting.value = true
  try {
    const response = await axios.post('/api/admin/houses/approve', {
      houseId: houseInfo.value.id,
      approved: false,
      reason: rejectForm.rejectReason
    })
    
    if (response.data.code === 200) {
      ElMessage.success('已拒绝该房源')
      rejectDialogVisible.value = false
      router.push('/admin/house/list')
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (err) {
    console.error('拒绝房源失败:', err)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 返回列表
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchHouseInfo()
})
</script>

<style scoped>
.house-approve {
  padding: 20px;
}

.approve-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 10px;
}

.house-detail {
  margin-top: 20px;
}

.section {
  margin-bottom: 30px;
}

.section h3 {
  margin-bottom: 15px;
  font-size: 18px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.cover-image, .house-images {
  margin-bottom: 20px;
}

.image-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}
</style> 