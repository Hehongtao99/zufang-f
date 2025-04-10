import request from '@/utils/request'

/**
 * 发送聊天消息
 * @param {Object} data 消息数据
 * @returns {Promise}
 */
export function sendChatMessage(data) {
  return request({
    url: 'chat/send',
    method: 'post',
    data
  })
}

/**
 * 获取聊天历史记录
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getChatHistory(params) {
  return request({
    url: 'chat/history',
    method: 'get',
    params
  })
}

/**
 * 获取未读消息数量
 * @param {number} userId 用户ID
 * @returns {Promise}
 */
export function getUnreadMessageCount(userId) {
  return request({
    url: 'chat/unread/count',
    method: 'get',
    params: { userId }
  })
}

/**
 * 标记所有消息为已读
 * @param {number} userId 用户ID
 * @returns {Promise}
 */
export function markAllAsRead(userId) {
  return request({
    url: 'chat/mark-all-read',
    method: 'post',
    params: { userId }
  })
}

/**
 * 标记特定会话消息为已读
 * @param {Object} params 参数
 * @returns {Promise}
 */
export function markConversationAsRead(params) {
  return request({
    url: 'chat/mark-conversation-read',
    method: 'post',
    params
  })
}

/**
 * 获取用户的聊天会话列表
 * @param {number} userId 用户ID
 * @returns {Promise}
 */
export function getChatSessions(userId) {
  return request({
    url: 'chat/sessions',
    method: 'get',
    params: { userId }
  })
} 