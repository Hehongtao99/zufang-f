<template>
  <div class="client-layout">
    <header class="header">
      <div class="container header-container">
        <div class="logo" @click="goToHome">租房系统</div>
        <nav class="nav-menu">
          <el-menu
            router
            mode="horizontal"
            :default-active="$route.path"
            background-color="transparent"
            text-color="#333"
            active-text-color="#409EFF"
          >
            <el-menu-item index="/user/home">首页</el-menu-item>
            <el-menu-item index="/user/house/list">找房</el-menu-item>
            <el-menu-item index="/user/myhouse">我的订房</el-menu-item>
            <el-menu-item index="/user/appointment">我的预约</el-menu-item>
            <el-menu-item index="/user/orders">我的订单</el-menu-item>
            <el-menu-item index="/user/contract/list">我的合同</el-menu-item>
            <el-menu-item index="/user/message">
              消息中心
              <el-badge v-if="unreadMessageCount > 0" :value="unreadMessageCount" class="message-badge" />
            </el-menu-item>
            <el-menu-item index="/user/profile">个人资料</el-menu-item>
          </el-menu>
        </nav>
        <div class="user-area">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar 
                :size="32" 
                :src="userInfo.avatar || defaultAvatar"
                class="user-avatar"
              ></el-avatar>
              <span class="user-name">
                {{ userInfo.nickname || userInfo.username }}
                <el-icon><arrow-down /></el-icon>
              </span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="message">消息中心</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <router-view />
    </main>
    
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-logo">租房系统</div>
          <div class="footer-links">
            <a href="javascript:void(0)">关于我们</a>
            <a href="javascript:void(0)">帮助中心</a>
            <a href="javascript:void(0)">联系我们</a>
            <a href="javascript:void(0)">用户协议</a>
          </div>
          <div class="footer-copyright">© 2023 租房系统 版权所有</div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { userApi } from '@/utils/api'
import { HomeFilled, House, Calendar, Tickets, ChatDotSquare, ArrowDown, Connection } from '@element-plus/icons-vue'
import { getUnreadMessageCount } from '@/api/chat'
import websocketClient from '@/utils/websocket'

const router = useRouter()
const userInfo = ref({})
const unreadMessageCount = ref(0)

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

// 获取用户信息
const getUserInfo = async () => {
  try {
    console.log('开始获取用户信息...')
    const token = localStorage.getItem('token')
    const userId = localStorage.getItem('userId')
    
    if (!token) {
      console.error('获取用户信息失败: 本地没有token')
      router.push('/login')
      return
    }
    
    if (!userId) {
      console.warn('本地存储中没有找到userId，尝试从token中获取')
    }
    
    console.log(`使用token获取用户信息: ${token.substring(0, 15)}...`)
    const res = await userApi.getUserInfo()
    console.log('获取用户信息成功:', res)
    
    if (res.code === 200 && res.data) {
      userInfo.value = res.data
      // 确保localStorage中有userId
      if (!userId && res.data.id) {
        localStorage.setItem('userId', res.data.id)
        console.log(`保存用户ID到本地存储: ${res.data.id}`)
      }
    } else {
      console.error('获取用户信息返回异常结果:', res)
      ElMessage.error('获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    const errorMsg = error.message || '未知错误'
    
    if (errorMsg.includes('用户未登录') || errorMsg.includes('token')) {
      console.warn('用户未登录或token无效，跳转到登录页')
      // 清除可能过期的登录信息
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      router.push('/login')
    }
  }
}

// 获取未读消息数量
const fetchUnreadMessageCount = async () => {
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) return
    
    const res = await getUnreadMessageCount(userId)
    if (res && res.code === 200) {
      unreadMessageCount.value = res.data || 0
    }
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/user/profile')
  } else if (command === 'message') {
    router.push('/user/message')
  } else if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 清除登录信息
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      
      // 跳转到登录页
      router.push('/login')
      
      ElMessage.success('退出登录成功')
    }).catch(() => {})
  }
}

// 监听新消息通知
const handleChatMessage = (message) => {
  if (message.type === 'CHAT_MESSAGE' && 
      message.receiverId === parseInt(localStorage.getItem('userId'))) {
    // 收到新消息时增加未读消息计数
    unreadMessageCount.value++
  }
}

// 去首页
const goToHome = () => {
  router.push('/user/home')
}

onMounted(() => {
  getUserInfo()
  fetchUnreadMessageCount()
  
  // 添加聊天消息监听
  websocketClient.addListener('chat', handleChatMessage)
})

// 在组件卸载时移除聊天消息监听
onUnmounted(() => {
  websocketClient.removeListener('chat', handleChatMessage)
})
</script>

<style scoped>
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  cursor: pointer;
}

.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.user-area {
  margin-left: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-avatar {
  margin-right: 8px;
}

.user-name {
  color: #333;
  display: flex;
  align-items: center;
  font-size: 16px;
}

.user-name .el-icon {
  margin-left: 5px;
}

.main-content {
  flex: 1;
  background-color: #f5f7fa;
}

.footer {
  background-color: #324057;
  color: #fff;
  padding: 30px 0;
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.footer-logo {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 15px;
}

.footer-links {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.footer-links a {
  color: #fff;
  text-decoration: none;
}

.footer-links a:hover {
  text-decoration: underline;
}

.footer-copyright {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* 自定义菜单样式 */
:deep(.el-menu--horizontal) {
  border-bottom: none;
}

:deep(.el-menu--horizontal>.el-menu-item) {
  height: 70px;
  line-height: 70px;
  font-size: 16px;
  padding: 0 20px;
}

:deep(.el-menu--horizontal>.el-menu-item.is-active) {
  font-weight: bold;
  border-bottom: 2px solid #409EFF;
}

.message-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}
</style> 