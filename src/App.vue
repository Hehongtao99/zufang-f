<template>
  <router-view />
</template>

<script setup>
import { onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import websocketClient from '@/utils/websocket'

const route = useRoute()
const router = useRouter()

// 初始化WebSocket
const initWebSocket = () => {
  const token = localStorage.getItem('token')
  const userId = localStorage.getItem('userId')
  const userRole = localStorage.getItem('userRole')
  
  if (token && userId) {
    console.log('App.vue: 初始化WebSocket连接，用户ID:', userId)
    
    // 确保之前的连接已断开
    if (websocketClient.connected) {
      console.log('App.vue: 断开旧的WebSocket连接')
      websocketClient.disconnect()
    }
    
    // 连接WebSocket
    console.log('App.vue: 建立新的WebSocket连接')
    websocketClient.connect()
    
    // 订阅个人通知
    console.log('App.vue: 订阅用户通知，用户ID:', userId)
    websocketClient.subscribeToUserNotifications(userId)
    
    // 订阅聊天消息
    console.log('App.vue: 订阅聊天消息，用户ID:', userId)
    websocketClient.subscribeToChatMessages(userId)
    
    console.log('App.vue: WebSocket已初始化，用户ID:', userId, '角色:', userRole)
  } else {
    console.log('App.vue: 未找到登录信息，不初始化WebSocket')
  }
}

// 组件挂载时初始化WebSocket
onMounted(() => {
  console.log('App.vue: 组件挂载，初始化WebSocket')
  initWebSocket()
})

// 监听路由变化，如果登录状态变化，重新初始化WebSocket
watch(
  () => localStorage.getItem('token'),
  (newToken, oldToken) => {
    console.log('App.vue: token变化:', !!oldToken, '->', !!newToken)
    if (newToken) {
      console.log('App.vue: 检测到新的token，重新初始化WebSocket')
      initWebSocket()
    } else {
      // 如果登出，断开WebSocket连接
      console.log('App.vue: 检测到token移除，断开WebSocket连接')
      websocketClient.disconnect()
    }
  }
)

// 组件卸载时断开WebSocket连接
onUnmounted(() => {
  console.log('App.vue: 组件卸载，断开WebSocket连接')
  websocketClient.disconnect()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  height: 100%;
  width: 100%;
}

a {
  text-decoration: none;
}
</style> 