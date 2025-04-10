<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">
        <h2>租房系统</h2>
        <p>欢迎登录</p>
      </div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入邮箱">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <CaptchaInput v-model="loginForm.captcha" ref="captchaRef" />
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="login" style="width: 100%">登录</el-button>
        </el-form-item>
        
        <div class="login-options">
          <router-link to="/register">没有账号？去注册</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/utils/api'
import { Message, Lock } from '@element-plus/icons-vue'
import websocketClient from '@/utils/websocket'
import CaptchaInput from '@/components/CaptchaInput.vue'

const router = useRouter()

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

// 表单校验规则
const loginRules = {
  username: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!captchaRef.value?.validateCaptcha(value)) {
          callback(new Error('验证码错误'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 表单ref
const loginFormRef = ref(null)
const captchaRef = ref(null)

// 加载状态
const loading = ref(false)

// 初始化WebSocket连接
const initWebSocketConnection = (userId) => {
  if (userId) {
    // 确保先断开之前的连接
    websocketClient.disconnect()
    
    // 连接WebSocket
    websocketClient.connect()
    
    // 订阅个人通知
    websocketClient.subscribeToUserNotifications(userId)
    
    console.log('登录成功后初始化WebSocket，用户ID:', userId)
  }
}

// 登录方法
const login = () => {
  // 表单校验
  loginFormRef.value?.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 调用登录接口
        console.log('正在登录，用户名:', loginForm.username)
        const loginData = {
          username: loginForm.username,
          password: loginForm.password
        }
        const res = await userApi.login(loginData)
        
        console.log('登录成功，返回数据:', res)
        
        // 保存token和角色到localStorage
        if (res && res.data && res.data.token) {
          localStorage.setItem('token', res.data.token)
          console.log('Token已保存:', res.data.token)
          
          // 保存用户ID和角色
          if (res.data.userId) {
            localStorage.setItem('userId', res.data.userId.toString())
            console.log('用户ID已保存:', res.data.userId)
            
            // 主动初始化WebSocket连接
            initWebSocketConnection(res.data.userId)
          } else {
            console.warn('登录响应中没有userId，尝试从JWT中提取')
            // 如果后端没有直接返回userId，可能需要解析JWT或获取用户信息
          }
          
          if (res.data.userRole) {
            console.log('获取到用户角色:', res.data.userRole)
            localStorage.setItem('userRole', res.data.userRole)
            console.log('用户角色已保存到localStorage:', res.data.userRole)
            
            // 根据角色跳转到对应的首页
            const role = res.data.userRole
            
            // 检查是否有重定向路径
            const redirectPath = localStorage.getItem('redirectPath')
            if (redirectPath) {
              console.log('存在重定向路径，跳转到:', redirectPath)
              localStorage.removeItem('redirectPath')  // 使用后清除
              router.push(redirectPath)
            } else {
              // 没有重定向路径，跳转到角色对应的首页
              let targetPath = '/user' // 默认用户首页
              
              if (role === 'ADMIN') {
                targetPath = '/admin'
              } else if (role === 'LANDLORD') {
                targetPath = '/landlord'
              }
              
              console.log('准备跳转到角色对应的首页:', targetPath)
              
              // 这里加一个延时确保数据已保存
              setTimeout(() => {
                router.push(targetPath)
                console.log('已跳转到:', targetPath)
                ElMessage.success('登录成功')
              }, 100)
            }
            
            return
          }
          
          // 如果响应中没有角色信息，仍然需要获取用户信息
          console.log('登录响应中没有角色信息，尝试获取用户信息')
          try {
            const userInfo = await userApi.getUserInfo()
            console.log('获取用户信息成功:', userInfo)
            
            if (userInfo && userInfo.data) {
              // 如果之前没有保存userId，从用户信息中获取并保存
              if (!localStorage.getItem('userId') && userInfo.data.id) {
                localStorage.setItem('userId', userInfo.data.id.toString())
                console.log('从用户信息中获取并保存用户ID:', userInfo.data.id)
                
                // 初始化WebSocket连接
                initWebSocketConnection(userInfo.data.id)
              }
              
              const userRole = userInfo.data.role
              console.log('从用户信息中获取角色:', userRole)
              localStorage.setItem('userRole', userRole)
              console.log('用户角色已保存:', userRole)
              
              // 根据角色跳转到对应的首页
              const role = userRole
              
              // 检查是否有重定向路径
              const redirectPath = localStorage.getItem('redirectPath')
              if (redirectPath) {
                console.log('存在重定向路径，跳转到:', redirectPath)
                localStorage.removeItem('redirectPath')  // 使用后清除
                router.push(redirectPath)
              } else {
                // 没有重定向路径，跳转到角色对应的首页
                let targetPath = '/user' // 默认用户首页
                
                if (role === 'ADMIN') {
                  targetPath = '/admin'
                } else if (role === 'LANDLORD') {
                  targetPath = '/landlord'
                }
                
                console.log('准备跳转到角色对应的首页:', targetPath)
                
                // 这里加一个延时确保数据已保存
                setTimeout(() => {
                  router.push(targetPath)
                  console.log('已跳转到:', targetPath)
                  ElMessage.success('登录成功')
                }, 100)
              }
            } else {
              console.error('获取用户信息成功但数据为空')
              ElMessage.error('获取用户信息失败')
            }
          } catch (infoError) {
            console.error('获取用户信息失败:', infoError)
            ElMessage.error('登录成功但获取用户信息失败')
          }
        } else {
          console.error('登录成功但未返回token')
          ElMessage.error('登录失败，服务器未返回有效数据')
        }
      } catch (error) {
        console.error('登录失败:', error)
        
        if (error.response) {
          console.log('错误状态码:', error.response.status)
          console.log('错误数据:', error.response.data)
          
          // 根据错误状态码给出具体提示
          if (error.response.status === 500) {
            ElMessage.error('服务器内部错误，请联系管理员')
          } else if (error.response.status === 401) {
            ElMessage.error('用户名或密码错误')
          } else if (error.response.data && error.response.data.message) {
            ElMessage.error(error.response.data.message)
          } else {
            ElMessage.error('登录失败，请稍后再试')
          }
        } else {
          ElMessage.error('网络错误，请检查网络连接')
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #3494e6, #ec6ead);
}

.login-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
}

.login-title h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.login-title p {
  font-size: 14px;
  color: #909399;
}

.login-options {
  display: flex;
  justify-content: flex-end;
  font-size: 14px;
  margin-top: 10px;
}

.login-options a {
  color: #409eff;
}
</style> 