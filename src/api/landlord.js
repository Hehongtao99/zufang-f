import request from '@/utils/request'

/**
 * 获取房东首页统计数据
 * @returns {Promise}
 */
export function getLandlordHomeStatistics() {
  return request({
    url: '/landlord/dashboard/statistics',
    method: 'get'
  })
}

/**
 * 获取房东房源列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getLandlordHouses(params) {
  return request({
    url: '/landlord/houses',
    method: 'get',
    params
  })
}

/**
 * 获取房东待处理预约列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getLandlordPendingAppointments(params) {
  return request({
    url: '/landlord/appointments/pending',
    method: 'get',
    params
  })
}

/**
 * 获取房东进行中订单列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getLandlordActiveOrders(params) {
  return request({
    url: '/landlord/orders/active',
    method: 'get',
    params
  })
} 