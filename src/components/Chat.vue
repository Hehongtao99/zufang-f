<template>
  <div class="chat-container" :class="{ 'compact-mode': props.compact }">
    <div class="chat-header">
      <span>{{ title }}</span>
      <el-button type="link" @click="close" class="close-btn">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    
    <div 
      class="chat-messages" 
      ref="messagesContainer"
      v-loading="loading"
    >
      <div v-if="messages.length === 0 && !loading" class="no-messages">
        <el-empty description="暂无消息" />
      </div>
      
      <div 
        v-for="(message, index) in messages" 
        :key="index" 
        :class="['message-item', message.senderId === currentUserId ? 'message-item-right' : 'message-item-left']"
      >
        <div class="message-avatar">
          <el-avatar :size="36" :src="messageDisplayAvatar(message.senderId)">
            {{ messageDisplayName(message.senderId).substring(0, 1) }}
          </el-avatar>
        </div>
        <div class="message-content">
          <div class="message-info">
            <span class="message-sender">{{ messageDisplayName(message.senderId) }}</span>
            <span class="message-time">{{ formatTime(message.createTime) }}</span>
          </div>
          <div class="message-text">{{ message.content }}</div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <el-input
        v-model="messageText"
        placeholder="请输入消息"
        :disabled="sending"
        @keyup.enter="sendMessage"
        maxlength="500"
        show-word-limit
      >
        <template #append>
          <el-button 
            type="primary" 
            @click="sendMessage" 
            :loading="sending"
            :disabled="!messageText.trim()"
          >
            发送
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { sendChatMessage, getChatHistory, markConversationAsRead } from '@/api/chat';
import websocketClient from '@/utils/websocket';
import { getUserInfo } from '@/api/user';

// 属性定义
const props = defineProps({
  houseId: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  landlordId: {
    type: Number,
    required: true
  },
  houseName: {
    type: String,
    default: '房源咨询'
  },
  currentUserName: {
    type: String,
    default: ''
  },
  otherUserName: {
    type: String,
    default: '对方'
  },
  currentUserAvatar: {
    type: String,
    default: ''
  },
  otherUserAvatar: {
    type: String,
    default: ''
  },
  compact: {
    type: Boolean,
    default: false
  }
});

// 事件
const emit = defineEmits(['close', 'message-sent']);

// 本地状态
const messages = ref([]);
const messageText = ref('');
const loading = ref(false);
const sending = ref(false);
const messagesContainer = ref(null);

// 当前用户ID
const currentUserId = parseInt(localStorage.getItem('userId'));
const currentUserRole = localStorage.getItem('userRole');

// 计算聊天标题
const title = computed(() => {
  return props.houseName;
});

// 添加这些新的 refs 用于用户信息
const localCurrentUserName = ref(props.currentUserName);
const localCurrentUserAvatar = ref(props.currentUserAvatar);

// 监听新消息
const chatListener = (message) => {
  if (message.type === 'CHAT_MESSAGE' &&
      message.referenceId === props.houseId &&
      ((message.senderId === props.userId && message.receiverId === props.landlordId) ||
       (message.senderId === props.landlordId && message.receiverId === props.userId))) {
    // 如果是当前聊天的消息，添加到消息列表
    const newMessage = {
      id: message.data?.messageId || Date.now(),
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      createTime: message.timestamp,
      isRead: true
    };
    
    messages.value.push(newMessage);
    scrollToBottom();
    
    // 标记为已读
    if (message.senderId !== currentUserId) {
      markAsRead();
    }
  }
};

// 加载聊天历史
const loadChatHistory = async () => {
  loading.value = true;
  
  try {
    const params = {
      userId: props.userId,
      landlordId: props.landlordId,
      houseId: props.houseId
    };
    
    const res = await getChatHistory(params);
    if (res && res.code === 200) {
      messages.value = res.data || [];
      scrollToBottom();
    } else {
      throw new Error(res?.message || '加载聊天历史失败');
    }
  } catch (error) {
    console.error('加载聊天历史失败:', error);
    ElMessage.error('加载聊天历史失败');
  } finally {
    loading.value = false;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!messageText.value.trim()) {
    return;
  }
  
  sending.value = true;
  
  try {
    // 确定发送者和接收者
    const senderId = currentUserId;
    const receiverId = currentUserRole === 'LANDLORD' ? props.userId : props.landlordId;
    
    const data = {
      senderId,
      receiverId,
      houseId: props.houseId,
      content: messageText.value.trim()
    };
    
    // 保存要发送的消息内容
    const messageContent = messageText.value.trim();
    
    // 先添加消息到本地列表以实现实时显示
    const localMessage = {
      id: Date.now(),
      senderId,
      receiverId, 
      content: messageContent,
      createTime: new Date().toISOString(),
      isRead: true
    };
    
    // 添加到消息列表
    messages.value.push(localMessage);
    
    // 清空输入框
    messageText.value = '';
    
    // 滚动到底部
    scrollToBottom();
    
    // 然后发送到服务器
    const res = await sendChatMessage(data);
    
    if (res && res.code === 200) {
      // 通知父组件消息已发送
      emit('message-sent', res.data);
      
      // 如果服务器返回了消息ID，更新本地消息
      if (res.data && res.data.id) {
        const messageIndex = messages.value.findIndex(msg => msg.id === localMessage.id);
        if (messageIndex !== -1) {
          messages.value[messageIndex].id = res.data.id;
        }
      }
    } else {
      // 如果发送失败，标记消息为发送失败状态
      const messageIndex = messages.value.findIndex(msg => msg.id === localMessage.id);
      if (messageIndex !== -1) {
        messages.value[messageIndex].sendFailed = true;
      }
      throw new Error(res?.message || '发送消息失败');
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error('发送消息失败');
  } finally {
    sending.value = false;
  }
};

// 标记消息为已读
const markAsRead = async () => {
  try {
    const receiverId = currentUserId;
    const senderId = currentUserRole === 'LANDLORD' ? props.userId : props.landlordId;
    
    await markConversationAsRead({
      receiverId,
      senderId,
      houseId: props.houseId
    });
  } catch (error) {
    console.error('标记消息为已读失败:', error);
  }
};

// 关闭聊天
const close = () => {
  emit('close');
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  
  // 同一天显示时分
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 今年显示月日时分
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 其他显示年月日时分
  return date.toLocaleDateString('zh-CN') + ' ' + 
         date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// 添加函数来获取当前用户信息
const fetchCurrentUserInfo = async () => {
  try {
    const res = await getUserInfo(currentUserId);
    if (res && res.code === 200) {
      localCurrentUserName.value = res.data.nickname || res.data.username;
      localCurrentUserAvatar.value = res.data.avatar;
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

// 更新消息显示的计算属性
const messageDisplayName = computed(() => (senderId) => {
  if (senderId === currentUserId) {
    return localCurrentUserName.value || props.currentUserName || '我';
  }
  return props.otherUserName;
});

const messageDisplayAvatar = computed(() => (senderId) => {
  if (senderId === currentUserId) {
    return localCurrentUserAvatar.value || props.currentUserAvatar;
  }
  return props.otherUserAvatar;
});

// 组件挂载
onMounted(() => {
  // 添加这一行来获取用户信息
  if (!props.currentUserName || !props.currentUserAvatar) {
    fetchCurrentUserInfo();
  }
  
  // 加载聊天历史
  loadChatHistory();
  
  // 添加聊天消息监听
  websocketClient.addListener('chat', chatListener);
});

// 组件卸载
onUnmounted(() => {
  // 移除聊天消息监听
  websocketClient.removeListener('chat', chatListener);
});

// 监听消息列表变化，滚动到底部
watch(messages, () => {
  scrollToBottom();
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  width: 100%; /* 确保聊天容器占满可用宽度 */
}

/* 紧凑模式样式 */
.compact-mode {
  max-height: 400px;
  width: 100%;
}

.compact-mode .chat-header {
  padding: 5px 10px;
}

.compact-mode .chat-messages {
  max-height: 320px;
  padding: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.compact-mode .chat-input {
  padding: 5px;
}

.compact-mode .message-item {
  margin-bottom: 8px;
}

.compact-mode .message-text {
  padding: 6px 10px;
}

/* 添加自定义滚动条样式 */
.compact-mode .chat-messages::-webkit-scrollbar {
  width: 5px;
}

.compact-mode .chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.compact-mode .chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.compact-mode .chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-weight: bold;
}

.close-btn {
  padding: 2px;
}

.chat-messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #f9f9f9;
  width: 100%;
  box-sizing: border-box;
}

.no-messages {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.message-item {
  display: flex;
  margin-bottom: 15px;
  width: 100%;
  box-sizing: border-box;
}

.message-item-left {
  justify-content: flex-start;
  margin-left: 0;
  padding-right: 20%; /* 给右侧留出空间 */
}

.message-item-right {
  justify-content: flex-end;
  flex-direction: row-reverse;
  margin-right: 0;
  padding-left: 20%; /* 给左侧留出空间 */
}

.message-avatar {
  margin: 0 10px;
  flex-shrink: 0;
}

.message-item-left .message-avatar {
  margin-left: 0;
  margin-right: 8px;
}

.message-item-right .message-avatar {
  margin-left: 8px;
  margin-right: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 100%; /* 确保内容不会溢出 */
}

.message-item-left .message-content {
  align-items: flex-start;
  margin-left: 0;
}

.message-item-right .message-content {
  align-items: flex-end;
  margin-right: 0;
}

.message-info {
  margin-bottom: 5px;
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.message-sender {
  margin-right: 10px;
  font-weight: bold;
}

.message-text {
  padding: 10px 15px;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  word-break: break-word;
  line-height: 1.5;
  max-width: 100%;
}

.message-item-left .message-text {
  border-top-left-radius: 0;
  background-color: #fff;
  padding-left: 12px;
  margin-left: 0;
}

.message-item-right .message-text {
  border-top-right-radius: 0;
  background-color: #fff;
  padding-right: 12px;
  margin-right: 0;
}

.chat-input {
  padding: 10px;
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
}

.compact-mode .message-avatar {
  margin: 0 5px;
}

.compact-mode .message-avatar :deep(.el-avatar) {
  width: 28px;
  height: 28px;
  font-size: 12px;
}

.compact-mode .message-info {
  margin-bottom: 2px;
  font-size: 11px;
}

.compact-mode .message-text {
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.3;
}

.compact-mode .message-item {
  margin-bottom: 8px;
}

.compact-mode .message-item-right {
  margin-right: 0;
}

.compact-mode .message-item-right .message-text {
  max-width: 250px;
  margin-right: 0;
}

.compact-mode .message-item-right .message-avatar {
  margin-left: 0;
  margin-right: 0;
}
</style> 