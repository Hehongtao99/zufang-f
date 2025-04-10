import request from '@/utils/request';

// 获取合同列表（管理员）
export function getContracts(params) {
  return request({
    url: '/admin/contracts',
    method: 'get',
    params
  });
}

// 获取合同详情（管理员）
export function getContract(id) {
  return request({
    url: `/admin/contracts/${id}`,
    method: 'get'
  });
}

// 终止合同（管理员）
export function terminateContract(id) {
  return request({
    url: `/admin/contracts/${id}/terminate`,
    method: 'post'
  });
}

// 获取合同模板列表（管理员）
export function getContractTemplates(params) {
  return request({
    url: '/admin/contract-templates',
    method: 'get',
    params
  });
}

// 获取合同模板详情（管理员）
export function getContractTemplate(id) {
  return request({
    url: `/admin/contract-templates/${id}`,
    method: 'get'
  });
}

// 创建合同模板（管理员）
export function createContractTemplate(data) {
  return request({
    url: '/admin/contract-templates',
    method: 'post',
    data
  });
}

// 更新合同模板（管理员）
export function updateContractTemplate(id, data) {
  return request({
    url: `/admin/contract-templates/${id}`,
    method: 'put',
    data
  });
}

// 删除合同模板（管理员）
export function deleteContractTemplate(id) {
  return request({
    url: `/admin/contract-templates/${id}`,
    method: 'delete'
  });
}

// 获取所有可用合同模板（房东）
export function getAllContractTemplates() {
  return request({
    url: '/contract-templates/all',
    method: 'get'
  });
}

// 获取用户的合同列表（租客/房东）
export function getUserContracts(params) {
  return request({
    url: '/user/contracts',
    method: 'get',
    params
  });
}

// 获取用户合同详情（租客/房东）
export function getUserContract(id) {
  return request({
    url: `/user/contracts/${id}`,
    method: 'get'
  });
}

// 签署合同（租客/房东）
export function signContract(data) {
  return request({
    url: '/user/contracts/sign',
    method: 'post',
    data
  });
}

// 创建订单合同
export function createOrderContract(orderId) {
  return request({
    url: `/user/contracts/create/${orderId}`,
    method: 'post'
  });
} 