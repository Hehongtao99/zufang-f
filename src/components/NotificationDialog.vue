<template>
  <div class="notification-container">
    <el-dialog
      v-model="dialogVisible"
      :title="notification.title || '通知'"
      width="500px"
      destroy-on-close
      :show-close="true"
      @closed="handleClose"
    >
      <div class="appointment-notification" v-if="notification.type === 'APPOINTMENT_NOTIFICATION'">
        <div class="house-info">
          <!-- 调试信息 -->
          <div v-if="isDev" class="debug-info">
            <pre>{{ JSON.stringify(notification, null, 2) }}</pre>
          </div>
          
          <el-image 
            v-if="getHouseImage()"
            :src="formatImageUrl(getHouseImage())" 
            fit="cover"
            class="house-cover"
          >
            <template #error>
              <div class="image-error">
                <el-icon><picture-rounded /></el-icon>
              </div>
            </template>
          </el-image>
          
          <div class="notification-content">
            <h3 class="notification-title">{{ notification.content || '有新的预约请求' }}</h3>
            
            <template v-if="notification.data">
              <div class="notification-detail">
                <p><el-icon><user /></el-icon> 预约人：{{ getUserName() }}</p>
                <p><el-icon><phone /></el-icon> 联系电话：{{ getUserPhone() }}</p>
                <p><el-icon><timer /></el-icon> 预约时间：{{ formatDateTime(getAppointmentTime()) }}</p>
                <p v-if="notification.data.remark"><el-icon><document /></el-icon> 备注：{{ notification.data.remark }}</p>
              </div>
            </template>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="handleViewDetail">
            查看详情
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Picture as PictureRounded, User, Phone, Timer, Document } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 开发环境标志
const isDev = false // 设置为false避免在生产环境显示调试信息

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  notification: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const router = useRouter()

onMounted(() => {
  console.log('NotificationDialog mounted, notification:', props.notification)
})

// 使用计算属性绑定dialog的visible状态
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听对话框打开，将通知标记为已读
watch(() => dialogVisible.value, async (newVal) => {
  if (newVal && props.notification) {
    console.log('对话框打开，准备标记为已读:', props.notification)
    
    // 获取预约ID
    const appointmentId = getAppointmentId()
    if (appointmentId) {
      console.log('标记预约已读:', appointmentId)
      markAsRead(appointmentId)
    } else {
      console.warn('无法标记为已读：找不到预约ID')
    }
  }
})

// 获取预约ID (兼容多种数据结构)
const getAppointmentId = () => {
  const data = props.notification.data
  if (!data) return null
  
  // 尝试多种可能的属性名
  return data.id || data.appointmentId || props.notification.referenceId
}

// 获取用户名 (兼容多种数据结构)
const getUserName = () => {
  const data = props.notification.data
  if (!data) return '未知用户'
  
  return data.userName || data.username || '未知用户'
}

// 获取用户电话 (兼容多种数据结构)
const getUserPhone = () => {
  const data = props.notification.data
  if (!data) return '无'
  
  return data.phone || data.userPhone || '无'
}

// 获取预约时间 (兼容多种数据结构)
const getAppointmentTime = () => {
  const data = props.notification.data
  if (!data) return null
  
  return data.appointmentTime
}

// 获取房源图片 (兼容多种数据结构)
const getHouseImage = () => {
  const data = props.notification.data
  if (!data) return null
  
  return data.houseCoverImage || data.houseImage || data.coverImage
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '未设置'
  
  try {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    console.error('日期格式化错误:', e)
    return dateStr
  }
}

// 标记通知为已读
const markAsRead = async (appointmentId) => {
  try {
    console.log('发送标记已读请求:', appointmentId)
    await request.post(`/landlord/appointments/mark-read/${appointmentId}`)
    console.log('已标记通知为已读:', appointmentId)
  } catch (error) {
    console.error('标记通知为已读失败:', error)
  }
}

// 格式化图片URL
const formatImageUrl = (url) => {
  if (!url) return ''
  
  console.log('格式化图片URL:', url)
  
  if (url.startsWith('http')) {
    return url
  }
  
  // 添加API前缀
  if (!url.startsWith('/')) {
    url = '/' + url
  }
  
  const formattedUrl = `/api${url}`
  console.log('格式化后的URL:', formattedUrl)
  return formattedUrl
}

// 关闭通知
const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

// 查看详情
const handleViewDetail = () => {
  if (props.notification.type === 'APPOINTMENT_NOTIFICATION') {
    // 跳转到预约列表页
    router.push('/landlord/appointment')
  }
  handleClose()
}
</script>

<style scoped>
.notification-container {
  font-size: 14px;
}

.debug-info {
  max-height: 200px;
  overflow: auto;
  background-color: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
}

.appointment-notification {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.house-info {
  display: flex;
  gap: 15px;
}

.house-cover {
  width: 120px;
  height: 90px;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: cover;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  color: #909399;
}

.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.notification-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-detail p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 