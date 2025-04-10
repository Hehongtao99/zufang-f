import request from '@/utils/request';

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get'
  });
}

// 更新用户信息
export function updateUserInfo(data) {
  return request({
    url: '/user/info',
    method: 'put',
    data
  });
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/user/password',
    method: 'put',
    data
  });
}

// 获取用户已租房源列表
export function getUserRentedHouses(params) {
  return request({
    url: '/user/houses',
    method: 'get',
    params
  });
} 