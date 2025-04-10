import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建axios实例
const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加token
    const token = localStorage.getItem('token')
    console.log(`请求URL: ${config.url}, 方法: ${config.method}`)
    
    if (token) {
      // 修改为后端需要的header名称"token"
      config.headers['token'] = token
      console.log(`添加token头: ${token.substring(0, Math.min(token.length, 15))}...`)
      
      // 记录用户ID，确保请求中包含用户标识
      const userId = localStorage.getItem('userId')
      if (userId) {
        console.log(`当前用户ID: ${userId}, 角色: ${localStorage.getItem('userRole') || '未知'}`)
      } else {
        console.warn('本地存储中没有找到userId')
      }
    } else {
      console.warn(`请求 ${config.url} 没有token，可能导致未授权错误`)
    }
    
    return config
  },
  error => {
    console.error('请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 记录响应信息
    console.log(`收到响应: ${response.config.url}, 状态: ${response.status}, 数据类型: ${typeof res}`)
    
    // 如果服务器返回的是二进制数据或其他特殊类型，直接返回
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }
    
    // 如果返回的状态码不是200，则提示错误信息
    if (res.code !== 200) {
      console.log('接口返回错误:', res)
      ElMessage.error(res.message || '请求失败')
      
      // 401: 未登录或token过期
      if (res.code === 401) {
        console.warn('接收到401未授权响应，准备跳转到登录页')
        
        // 保存当前路由，以便登录后返回
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          localStorage.setItem('redirectPath', currentPath)
          console.log('保存重定向路径:', currentPath)
        }
        
        // 清除登录状态
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        localStorage.removeItem('userId')
        
        // 延时跳转，避免路由冲突
        setTimeout(() => {
          console.log('跳转到登录页')
          router.replace('/login')
        }, 100)
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    } else {
      // 返回数据本身，而不是包装的响应对象
      return res
    }
  },
  error => {
    console.log('HTTP请求错误:', error)
    
    // 获取错误信息
    let message = error.message || '请求失败'
    
    if (error.response) {
      console.log('错误响应状态:', error.response.status)
      console.log('错误响应数据:', error.response.data)
      
      // 处理不同的HTTP状态码
      switch (error.response.status) {
        case 400:
          message = '请求错误'
          break
        case 401:
          message = '未授权，请重新登录'
          console.warn('接收到401未授权响应，准备跳转到登录页')
          
          // 保存当前路由，以便登录后返回
          const currentPath = window.location.pathname
          if (currentPath !== '/login') {
            localStorage.setItem('redirectPath', currentPath)
            console.log('保存重定向路径:', currentPath)
          }
          
          // 清除登录状态
          localStorage.removeItem('token')
          localStorage.removeItem('userRole')
          localStorage.removeItem('userId')
          
          // 延时跳转，避免路由冲突
          setTimeout(() => {
            console.log('跳转到登录页')
            router.replace('/login')
          }, 100)
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败: ${error.response.status}`
      }
      
      // 如果响应中包含具体错误信息，则使用该信息
      if (error.response.data && error.response.data.message) {
        message = error.response.data.message
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message = '服务器无响应，请稍后重试'
      console.log('请求未收到响应:', error.request)
    }
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service 