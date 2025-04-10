<template>
  <div class="layout">
    <header class="header">
      <div class="logo">租房系统-管理员端</div>
      <div class="user-info">
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
          :default-active="activeMenu"
          router
          unique-opened
          class="sidebar-menu"
        >
          <el-menu-item index="/admin/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/house">
            <el-icon><House /></el-icon>
            <span>房源管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/order">
            <el-icon><Ticket /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          
          <el-sub-menu index="contract">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>合同管理</span>
            </template>
            <el-menu-item index="/admin/contracts">合同列表</el-menu-item>
            <el-menu-item index="/admin/contract-templates">合同模板</el-menu-item>
          </el-sub-menu>
          
          <el-menu-item index="/admin/finance">
            <el-icon><Money /></el-icon>
            <span>财务管理</span>
          </el-menu-item>
          
          <el-menu-item index="/admin/region">
            <el-icon><LocationInformation /></el-icon>
            <span>地区管理</span>
          </el-menu-item>

          <el-menu-item index="/admin/notifications">
            <el-icon><Bell /></el-icon>
            <span>通知管理</span>
          </el-menu-item>
          
<!--          <el-menu-item index="/admin/system">-->
<!--            <el-icon><Setting /></el-icon>-->
<!--            <span>系统设置</span>-->
<!--          </el-menu-item>-->
        </el-menu>
      </aside>
      
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { 
  HomeFilled, 
  User, 
  House, 
  ArrowDown,
  Ticket,
  Money,
  Setting,
  Document,
  LocationInformation,
  Bell
} from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

// 计算当前活动菜单
const activeMenu = computed(() => {
  const { path } = route
  
  // 如果路径以/admin/house开头但不是精确的/admin/house
  if (path.startsWith('/admin/house/')) {
    return '/admin/house'
  }
  
  // 合同相关页面
  if (path === '/admin/contracts' || path === '/admin/contract-templates') {
    return path
  }
  
  return path
})

// 用户信息
const userInfo = ref({
  username: localStorage.getItem('username') || '',
  role: localStorage.getItem('userRole') || ''
})

// 获取用户信息
const getUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return
    }
    
    const userId = localStorage.getItem('userId')
    if (!userId) {
      return
    }
    
    const response = await request.get('/user/info', {
      params: { userId }
    })
    
    if (response && response.code === 200 && response.data) {
      userInfo.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'profile') {
    router.push('/admin/profile')
  } else if (command === 'logout') {
    logout()
  }
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 清除登录信息
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    
    // 跳转到登录页
    router.push('/login')
    
    ElMessage.success('已退出登录')
  }).catch(() => {})
}

onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.layout {
  height: 100vh;
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
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  overflow-y: auto;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.sidebar-menu {
  border-right: none;
}
</style> 