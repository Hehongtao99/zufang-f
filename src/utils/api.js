import request from './request'

// 用户相关
export const userApi = {
  // 登录
  login: (data) => {
    return request({
      url: '/user/login',
      method: 'post',
      data
    })
  },
  
  // 注册
  register: (data) => {
    return request({
      url: '/user/register',
      method: 'post',
      data
    })
  },
  
  // 获取用户信息
  getUserInfo: () => {
    return request({
      url: '/user/info',
      method: 'get'
    })
  },
  
  // 更新用户信息
  updateUserInfo: (data) => {
    return request({
      url: '/user/info',
      method: 'put',
      data
    })
  },
  
  // 修改密码
  changePassword: (data) => {
    return request({
      url: '/user/password',
      method: 'put',
      data
    })
  }
} 