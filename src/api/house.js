// 导入request模块
import request from '@/utils/request'

// 添加发布房源方法
export function publishHouse(data) {
  return request({
    url: '/house/publish',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 房东端编辑房源
export function landlordEditHouse(data) {
  return request({
    url: '/landlord/house/edit',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 管理员端编辑房源
export function adminEditHouse(data) {
  return request({
    url: '/admin/houses/edit',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取房源图片列表 - 房东端
export function getLandlordHouseImages(houseId) {
  return request({
    url: `/landlord/house/${houseId}/images`,
    method: 'get'
  })
}

// 获取房源图片列表 - 管理员端
export function getAdminHouseImages(houseId) {
  return request({
    url: `/admin/houses/${houseId}/images`,
    method: 'get'
  })
}

// 搜索房源列表
export function searchHouses(params) {
  return request({
    url: '/houses/search',
    method: 'get',
    params
  })
} 