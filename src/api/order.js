import request from '@/utils/request';

// 获取所有订单列表（管理员）
export function getOrders(params) {
  return request({
    url: '/admin/orders',
    method: 'get',
    params
  });
}

// 获取订单详情（管理员）
export function getOrderDetail(id) {
  return request({
    url: `/admin/orders/${id}`,
    method: 'get'
  });
}

// 获取房东的订单列表
export function getLandlordOrders(params) {
  return request({
    url: '/landlord/orders',
    method: 'get',
    params
  });
}

// 获取房东订单详情（确保也可以用于获取退租申请详情）
export function getLandlordOrderDetail(id) {
  return request({
    url: `/landlord/orders/${id}`,
    method: 'get'
  });
}

// 获取房东财务统计
export function getLandlordFinanceStatistics() {
  return request({
    url: '/landlord/finance/statistics',
    method: 'get'
  });
}

// 获取房东收入明细
export function getLandlordIncomeList(params) {
  return request({
    url: '/landlord/finance/income',
    method: 'get',
    params
  });
}

// 获取用户的订单列表
export function getUserOrders(params) {
  return request({
    url: '/user/orders',
    method: 'get',
    params
  });
}

// 获取用户订单详情
export function getUserOrderDetail(id) {
  return request({
    url: `/user/orders/${id}`,
    method: 'get'
  });
}

// 用户创建订单
export function createOrder(data) {
  return request({
    url: '/user/orders/book',
    method: 'post',
    data
  });
}

// 用户支付订单
export function payOrder(id, data) {
  return request({
    url: `/user/orders/${id}/pay`,
    method: 'post',
    data
  });
}

// 用户取消订单
export function cancelOrder(id, data) {
  return request({
    url: `/user/orders/${id}/cancel`,
    method: 'post',
    data
  });
}

// 用户取消支付
export function cancelPayment(id, data) {
  return request({
    url: `/user/orders/${id}/cancelPayment`,
    method: 'post',
    data
  });
}

// 用户申请退租
export function terminateRental(id, data) {
  return request({
    url: `/user/orders/${id}/terminate`,
    method: 'post',
    data
  });
}

// 用户支付违约金
export function payPenalty(id, data) {
  return request({
    url: `/user/orders/${id}/payPenalty`,
    method: 'post',
    data
  });
}

// 房东获取退租申请列表
export function getTerminateRequests(params) {
  return request({
    url: '/landlord/terminates',
    method: 'get',
    params
  });
}

// 兼容API名称
export function getTerminateList(params) {
  return getTerminateRequests(params);
}

/**
 * 获取单个退租详情信息
 * @param {number} id - 订单ID
 * @returns {Promise} - API请求Promise
 * 
 * 后端接口已实现，可以正常使用此函数
 */
export function getTerminateDetail(id) {
  console.log('获取退租详情，订单ID:', id);
  return request({
    url: `/landlord/terminates/${id}`,
    method: 'get'
  });
}

/**
 * 房东处理退租申请
 * @param {Object} params - 处理参数
 * @returns {Promise} - API请求Promise
 */
export function handleTerminateRequest(params) {
  console.log('发送退租处理请求参数:', params); // 添加日志记录请求参数
  return request({
    url: '/landlord/orders/handleTerminate',
    method: 'post',
    data: params // 使用data而不是params，确保参数在请求体中而不是URL中
  })
}

// 房东确认退租完成
export function confirmTermination(id) {
  return request({
    url: `/landlord/orders/${id}/confirmTermination`,
    method: 'post'
  });
}

// 兼容API名称 - 别名
export function confirmTerminate(id) {
  return confirmTermination(id);
}

// 管理员触发自动退租检查（到期的租约）
export function triggerAutoTerminate() {
  return request({
    url: '/admin/orders/autoTerminate',
    method: 'post'
  });
} 