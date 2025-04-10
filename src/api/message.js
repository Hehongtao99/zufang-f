import request from '@/utils/request'

// 发送系统广播通知
export function sendBroadcastMessage(data) {
  return request({
    url: '/api/messages/broadcast',
    method: 'post',
    data
  })
}

// 获取系统通知列表
export function getSystemMessages(params) {
  return request({
    url: '/api/messages/system',
    method: 'get',
    params
  })
}

// 标记消息为已读
export function markMessageAsRead(messageId) {
  return request({
    url: `/api/messages/${messageId}/read`,
    method: 'put'
  })
}

// 获取用户的系统通知列表
export function getUserSystemMessages(params) {
  return request({
    url: '/api/messages/system',
    method: 'get',
    params
  })
} 