<template>
  <div class="message-container">
    <h1>消息中心</h1>
    <el-card class="message-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="聊天记录" name="chat">
          <div class="chat-list">
            <el-empty v-if="chatSessions.length === 0" description="暂无聊天记录" />
            <el-card 
              v-else 
              v-for="chat in chatSessions" 
              :key="chat.sessionKey" 
              class="chat-item"
              shadow="hover"
              @click="openChatSession(chat)" 
            >
              <div class="chat-item-header">
                <div class="chat-item-user">
                  <el-avatar :size="40" :src="chat.landlordAvatar">{{ chat.landlordName.substring(0, 1) }}</el-avatar>
                  <div class="chat-item-info">
                    <div class="chat-item-name">{{ chat.landlordName }}</div>
                    <div class="chat-item-house">{{ chat.houseName }}</div>
                  </div>
                </div>
                <div class="chat-item-meta">
                  <div class="chat-item-time">{{ formatTime(chat.lastMessageTime) }}</div>
                  <el-badge v-if="chat.unreadCount > 0" :value="chat.unreadCount" class="unread-badge" />
                </div>
              </div>
              <div class="chat-item-content">
                <div class="chat-item-message">{{ chat.lastMessage }}</div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
        <el-tab-pane label="系统通知" name="system">
          <div class="system-messages">
            <el-empty v-if="systemMessages.length === 0" description="暂无系统通知" />
            <div v-else>
              <div v-for="(msg, index) in systemMessages" :key="index" class="message-item">
                <div class="message-header">
                  <h3 class="message-title">{{ msg.title }}</h3>
                  <span class="message-time">{{ formatTime(msg.createTime) }}</span>
                </div>
                <div class="message-content">{{ msg.content }}</div>
              </div>
              <div class="pagination">
                <el-pagination
                  v-model:current-page="systemPage"
                  :page-size="systemPageSize"
                  :total="systemTotal"
                  @current-change="handleSystemPageChange"
                  layout="total, prev, pager, next"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 聊天对话框 -->
    <el-dialog
      v-if="chatDialogVisible" 
      v-model="chatDialogVisible" 
      :title="`与 ${currentChat?.landlordName || '房东'} 的对话`" 
      width="400px"
      :destroy-on-close="false"
      :before-close="closeChatDialog"
      class="chat-dialog"
    >
      <Chat 
        v-if="chatDialogVisible && currentChat"
        :houseId="currentChat.houseId" 
        :userId="Number(userId)"
        :landlordId="currentChat.landlordId"
        :houseName="currentChat.houseName"
        :currentUserName="userName"
        :otherUserName="currentChat.landlordName"
        :currentUserAvatar="userAvatar"
        :otherUserAvatar="currentChat.landlordAvatar"
        :compact="true" 
        @close="closeChatDialog" 
        @message-sent="handleMessageSent" 
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import Chat from '@/components/Chat.vue';
import { getChatHistory, getUnreadMessageCount, getChatSessions, markConversationAsRead } from '@/api/chat';
import { getUserSystemMessages, markMessageAsRead } from '@/api/message';
import websocketClient from '@/utils/websocket';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();

const activeTab = ref('chat');

// 当前用户信息
const userId = localStorage.getItem('userId');
const userName = localStorage.getItem('nickname') || localStorage.getItem('username') || '用户';
const userAvatar = localStorage.getItem('avatar') || '';

// 聊天会话列表
const chatSessions = ref([]);

// 聊天对话框相关状态
const chatDialogVisible = ref(false);
const currentChat = ref(null);

// 系统消息相关
const systemMessages = ref([]);
const systemLoading = ref(false);
const systemTotal = ref(0);
const systemPage = ref(1);
const systemPageSize = ref(10);

// 监听标签页切换
watch(activeTab, (newTab) => {
  if (newTab === 'system') {
    loadSystemMessages();
  }
});

// 从URL参数中读取默认标签页
onMounted(() => {
  const tabParam = route.query.tab;
  if (tabParam === 'system') {
    activeTab.value = 'system';
  }
});

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// 加载聊天会话
const loadChatSessions = async () => {
  try {
    const res = await getChatSessions(userId);
    
    if (res && res.code === 200) {
      chatSessions.value = res.data || [];
    } else {
      console.error('获取聊天会话失败:', res?.message);
      chatSessions.value = [];
    }
    
    // URL参数处理逻辑
    const { landlordId, houseId } = route.query;
    if (landlordId && houseId) {
      const session = chatSessions.value.find(s => 
        s.landlordId === Number(landlordId) && s.houseId === Number(houseId)
      );
      
      if (session) {
        openChatSession(session);
      } else {
        // 如果找不到会话但有URL参数，尝试创建一个新会话
        try {
          // 获取房东信息
          const landlordRes = await request.get(`/users/${landlordId}`);
          
          // 获取房源信息
          const houseRes = await request.get(`/houses/${houseId}`);
          
          if (landlordRes && landlordRes.code === 200 && houseRes && houseRes.code === 200) {
            const landlordData = landlordRes.data;
            const houseData = houseRes.data;
            
            const newSession = {
              sessionKey: `${landlordId}_${houseId}`,
              landlordId: Number(landlordId),
              houseId: Number(houseId),
              landlordName: landlordData.nickname || landlordData.username || '房东',
              landlordAvatar: landlordData.avatar || '',
              houseName: houseData.title || '房源咨询',
              lastMessage: '',
              lastMessageTime: new Date().toISOString(),
              unreadCount: 0
            };
            
            chatSessions.value.unshift(newSession);
            openChatSession(newSession);
          }
        } catch (err) {
          console.error('创建新会话失败:', err);
          ElMessage.error('创建新会话失败');
        }
      }
    }
  } catch (error) {
    console.error('加载聊天会话失败:', error);
    ElMessage.error('加载聊天会话失败');
    
    // 错误处理：保持现有会话或使用空数组
    if (!chatSessions.value) {
      chatSessions.value = [];
    }
  }
};

// 加载系统消息
const loadSystemMessages = async () => {
  systemLoading.value = true;
  try {
    const res = await getUserSystemMessages({
      pageNum: systemPage.value,
      pageSize: systemPageSize.value,
      userId: userId
    });
    
    if (res.code === 200 && res.data) {
      systemMessages.value = res.data.records || [];
      systemTotal.value = res.data.total || 0;
    } else {
      ElMessage.error('获取系统消息失败');
    }
  } catch (error) {
    console.error('获取系统消息失败:', error);
    ElMessage.error('获取系统消息失败');
  } finally {
    systemLoading.value = false;
  }
};

// 处理系统消息分页变化
const handleSystemPageChange = (page) => {
  systemPage.value = page;
  loadSystemMessages();
};

// 打开聊天会话
const openChatSession = (chat) => {
  currentChat.value = chat;
  chatDialogVisible.value = true;
  
  // 标记会话为已读
  if (chat.unreadCount > 0) {
    markConversationRead(chat);
  }
};

// 关闭聊天对话框
const closeChatDialog = () => {
  chatDialogVisible.value = false;
};

// 处理消息发送
const handleMessageSent = (message) => {
  console.log('对话消息已发送:', message);
  // 可以添加更新会话列表的逻辑
};

// 监听聊天消息
const chatMessageListener = (message) => {
  console.log('收到聊天消息:', message);
  
  if (message.type === 'CHAT_MESSAGE' && message.receiverId === Number(userId)) {
    // 更新会话列表
    updateChatSession(message);
  }
};

// 更新聊天会话
const updateChatSession = (message) => {
  const senderId = message.senderId; // 房东ID
  const houseId = message.referenceId;
  const sessionKey = `${senderId}_${houseId}`;
  
  // 查找是否已存在该会话
  const existingSessionIndex = chatSessions.value.findIndex(s => s.sessionKey === sessionKey);
  
  if (existingSessionIndex >= 0) {
    // 更新现有会话
    const session = { ...chatSessions.value[existingSessionIndex] };
    session.lastMessage = message.content;
    session.lastMessageTime = message.timestamp;
    session.unreadCount += 1;
    
    // 如果当前正在查看这个会话，则不增加未读数
    if (chatDialogVisible.value && currentChat.value && 
        currentChat.value.landlordId === senderId && 
        currentChat.value.houseId === houseId) {
      session.unreadCount = 0;
      markConversationRead(session);
    }
    
    chatSessions.value.splice(existingSessionIndex, 1);
    chatSessions.value.unshift(session);
  } else {
    // 创建新会话
    chatSessions.value.unshift({
      sessionKey,
      landlordId: senderId,
      houseId,
      landlordName: message.data?.senderName || '房东',
      landlordAvatar: message.data?.senderAvatar || '',
      houseName: message.data?.houseName || '房源咨询',
      lastMessage: message.content,
      lastMessageTime: message.timestamp,
      unreadCount: 1
    });
  }
};

// 监听系统广播消息
const systemMessageListener = (message) => {
  console.log('收到系统广播消息:', message);
  
  // 如果当前在系统消息标签页，则刷新列表
  if (activeTab.value === 'system') {
    loadSystemMessages();
  } else {
    // 其他标签页可以显示一个小红点提示有新消息
    // 这里可以添加一个标记，表示有未读系统消息
  }
};

onMounted(() => {
  // 加载聊天会话
  loadChatSessions();
  
  // 添加聊天消息监听
  websocketClient.addListener('chat', chatMessageListener);
  
  // 添加系统消息监听
  websocketClient.addListener('system', systemMessageListener);
  
  // 如果URL中有指定的房东ID和房源ID，自动打开聊天窗口
  const { landlordId, houseId } = route.query;
  if (landlordId && houseId) {
    activeTab.value = 'chat';
  }
});

onUnmounted(() => {
  // 移除聊天消息监听
  websocketClient.removeListener('chat', chatMessageListener);
  
  // 移除系统消息监听
  websocketClient.removeListener('system', systemMessageListener);
});
</script>

<style scoped>
.message-container {
  padding: 20px;
}

.message-card {
  margin-bottom: 20px;
}

.chat-list {
  margin-top: 20px;
}

.chat-item {
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.chat-item:hover {
  transform: translateY(-2px);
}

.chat-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.chat-item-user {
  display: flex;
  align-items: center;
}

.chat-item-info {
  margin-left: 10px;
}

.chat-item-name {
  font-weight: bold;
  color: #303133;
}

.chat-item-house {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.chat-item-meta {
  text-align: right;
}

.chat-item-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.chat-item-content {
  margin-top: 10px;
}

.chat-item-message {
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.unread-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}

.chat-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 400px;
  overflow: hidden;
}

.chat-dialog :deep(.el-dialog) {
  max-width: 400px;
  border-radius: 4px;
}

.chat-dialog :deep(.el-dialog__header) {
  padding: 10px;
  margin: 0;
}

.chat-dialog :deep(.el-dialog__headerbtn) {
  top: 10px;
}

/* 确保对话框内的消息能够贴紧右侧 */
.chat-dialog :deep(.message-item-right) {
  justify-content: flex-end;
  flex-direction: row-reverse;
  margin-right: 0 !important;
  padding-left: 20% !important; /* 给左侧留出更多空间 */
  padding-right: 0 !important; /* 移除右侧内边距 */
}

/* 确保左侧消息也能贴紧左侧 */
.chat-dialog :deep(.message-item-left) {
  justify-content: flex-start;
  margin-left: 0 !important;
  padding-right: 20% !important; /* 给右侧留出更多空间 */
  padding-left: 0 !important; /* 移除左侧内边距 */
}

/* 调整消息内容容器 */
.chat-dialog :deep(.message-content) {
  max-width: 100% !important;
  width: auto !important; /* 允许内容自适应宽度 */
}

/* 确保右侧消息内容靠右对齐 */
.chat-dialog :deep(.message-item-right .message-content) {
  align-items: flex-end;
  margin-right: 8px !important; /* 给头像留出间距 */
}

/* 确保左侧消息内容靠左对齐 */
.chat-dialog :deep(.message-item-left .message-content) {
  align-items: flex-start;
  margin-left: 8px !important; /* 给头像留出间距 */
}

/* 调整消息气泡样式 */
.chat-dialog :deep(.message-text) {
  word-break: break-word;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 12px; /* 调整内边距使文本更紧凑 */
}

/* 右侧消息气泡样式 */
.chat-dialog :deep(.message-item-right .message-text) {
  margin-right: 0 !important;
  background-color: #e6f7ff;
  border-top-right-radius: 0;
  margin-left: auto; /* 确保消息靠右 */
}

/* 左侧消息气泡样式 */
.chat-dialog :deep(.message-item-left .message-text) {
  margin-left: 0 !important;
  background-color: #fff;
  border-top-left-radius: 0;
  margin-right: auto; /* 确保消息靠左 */
}

/* 确保聊天容器布局正确 */
.chat-dialog :deep(.chat-container) {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 0; /* 移除容器内边距 */
}

/* 确保聊天消息容器没有额外内边距 */
.chat-dialog :deep(.chat-messages) {
  padding: 8px !important;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden; /* 防止水平滚动 */
}

/* 调整消息项布局 */
.chat-dialog :deep(.message-item) {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 0 8px; /* 添加水平内边距 */
}

/* 调整头像大小和位置 */
.chat-dialog :deep(.message-avatar) {
  flex-shrink: 0;
  margin: 0 4px; /* 减小头像的外边距 */
}

/* 系统消息样式 */
.system-messages {
  min-height: 400px;
}

.message-item {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.message-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-content {
  margin: 10px 0;
  line-height: 1.5;
  color: #333;
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 