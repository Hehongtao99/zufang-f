<template>
  <div class="layout">
    <header class="header">
      <div class="logo">租房系统-房东端</div>
      <div class="user-info">
        <div class="notification-badge" @click="toggleNotificationDrawer">
          <el-badge :value="unreadCount > 0 ? unreadCount : ''" class="item">
            <el-icon><bell /></el-icon>
          </el-badge>
        </div>
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-name">
            {{ userInfo.nickname || userInfo.username }}
            <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>
    
    <div class="main">
      <aside class="sidebar">
        <el-menu
          router
          :default-active="$route.path"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/landlord/house/list">
            <el-icon><house /></el-icon>
            <span>房源管理</span>
          </el-menu-item>
          
          <el-menu-item index="/landlord/appointment">
            <el-icon><calendar /></el-icon>
            <span>预约管理</span>
            <el-badge v-if="unreadCount > 0" :value="unreadCount" class="menu-badge" />
          </el-menu-item>
          
          <el-menu-item index="/landlord/order">
            <el-icon><tickets /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          
          <el-menu-item index="/landlord/terminate">
            <el-icon><warning /></el-icon>
            <span>退租管理</span>
          </el-menu-item>
          
          <el-menu-item index="/landlord/finance">
            <el-icon><money /></el-icon>
            <span>收支明细</span>
          </el-menu-item>
          
          <el-menu-item index="/landlord/message">
            <el-icon><ChatLineRound /></el-icon>
            <template #title>
              <span>消息中心</span>
              <el-badge v-if="unreadChatCount > 0" :value="unreadChatCount" class="chat-badge" />
            </template>
          </el-menu-item>
        </el-menu>
      </aside>
      
      <div class="content">
        <router-view />
      </div>
    </div>
    
    <!-- 通知弹窗 -->
    <NotificationDialog 
      v-model="showNotificationDialog"
      :notification="currentNotification"
      @close="handleNotificationClose"
    />
    
    <!-- 通知抽屉 -->
    <el-drawer
      v-model="notificationDrawerVisible"
      title="预约通知"
      size="350px"
      :with-header="true"
      direction="rtl"
    >
      <div class="notification-drawer-content">
        <div v-if="recentAppointments.length === 0" class="no-appointments">
          <el-empty description="暂无预约通知" />
        </div>
        <div v-else class="appointment-list">
          <div
            v-for="(appointment, index) in recentAppointments"
            :key="appointment.id"
            class="appointment-item"
            :class="{ 'unread': !appointment.isRead }"
            @click="viewAppointmentDetail(appointment.id)"
          >
            <div class="appointment-header">
              <div class="appointment-title">
                {{ appointment.userName }}预约看房
                <el-tag v-if="!appointment.isRead" size="small" type="danger">未读</el-tag>
                <el-tag v-else size="small" type="info">已读</el-tag>
              </div>
              <div class="appointment-time">{{ formatTime(appointment.createTime) }}</div>
            </div>
            <div class="appointment-content">
              <div class="house-info">
                <el-image
                  v-if="appointment.houseCoverImage"
                  :src="formatImageUrl(appointment.houseCoverImage)"
                  fit="cover"
                  class="house-cover"
                >
                  <template #error>
                    <div class="image-placeholder">
                      <el-icon><picture-rounded /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="house-details">
                  <div class="house-title">{{ appointment.houseTitle }}</div>
                  <div class="appointment-info">
                    <div><el-icon><timer /></el-icon> 预约时间: {{ formatDateTime(appointment.appointmentTime) }}</div>
                    <div><el-icon><phone /></el-icon> 联系方式: {{ appointment.phone }}</div>
                  </div>
                </div>
              </div>
              <div class="appointment-status">
                <el-tag :type="getStatusType(appointment.status)">{{ getStatusText(appointment.status) }}</el-tag>
              </div>
            </div>
            <div v-if="index < recentAppointments.length - 1" class="appointment-divider"></div>
          </div>
        </div>
        
        <div class="notification-drawer-footer">
          <el-button v-if="unreadCount > 0" @click="markAllAsRead" type="primary" plain>全部标为已读</el-button>
          <el-button @click="goToAppointment" type="primary">查看全部预约</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { userApi } from '@/utils/api'
import NotificationDialog from '@/components/NotificationDialog.vue'
import websocketClient from '@/utils/websocket'
import request from '@/utils/request'
import { 
  HomeFilled, 
  House, 
  Calendar, 
  Tickets, 
  Money, 
  ChatDotSquare, 
  ArrowDown, 
  Setting,
  Bell,
  PictureRounded,
  Timer,
  Phone,
  Warning,
  ChatLineRound
} from '@element-plus/icons-vue'
import { getUnreadMessageCount } from '@/api/chat'

const router = useRouter()
const userInfo = ref({})
const unreadCount = ref(0)
const showNotificationDialog = ref(false)
const currentNotification = ref({})

// 通知抽屉
const notificationDrawerVisible = ref(false)
const recentAppointments = ref([])

// 消息通知相关状态
const unreadNotificationCount = ref(0)
const notificationsVisible = ref(false)
const notifications = ref([])

// 聊天消息相关状态
const unreadChatCount = ref(0)

// 获取用户信息
const getUserInfo = async () => {
  try {
    console.log('正在获取房东用户信息...')
    const res = await userApi.getUserInfo()
    
    if (res && res.code === 200) {
      userInfo.value = res.data
      console.log('房东用户信息获取成功:', userInfo.value)
      
      // 初始化WebSocket监听
      initWebSocketListeners()
      return res.data
    } else {
      console.error('获取用户信息请求失败:', res?.message)
      throw new Error(res?.message || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息发生异常:', error)
    ElMessage.error('获取用户信息失败: ' + (error.message || '未知错误'))
    throw error
  }
}

// 获取未读预约数量
const fetchUnreadCount = async () => {
  try {
    const res = await request.post('/landlord/appointments/unread-count')
    if (res && res.code === 200) {
      unreadCount.value = res.data
    }
  } catch (error) {
    console.error('获取未读预约数量失败:', error)
  }
}

// 获取最近预约列表
const fetchRecentAppointments = async () => {
  try {
    const res = await request.get('/landlord/appointments', {
      params: {
        pageNum: 1,
        pageSize: 10
      }
    })
    
    if (res && res.code === 200) {
      recentAppointments.value = res.data.records || []
      
      // 处理图片URL
      recentAppointments.value.forEach(item => {
        // 处理房源图片
        if (item.houseCoverImage) {
          item.houseCoverImage = formatImageUrl(item.houseCoverImage)
        } else if (item.houseImage) {
          item.houseCoverImage = formatImageUrl(item.houseImage)
        }
        
        // 处理用户头像
        if (item.userAvatar) {
          item.userAvatar = formatImageUrl(item.userAvatar)
        }
        
        console.log('预约项数据处理后:', item)
      })
    }
  } catch (error) {
    console.error('获取最近预约列表失败:', error)
  }
}

// 初始化WebSocket事件监听
const initWebSocketListeners = () => {
  console.log('初始化WebSocket事件监听...');
  
  // 连接WebSocket
  const userId = localStorage.getItem('userId')
  if (userId) {
    console.log('重新确保WebSocket连接和订阅...');
    websocketClient.connect();
    websocketClient.subscribeToUserNotifications(userId);
  }
  
  // 监听WebSocket通知事件
  websocketClient.addListener('notification', (notification) => {
    console.log('收到WebSocket通知:', notification);
    
    // 如果是预约通知，显示弹窗
    if (notification.type === 'APPOINTMENT_NOTIFICATION') {
      console.log('收到预约通知，准备显示弹窗');
      showAppointmentNotification(notification);
    }
  });
  
  console.log('WebSocket事件监听初始化完成');
}

// 显示预约通知弹窗
const showAppointmentNotification = (notification) => {
  console.log('显示预约通知弹窗，原始数据:', notification);
  
  try {
    // 确保当前通知对象为空或有数据字段
    if (!notification || !notification.data) {
      console.error('通知对象无效或缺少data字段:', notification);
      notification = {
        ...notification,
        data: {},
        title: notification?.title || '新预约通知',
        content: notification?.content || '有新的预约看房请求'
      };
    }
    
    // 打印通知数据，方便调试
    console.log('处理后的通知数据:', notification);
    
    // 设置当前通知
    currentNotification.value = notification;
    
    // 显示弹窗
    showNotificationDialog.value = true;
    
    // 增加未读预约数量
    unreadCount.value++;
    
    // 刷新最近预约列表
    fetchRecentAppointments();
    
    // 直接弹出element-plus通知
    ElMessage({
      message: '收到新的预约看房请求',
      type: 'success',
      duration: 5000
    });
  } catch (error) {
    console.error('显示预约通知弹窗时出错:', error);
    // 简单显示消息通知，防止整个通知流程失败
    ElMessage({
      message: '收到新的预约看房请求',
      type: 'success',
      duration: 5000
    });
  }
}

// 处理通知弹窗关闭
const handleNotificationClose = () => {
  // 刷新未读预约数量
  fetchUnreadCount()
  // 刷新最近预约列表
  fetchRecentAppointments()
}

// 切换通知抽屉显示状态
const toggleNotificationDrawer = () => {
  notificationDrawerVisible.value = !notificationDrawerVisible.value
  
  if (notificationDrawerVisible.value) {
    // 打开抽屉时，获取最近预约列表
    fetchRecentAppointments()
  }
}

// 查看预约详情
const viewAppointmentDetail = async (appointmentId) => {
  try {
    // 标记为已读
    await request.post(`/landlord/appointments/mark-read/${appointmentId}`)
    
    // 关闭抽屉
    notificationDrawerVisible.value = false
    
    // 刷新未读预约数量
    fetchUnreadCount()
    
    // 跳转到预约管理页面
    router.push('/landlord/appointment')
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 标记所有为已读
const markAllAsRead = async () => {
  const unreadAppointments = recentAppointments.value.filter(item => !item.isRead)
  if (unreadAppointments.length === 0) return
  
  try {
    // 依次标记为已读
    for (const appointment of unreadAppointments) {
      await request.post(`/landlord/appointments/mark-read/${appointment.id}`)
    }
    
    // 刷新未读预约数量
    fetchUnreadCount()
    
    // 刷新最近预约列表
    fetchRecentAppointments()
    
    ElMessage.success('已将所有通知标记为已读')
  } catch (error) {
    console.error('标记所有已读失败:', error)
    ElMessage.error('操作失败，请稍后再试')
  }
}

// 格式化图片URL
const formatImageUrl = (url) => {
  if (!url) return '';
  
  console.log('格式化图片URL:', url);
  
  // 如果已经是完整的URL，直接返回
  if (url.startsWith('http')) {
    return url;
  }
  
  // 确保URL以/开头
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // 添加API前缀
  const formattedUrl = `/api${url}`;
  console.log('格式化后的URL:', formattedUrl);
  
  return formattedUrl;
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化时间（仅显示日期或今天/昨天）
const formatTime = (dateStr) => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date >= today) {
    return `今天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } else if (date >= yesterday) {
    return `昨天 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'PENDING': return '待处理'
    case 'APPROVED': return '已同意'
    case 'REJECTED': return '已拒绝'
    case 'COMPLETED': return '已完成'
    case 'CANCELED': return '已取消'
    default: return '未知'
  }
}

// 获取状态对应的标签类型
const getStatusType = (status) => {
  switch (status) {
    case 'PENDING': return 'info'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'danger'
    case 'COMPLETED': return 'primary'
    case 'CANCELED': return 'warning'
    default: return 'info'
  }
}

// 组件挂载时
onMounted(() => {
  console.log('房东布局组件挂载 - 开始初始化')
  
  // 获取用户信息
  getUserInfo().then(() => {
    console.log('用户信息获取成功，初始化其它资源')
    
    // 获取未读消息数
    fetchUnreadChatCount()
    
    // 监听聊天消息
    websocketClient.addListener('chat', handleChatMessage)
    
    // 初始化时获取一次未读预约数量
    fetchUnreadCount()
  }).catch(err => {
    console.error('获取用户信息失败:', err)
    
    // 如果获取用户信息失败且没有token，可能需要重新登录
    if (!localStorage.getItem('token')) {
      console.log('未检测到token，跳转到登录页')
      ElMessage.warning('登录状态已失效，请重新登录')
      router.push('/login')
    }
  })
})

// 检查个人资料完整性
const checkUserProfile = async () => {
  try {
    const res = await userApi.getUserInfo()
    if (res && res.code === 200 && res.data) {
      const user = res.data
      
      // 检查是否缺少真实姓名或身份证号
      if (!user.realName || !user.idCard) {
        ElMessageBox.confirm(
          '为了保障您的权益，请完善您的真实姓名和身份证号信息',
          '个人资料不完整',
          {
            confirmButtonText: '前往完善',
            cancelButtonText: '稍后再说',
            type: 'warning',
            closeOnClickModal: false
          }
        ).then(() => {
          router.push('/landlord/profile')
        }).catch(() => {
          ElMessage.info('您可以随时在个人中心完善个人资料')
        })
      }
    }
  } catch (error) {
    console.error('检查个人资料失败:', error)
  }
}

// 组件卸载时
onUnmounted(() => {
  // 移除事件监听
  websocketClient.removeListener('notification')
  
  // 移除聊天消息监听
  websocketClient.removeListener('chat', handleChatMessage)
})

// 跳转到预约管理页面
const goToAppointment = () => {
  notificationDrawerVisible.value = false
  router.push('/landlord/appointment')
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/landlord/profile')
  } else if (command === 'logout') {
    logout()
  }
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清除登录信息
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    
    // 断开WebSocket连接
    websocketClient.disconnect()
    
    // 跳转到登录页
    router.push('/login')
    
    ElMessage.success('退出登录成功')
  }).catch(() => {})
}

// 获取未读聊天消息数量
const fetchUnreadChatCount = async () => {
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) return

    const res = await getUnreadMessageCount(userId)
    if (res && res.code === 200) {
      unreadChatCount.value = res.data || 0
    }
  } catch (error) {
    console.error('获取未读聊天消息数量失败:', error)
  }
}

// 处理聊天消息
const route = useRoute();

const handleChatMessage = (message) => {
  console.log('收到聊天消息:', message)
  
  // 如果当前不在聊天页面，增加未读消息数
  if (route.path !== '/landlord/message' || !route.query.userId || !route.query.houseId) {
    unreadChatCount.value++
  }
}
</script>

<style scoped>
.layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
  font-size: 20px;
}

.user-name {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background-color: #304156;
  overflow-y: auto;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.menu-badge {
  margin-top: 6px;
  margin-right: 10px;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
}

/* 通知抽屉样式 */
.notification-drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.no-appointments {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.appointment-list {
  flex: 1;
  overflow-y: auto;
}

.appointment-item {
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.appointment-item:hover {
  background-color: #f5f7fa;
}

.appointment-item.unread {
  background-color: #ecf5ff;
}

.appointment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.appointment-title {
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.appointment-time {
  font-size: 12px;
  color: #909399;
}

.appointment-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.house-info {
  display: flex;
  gap: 10px;
}

.house-cover {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
}

.image-placeholder {
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #909399;
}

.house-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.house-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.appointment-info {
  font-size: 12px;
  color: #606266;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.appointment-info div {
  display: flex;
  align-items: center;
  gap: 5px;
}

.appointment-status {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.appointment-divider {
  height: 1px;
  background-color: #ebeef5;
  margin-top: 16px;
}

.notification-drawer-footer {
  border-top: 1px solid #ebeef5;
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.chat-badge {
  margin-left: 5px;
}
</style> 