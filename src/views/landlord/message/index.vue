<template>
  <div class="message-container">
    <h1>消息中心</h1>
    <el-card class="message-card">
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
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
                  <el-avatar :size="40" :src="chat.userAvatar">{{ chat.userName.substring(0, 1) }}</el-avatar>
                  <div class="chat-item-info">
                    <div class="chat-item-name">{{ chat.userName }}</div>
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
          <div class="message-list">
            <el-empty v-if="systemMessages.length === 0" description="暂无系统通知" />
            <div v-else>
              <div v-for="(msg, index) in systemMessages" :key="msg.id" class="message-item">
                <div class="message-header">
                  <h3 class="message-title">{{ msg.title }}</h3>
                  <span class="message-time">{{ formatTime(msg.createTime) }}</span>
                </div>
                <div class="message-content">{{ msg.content }}</div>
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
      :title="`与 ${currentChat?.userName || '用户'} 的对话`" 
      width="400px"
      :destroy-on-close="false"
      :before-close="closeChatDialog"
      class="preview-chat-dialog" 
    >
      <Chat 
        v-if="chatDialogVisible && currentChat"
        :houseId="currentChat.houseId" 
        :userId="currentChat.userId"
        :landlordId="Number(landlordId)"
        :houseName="currentChat.houseName"
        :currentUserName="landlordName"
        :otherUserName="currentChat.userName"
        :currentUserAvatar="landlordAvatar"
        :otherUserAvatar="currentChat.userAvatar"
        :compact="true" 
        @close="closeChatDialog" 
        @message-sent="handleMessageSent" 
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import Chat from '@/components/Chat.vue';
import { getChatSessions } from '@/api/chat';
import { getUserSystemMessages } from '@/api/message';
import websocketClient from '@/utils/websocket';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();

const activeTab = ref('chat');

// 当前房东信息
const landlordId = localStorage.getItem('userId');
const landlordName = localStorage.getItem('nickname') || localStorage.getItem('username') || '房东';
const landlordAvatar = localStorage.getItem('avatar') || '';

// 聊天会话列表
const chatSessions = ref([]);

// 聊天对话框相关状态
const chatDialogVisible = ref(false);
const currentChat = ref(null);

// 系统通知相关
const systemMessages = ref([]);

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
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
    const res = await getChatSessions();
    if (res && res.code === 200) {
      chatSessions.value = res.data || [];
    }
  } catch (error) {
    console.error('加载聊天会话失败:', error);
    ElMessage.error('加载聊天会话失败');
  }
};

// 打开聊天会话
const openChatSession = (chat) => {
  currentChat.value = chat;
  chatDialogVisible.value = true;
};

// 关闭聊天对话框
const closeChatDialog = () => {
  chatDialogVisible.value = false;
};

// 处理消息发送
const handleMessageSent = (message) => {
  console.log('对话消息已发送:', message);
  loadChatSessions(); // 重新加载会话列表以更新最新消息
};

// 加载系统通知
const loadSystemMessages = async () => {
  try {
    const res = await getUserSystemMessages({
      userId: landlordId
    });
    
    if (res && res.code === 200) {
      systemMessages.value = res.data.records || [];
    } else {
      console.error('获取系统通知失败:', res?.message);
      ElMessage.error('获取系统通知失败');
    }
  } catch (error) {
    console.error('加载系统通知失败:', error);
    ElMessage.error('加载系统通知失败');
  }
};

// 处理标签页切换
const handleTabClick = (tab) => {
  if (tab.props.name === 'system') {
    loadSystemMessages();
  }
};

onMounted(() => {
  // 加载聊天会话
  loadChatSessions();
  
  // 添加聊天消息监听
  websocketClient.addListener('chat', (message) => {
    console.log('收到聊天消息:', message);
    if (message.type === 'CHAT_MESSAGE' && message.receiverId === Number(landlordId)) {
      loadChatSessions(); // 收到新消息时重新加载会话列表
    }
  });
  
  // 添加系统消息监听
  websocketClient.addListener('system', (message) => {
    console.log('收到系统消息:', message);
    if (activeTab.value === 'system') {
      loadSystemMessages();
    }
  });
  
  // 如果URL中有指定的用户ID和房源ID，自动打开聊天窗口
  const { userId, houseId } = route.query;
  if (userId && houseId) {
    activeTab.value = 'chat';
  }
  
  // 如果初始标签页是系统通知，则加载系统通知
  if (activeTab.value === 'system') {
    loadSystemMessages();
  }
});

onUnmounted(() => {
  // 移除消息监听
  websocketClient.removeListener('chat');
  websocketClient.removeListener('system');
});
</script>

<style scoped>
.message-container {
  padding: 20px;
}

.message-card {
  margin-bottom: 20px;
}

.message-list {
  margin-top: 20px;
}

.message-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.message-item:last-child {
  border-bottom: none;
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
  display: flex;
  align-items: center;
  gap: 10px;
}

.message-time {
  color: #999;
  font-size: 14px;
}

.message-content {
  color: #666;
  line-height: 1.5;
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
}

.unread-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}

.preview-chat-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 400px;
  overflow: hidden;
}
</style> 