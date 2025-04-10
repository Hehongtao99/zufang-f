import request from '../utils/request';

/**
 * 获取房源评论列表
 * @param {number} houseId 房源ID
 */
export function getHouseComments(houseId) {
  return request({
    url: `/house/comment/list/${houseId}`,
    method: 'get',
    transformResponse: [function (data) {
      try {
        const parsedData = JSON.parse(data);
        console.log('获取评论原始响应:', parsedData);
        
        // 确保返回的数据是正确格式
        if (parsedData && parsedData.code === 200 && parsedData.data) {
          // 预处理头像地址
          if (Array.isArray(parsedData.data)) {
            parsedData.data.forEach(comment => {
              // 检查头像是否是默认头像
              const isDefaultAvatar = comment.avatar === 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
              
              console.log(`评论 ID: ${comment.id}, 用户: ${comment.nickname || comment.username}, 头像: ${comment.avatar}, 是默认头像: ${isDefaultAvatar}`);
              
              // 只处理非默认头像的URL
              if (comment.avatar && !isDefaultAvatar && !comment.avatar.startsWith('http') && !comment.avatar.startsWith('/api')) {
                comment.avatar = `/api${comment.avatar.startsWith('/') ? '' : '/'}${comment.avatar}`;
              }
              
              // 处理子评论
              if (comment.children && Array.isArray(comment.children)) {
                comment.children.forEach(reply => {
                  // 检查回复的头像是否是默认头像
                  const isReplyDefaultAvatar = reply.avatar === 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';
                  
                  console.log(`回复 ID: ${reply.id}, 用户: ${reply.nickname || reply.username}, 头像: ${reply.avatar}, 是默认头像: ${isReplyDefaultAvatar}`);
                  
                  // 只处理非默认头像的URL
                  if (reply.avatar && !isReplyDefaultAvatar && !reply.avatar.startsWith('http') && !reply.avatar.startsWith('/api')) {
                    reply.avatar = `/api${reply.avatar.startsWith('/') ? '' : '/'}${reply.avatar}`;
                  }
                });
              }
            });
          }
        }
        
        return parsedData;
      } catch (e) {
        console.error('解析评论数据失败:', e);
        return data;
      }
    }]
  });
}

/**
 * 添加评论
 * @param {Object} data 评论数据
 */
export function addComment(data) {
  return request({
    url: '/house/comment/add',
    method: 'post',
    data
  });
}

/**
 * 回复评论
 * @param {Object} data 评论数据
 */
export function replyComment(data) {
  return request({
    url: '/house/comment/reply',
    method: 'post',
    data
  });
}

/**
 * 删除评论
 * @param {number} commentId 评论ID
 */
export function deleteComment(commentId) {
  return request({
    url: `/house/comment/delete/${commentId}`,
    method: 'delete'
  });
} 