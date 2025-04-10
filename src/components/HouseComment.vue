<template>
  <div class="comment-section">
    <h3 class="section-title">用户评论</h3>
    
    <!-- 发表评论 -->
    <div class="comment-form">
      <el-input
        v-model="commentContent"
        type="textarea"
        :rows="3"
        placeholder="说点什么吧..."
        :disabled="!isLoggedIn"
      ></el-input>
      <div class="form-actions">
        <el-button 
          type="primary" 
          @click="submitComment" 
          :disabled="!isLoggedIn || !commentContent.trim()"
        >
          发表评论
        </el-button>
        <div v-if="!isLoggedIn" class="login-tip">
          请<router-link to="/login">登录</router-link>后发表评论
        </div>
      </div>
    </div>
    
    <!-- 评论列表 -->
    <div v-if="!loading" class="comment-list">
      <template v-if="comments && comments.length > 0">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <!-- 评论主体 -->
          <div class="comment-avatar">
            <img :src="comment.avatar || defaultAvatar" alt="用户头像">
          </div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="username">{{ comment.nickname || comment.username }}</span>
              <span class="time">{{ formatTime(comment.createTime) }}</span>
            </div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-actions">
              <span class="action-item" @click="showReplyForm(comment)">回复</span>
              <span v-if="canDelete(comment)" class="action-item delete" @click="deleteCommentConfirm(comment.id)">删除</span>
            </div>
          </div>

          <!-- 回复列表 -->
          <div v-if="comment.children && comment.children.length > 0" class="reply-list">
            <div v-for="reply in comment.children" :key="reply.id" class="reply-item">
              <div class="reply-avatar">
                <img :src="reply.avatar || defaultAvatar" alt="用户头像">
              </div>
              <div class="reply-content">
                <div class="reply-header">
                  <div class="reply-user-info">
                    <span class="username">{{ reply.nickname || reply.username }}</span>
                    <span v-if="reply.replyNickname || reply.replyUsername" class="reply-to">
                      回复 <span class="reply-username">{{ reply.replyNickname || reply.replyUsername }}</span>
                    </span>
                  </div>
                  <span class="time">{{ formatTime(reply.createTime) }}</span>
                </div>
                <div class="reply-text">{{ reply.content }}</div>
                <div class="reply-actions">
                  <span class="action-item" @click="showReplyForm(comment, reply)">回复</span>
                  <span v-if="canDelete(reply)" class="action-item delete" @click="deleteCommentConfirm(reply.id)">删除</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 回复表单 -->
          <div v-if="replyVisible && activeComment && activeComment.id === comment.id" class="reply-form">
            <div class="reply-form-header">
              <div class="reply-target">
                <template v-if="replyToComment">
                  回复 <span class="reply-to-username">{{ replyToComment.nickname || replyToComment.username }}</span> 的评论:
                </template>
                <template v-else>
                  回复评论:
                </template>
              </div>
              <el-button type="text" size="small" @click="cancelReply">取消</el-button>
            </div>
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="3"
              placeholder="请输入回复内容..."
            ></el-input>
            <div class="reply-form-actions">
              <el-button type="primary" size="small" @click="submitReply">提交回复</el-button>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="no-comments">
        暂无评论，快来发表第一条评论吧！
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getHouseComments, addComment, replyComment, deleteComment } from '../api/comment';

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 获取当前登录用户信息
const userStr = localStorage.getItem('user');
const user = ref(userStr ? JSON.parse(userStr) : null);
const isLoggedIn = computed(() => {
  // 检查localStorage和sessionStorage中的用户信息
  if (user.value) return true;
  
  // 尝试从sessionStorage获取
  const sessionUser = sessionStorage.getItem('user');
  if (sessionUser) {
    user.value = JSON.parse(sessionUser);
    return true;
  }
  
  // 检查是否有token，这可能表示用户已登录
  return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
});

// 如果用户登录但没有完整的user对象，则获取用户信息
const fetchCurrentUserInfo = async () => {
  if (isLoggedIn.value && !user.value) {
    try {
      const { userApi } = await import('@/utils/api');
      const res = await userApi.getUserInfo();
      if (res.code === 200 && res.data) {
        user.value = res.data;
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }
};

const props = defineProps({
  houseId: {
    type: [Number, String],
    required: true
  }
});

const comments = ref([]);
const commentContent = ref('');
const replyContent = ref('');
const replyVisible = ref(false);
const activeComment = ref(null);
const replyToComment = ref(null);
const loading = ref(false);

// 格式化评论树，将评论按层级组织
const formatCommentTree = (comments) => {
  if (!comments || comments.length === 0) {
    console.log('没有评论数据，返回空数组');
    return [];
  }

  console.log('开始格式化评论树，原始评论数据数量:', comments.length);
  
  // 打印每条评论的关键信息
  comments.forEach(comment => {
    console.log(`评论ID: ${comment.id}, 内容: ${comment.content.substring(0, 15)}..., rootId: ${comment.rootId}, parentId: ${comment.parentId}`);
  });

  // 从后端返回的评论数据中恢复评论树结构
  // 后端已经构建好了评论树，我们只需要正确显示
  return comments;
};

// 获取当前用户的头像
const getCurrentUserAvatar = () => {
  // 从localStorage中获取用户信息
  const currentUserStr = localStorage.getItem('user');
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      if (currentUser && currentUser.avatar && currentUser.avatar !== defaultAvatar) {
        return currentUser.avatar;
      }
    } catch (e) {
      console.error('解析用户信息失败:', e);
    }
  }
  
  // 从sessionStorage中获取用户信息
  const sessionUserStr = sessionStorage.getItem('user');
  if (sessionUserStr) {
    try {
      const sessionUser = JSON.parse(sessionUserStr);
      if (sessionUser && sessionUser.avatar && sessionUser.avatar !== defaultAvatar) {
        return sessionUser.avatar;
      }
    } catch (e) {
      console.error('解析会话用户信息失败:', e);
    }
  }
  
  return null;
};

// 获取评论列表
const fetchComments = async () => {
  // 确保 houseId 存在且有效
  if (!props.houseId) {
    console.warn('房源ID不存在，无法获取评论');
    return;
  }
  
  try {
    loading.value = true;
    const { data } = await getHouseComments(props.houseId);
    
    console.log('后端返回的原始评论数据:', data);
    
    // 获取当前用户的头像
    const currentUserAvatar = getCurrentUserAvatar();
    const currentUserId = user.value?.id;
    
    // 检查头像字段
    if (data && data.length > 0) {
      data.forEach(comment => {
        console.log(`评论ID: ${comment.id}, 用户: ${comment.nickname || comment.username}, 头像: ${comment.avatar || '无头像'}`);
        
        // 如果是当前用户的评论且头像是默认头像，使用当前用户的头像
        if (currentUserId && comment.userId === currentUserId && 
            (!comment.avatar || comment.avatar === defaultAvatar) && currentUserAvatar) {
          comment.avatar = currentUserAvatar;
          console.log('使用当前用户头像替换默认头像:', currentUserAvatar);
        }
        
        // 确保avatar字段存在并处理路径
        if (comment.avatar) {
          // 处理avatar路径，添加API前缀如果需要
          if (!comment.avatar.startsWith('http') && !comment.avatar.startsWith('/api')) {
            comment.avatar = `/api${comment.avatar.startsWith('/') ? '' : '/'}${comment.avatar}`;
          }
        }
        
        // 处理子评论的avatar字段
        if (comment.children && comment.children.length > 0) {
          comment.children.forEach(reply => {
            console.log(`回复ID: ${reply.id}, 用户: ${reply.nickname || reply.username}, 头像: ${reply.avatar || '无头像'}`);
            
            // 如果是当前用户的回复且头像是默认头像，使用当前用户的头像
            if (currentUserId && reply.userId === currentUserId && 
                (!reply.avatar || reply.avatar === defaultAvatar) && currentUserAvatar) {
              reply.avatar = currentUserAvatar;
              console.log('使用当前用户头像替换回复中的默认头像:', currentUserAvatar);
            }
            
            // 处理avatar路径
            if (reply.avatar) {
              // 处理avatar路径，添加API前缀如果需要
              if (!reply.avatar.startsWith('http') && !reply.avatar.startsWith('/api')) {
                reply.avatar = `/api${reply.avatar.startsWith('/') ? '' : '/'}${reply.avatar}`;
              }
            }
          });
        }
      });
    }
    
    // 直接使用后端返回的数据，不需要额外处理
    comments.value = data || [];
    console.log('评论数据加载完成，共', comments.value.length, '条根评论');
    
  } catch (error) {
    console.error('获取评论失败:', error);
    ElMessage.error('获取评论失败');
  } finally {
    loading.value = false;
  }
};

// 提交评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    return;
  }
  
  // 确保 houseId 存在且有效
  if (!props.houseId) {
    ElMessage.warning('房源ID不存在，无法提交评论');
    return;
  }
  
  // 确保用户已登录
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再发表评论');
    return;
  }
  
  try {
    // 如果没有完整用户信息，先获取
    if (!user.value) {
      await fetchCurrentUserInfo();
    }
    
    if (!user.value || !user.value.id) {
      ElMessage.warning('无法获取用户信息，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    
    const response = await addComment({
      houseId: props.houseId,
      content: commentContent.value,
      userId: user.value.id
    });
    
    if (response && response.code === 200) {
      ElMessage.success('评论成功');
      commentContent.value = '';
      // 刷新评论列表
      await fetchComments();
    } else {
      ElMessage.error(response?.message || '评论失败');
    }
  } catch (error) {
    console.error('评论失败:', error);
    ElMessage.error('评论失败: ' + (error.response?.data?.message || error.message || '未知错误'));
  }
};

// 显示回复表单
const showReplyForm = (rootComment, replyToCommentObj = null) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录');
    return;
  }
  
  replyVisible.value = true;
  activeComment.value = rootComment;
  replyToComment.value = replyToCommentObj;
  replyContent.value = '';
};

// 取消回复
const cancelReply = () => {
  replyVisible.value = false;
  activeComment.value = null;
  replyToComment.value = null;
  replyContent.value = '';
};

// 提交回复
const submitReply = async () => {
  if (!replyContent.value.trim()) {
    return;
  }
  
  // 确保 houseId 存在且有效
  if (!props.houseId) {
    ElMessage.warning('房源ID不存在，无法提交回复');
    return;
  }
  
  // 确保用户已登录
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再回复评论');
    return;
  }
  
  try {
    // 如果没有完整用户信息，先获取
    if (!user.value) {
      await fetchCurrentUserInfo();
    }
    
    if (!user.value || !user.value.id) {
      ElMessage.warning('无法获取用户信息，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    
    // 确定被回复的评论ID
    const parentId = replyToComment.value ? replyToComment.value.id : activeComment.value.id;
    
    // 确定根评论ID：
    // 如果active评论是根评论(没有rootId)，那么rootId就是activeComment.id
    // 否则使用activeComment已有的rootId
    const rootId = activeComment.value.rootId || activeComment.value.id;
    
    console.log('提交回复:', {
      houseId: props.houseId,
      content: replyContent.value,
      parentId,
      rootId,
      userId: user.value.id,
      replyToComment: replyToComment.value ? {
        id: replyToComment.value.id,
        nickname: replyToComment.value.nickname,
        username: replyToComment.value.username
      } : null
    });
    
    await replyComment({
      houseId: props.houseId,
      content: replyContent.value,
      parentId: parentId,
      userId: user.value.id,
      rootId: rootId
    });
    
    ElMessage.success('回复成功');
    cancelReply();
    fetchComments();
  } catch (error) {
    console.error('回复失败:', error);
    ElMessage.error('回复失败: ' + (error.response?.data?.message || error.message || '未知错误'));
  }
};

// 确认删除评论
const deleteCommentConfirm = (commentId) => {
  ElMessageBox.confirm('确认删除此评论吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteCommentAction(commentId);
  }).catch(() => {});
};

// 删除评论
const deleteCommentAction = async (commentId) => {
  // 确保用户已登录
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录');
    return;
  }
  
  try {
    await deleteComment(commentId);
    ElMessage.success('删除成功');
    fetchComments();
  } catch (error) {
    console.error('删除失败:', error);
    ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message || '未知错误'));
  }
};

// 判断是否可以删除评论
const canDelete = (comment) => {
  if (!isLoggedIn.value || !user.value) return false;
  // 自己的评论或管理员可以删除
  return user.value.id === comment.userId || user.value.role === 'ADMIN';
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchComments();
  // 确保有用户信息
  fetchCurrentUserInfo();
});
</script>

<style scoped>
.comment-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #303133;
  font-weight: bold;
}

.comment-form {
  margin-bottom: 30px;
}

.form-actions {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-tip {
  color: #909399;
  font-size: 14px;
}

.comment-list {
  margin-top: 20px;
}

.comment-item {
  padding: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.comment-avatar {
  float: left;
  margin-right: 10px;
}

.comment-content {
  display: inline-block;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.username {
  font-weight: bold;
  color: #409EFF;
}

.time {
  color: #909399;
  font-size: 12px;
}

.comment-text {
  margin: 10px 0;
  line-height: 1.6;
  word-break: break-all;
}

.comment-actions {
  display: flex;
  gap: 15px;
}

.action-item {
  cursor: pointer;
  color: #409EFF;
}

.delete {
  color: #F56C6C;
}

.reply-list {
  margin-left: 40px;
  padding-left: 15px;
  margin-top: 10px;
  border-left: 3px solid #ebeef5;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.reply-item {
  padding: 10px;
  margin-bottom: 5px;
  position: relative;
  border-bottom: 1px dashed #ebeef5;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-item:hover {
  background-color: #f0f2f5;
}

.reply-avatar {
  float: left;
  margin-right: 10px;
}

.reply-content {
  display: inline-block;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reply-user-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.reply-to {
  display: inline-block;
  color: #909399;
  background-color: #eef1f6;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 8px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.reply-username {
  font-weight: bold;
  color: #409EFF;
}

.reply-text {
  margin: 10px 0;
  line-height: 1.6;
  word-break: break-all;
}

.reply-actions {
  display: flex;
  gap: 15px;
}

.reply-form {
  margin: 10px 0;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.reply-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reply-to-username {
  font-weight: bold;
  color: #409EFF;
}

.reply-form-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.no-comments {
  color: #909399;
  font-size: 14px;
  text-align: center;
  padding: 30px 0;
}

.comment-avatar img, .reply-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reply-avatar img {
  width: 32px;
  height: 32px;
}

.reply-target {
  background-color: #eef5fe;
  padding: 5px 10px;
  border-radius: 4px;
  color: #606266;
  font-size: 13px;
}
</style> 