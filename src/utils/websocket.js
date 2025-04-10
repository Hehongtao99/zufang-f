import SockJS from 'sockjs-client'
import Stomp from 'webstomp-client'
import { ElNotification } from 'element-plus'
import router from '@/router'

class WebSocketClient {
  constructor() {
    this.stompClient = null
    this.connected = false
    this.subscriptions = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectTimeout = null
    this.reconnectDelay = 3000 // 初始重连延迟3秒
    this.listeners = new Map()
  }

  /**
   * 连接WebSocket服务器
   */
  connect() {
    if (this.connected || this.connecting) {
      console.log('WebSocket已连接或正在连接中')
      return
    }

    this.connecting = true
    console.log('正在连接WebSocket服务器...')

    try {
      // 创建SockJS实例
      const socket = new SockJS('/api/websocket')
      this.stompClient = Stomp.over(socket)
      
      // 配置stomp客户端
      this.stompClient.debug = import.meta.env.DEV ? 
        (msg) => console.log('STOMP:', msg) : 
        () => {}
      
      // 连接到服务器
      console.log('尝试连接到STOMP服务器...')
      this.stompClient.connect(
        {}, // 连接头信息
        this.onConnected.bind(this), // 连接成功回调
        this.onError.bind(this) // 连接错误回调
      )
    } catch (error) {
      console.error('创建WebSocket连接时发生错误:', error)
      this.connecting = false
      this.onError(error)
    }
  }

  /**
   * 连接成功回调
   */
  onConnected() {
    this.connected = true
    this.connecting = false
    this.reconnectAttempts = 0
    console.log('WebSocket连接成功')

    // 清除重连定时器
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    // 重新订阅之前的主题
    for (const [destination, callback] of this.subscriptions.entries()) {
      this.subscribe(destination, callback)
    }

    // 触发连接成功事件
    this.notifyListeners('connected')
  }

  /**
   * 连接错误回调
   */
  onError(error) {
    console.error('WebSocket连接失败:', error)
    this.connected = false
    this.connecting = false
    this.stompClient = null

    // 触发错误事件
    this.notifyListeners('error', error)

    // 尝试重连
    this.reconnect()
  }

  /**
   * 尝试重新连接
   */
  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`WebSocket重连失败，已达到最大重试次数(${this.maxReconnectAttempts})`)
      return
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts)
    console.log(`${delay}ms后尝试重新连接WebSocket(${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.stompClient && this.connected) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket已断开连接')
        this.connected = false
        this.subscriptions.clear()
        this.notifyListeners('disconnected')
      })
    }
  }

  /**
   * 订阅主题
   * @param {string} destination 主题路径
   * @param {Function} callback 收到消息的回调函数
   * @returns {Object} 订阅对象
   */
  subscribe(destination, callback) {
    if (!this.connected) {
      console.warn('WebSocket未连接，正在尝试连接...')
      this.connect()
      this.subscriptions.set(destination, callback)
      return null
    }

    console.log(`正在订阅主题: ${destination}`)
    const subscription = this.stompClient.subscribe(destination, message => {
      try {
        const payload = JSON.parse(message.body)
        callback(payload, message)
      } catch (error) {
        console.error('解析消息失败:', error, message.body)
      }
    })

    // 保存订阅信息，用于重连时恢复
    this.subscriptions.set(destination, callback)

    return subscription
  }

  /**
   * 取消订阅
   * @param {string} destination 主题路径
   */
  unsubscribe(destination) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.delete(destination)
      console.log(`已取消订阅主题: ${destination}`)
    }
  }

  /**
   * 发送消息
   * @param {string} destination 目标路径
   * @param {Object} body 消息内容
   */
  send(destination, body) {
    if (!this.connected) {
      console.error('WebSocket未连接，无法发送消息')
      return
    }

    this.stompClient.send(
      destination,
      JSON.stringify(body),
      {}
    )
  }

  /**
   * 添加事件监听器
   * @param {string} event 事件名称：connected, disconnected, error
   * @param {Function} callback 回调函数
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {Function} callback 回调函数
   */
  removeListener(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 通知所有监听器
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data)
        } catch (error) {
          console.error(`执行${event}事件监听器时出错:`, error)
        }
      }
    }
  }

  /**
   * 订阅用户通知
   * @param {number} userId 用户ID
   * @param {Function} callback 收到通知的回调函数
   */
  subscribeToUserNotifications(userId) {
    if (!userId) {
      console.error('订阅用户通知失败: 未提供用户ID')
      return
    }

    console.log(`准备订阅用户(${userId})的通知...`)
    
    // 确保WebSocket已连接
    if (!this.connected) {
      console.log('WebSocket未连接，先连接再订阅...')
      this.connect()
    }
    
    // 正确的订阅路径: /user/{userId}/queue/messages
    const destination = `/user/${userId}/queue/messages`
    console.log(`订阅通知目标: ${destination}`)
    
    // 订阅用户通知
    return this.subscribe(destination, (payload) => {
      console.log(`收到用户(${userId})的通知消息:`, payload)
      this.handleNotification(payload)
    })
  }

  /**
   * 处理通知消息
   * @param {Object} notification 通知消息对象
   */
  handleNotification(notification) {
    console.log('收到通知消息:', notification)

    try {
      // 检查通知对象
      if (!notification || !notification.type) {
        console.warn('收到无效通知:', notification)
        return
      }

      // 根据通知类型处理
      switch (notification.type) {
        case 'APPOINTMENT_NOTIFICATION':
          console.log('处理预约通知')
          this.handleAppointmentNotification(notification)
          break
        case 'APPOINTMENT_STATUS_CHANGE':
          console.log('处理预约状态变更通知')
          this.handleStatusChangeNotification(notification)
          break
        case 'APPOINTMENT_CANCELED':
          console.log('处理预约取消通知')
          this.handleStatusChangeNotification(notification)
          break
        case 'CHAT_MESSAGE':
          console.log('处理聊天消息通知')
          this.handleChatMessageNotification(notification)
          break
        case 'SYSTEM_BROADCAST':
          console.log('处理系统广播消息通知')
          this.handleSystemBroadcastNotification(notification)
          break
        default:
          console.warn('未知通知类型:', notification.type)
          // 对于未知类型，仍然通知监听器
          this.notifyListeners('notification', notification)
      }
    } catch (error) {
      console.error('处理通知消息出错:', error)
    }
  }

  /**
   * 处理预约通知
   */
  handleAppointmentNotification(notification) {
    console.log('处理预约通知，原始数据:', notification);
    
    try {
      // 确保data字段存在
      if (!notification.data) {
        console.warn('预约通知缺少data字段，添加空对象');
        notification.data = {};
      }
      
      // 确保title和content字段存在
      if (!notification.title) {
        notification.title = '预约通知';
      }
      
      if (!notification.content) {
        notification.content = '有新的预约看房请求';
      }
      
      // 确保预约ID可以被访问
      if (notification.referenceId && !notification.data.id && !notification.data.appointmentId) {
        notification.data.id = notification.referenceId;
      }
      
      console.log('处理后的预约通知数据:', notification);
      
      // 通知所有通知事件的监听者
      this.notifyListeners('notification', notification);
      
      return true;
    } catch (error) {
      console.error('处理预约通知出错:', error);
      
      // 尝试发送一个最简单的通知
      try {
        const simpleNotification = {
          type: 'APPOINTMENT_NOTIFICATION',
          title: '预约通知',
          content: '有新的预约请求',
          data: {}
        };
        this.notifyListeners('notification', simpleNotification);
      } catch (e) {
        console.error('发送简化通知也失败:', e);
      }
      
      return false;
    }
  }

  /**
   * 处理状态变更通知
   */
  handleStatusChangeNotification(notification) {
    console.log('处理状态变更通知:', notification);
    
    // 通知所有状态变更事件的监听者
    this.notifyListeners('notification', notification);
    
    // 不再在这里直接弹出ElNotification
    return true;
  }

  /**
   * 处理系统广播消息通知
   * @param {Object} notification 系统消息通知
   */
  handleSystemBroadcastNotification(notification) {
    console.log('处理系统广播消息:', notification);
    
    try {
      // 确保data字段存在
      if (!notification.data) {
        notification.data = {};
      }
      
      // 通知所有系统消息事件的监听者
      this.notifyListeners('system', notification);
      
      // 发送系统通知
      ElNotification({
        title: notification.title || '系统通知',
        message: notification.content || '您有一条新的系统通知',
        type: 'info',
        duration: 5000,
        onClick: () => {
          // 跳转到消息中心
          const userRole = localStorage.getItem('userRole');
          if (userRole === 'ADMIN') {
            router.push('/admin/notifications');
          } else if (userRole === 'LANDLORD') {
            router.push('/landlord/message');
          } else {
            router.push('/user/message?tab=system');
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('处理系统广播消息出错:', error);
      return false;
    }
  }

  /**
   * 处理聊天消息通知
   * @param {Object} notification 聊天消息通知
   */
  handleChatMessageNotification(notification) {
    console.log('处理聊天消息:', notification);
    
    try {
      // 确保data字段存在
      if (!notification.data) {
        notification.data = {};
      }
      
      // 通知所有聊天消息事件的监听者
      this.notifyListeners('chat', notification);
      
      // 发送系统通知
      const userName = notification.data.senderName || '用户';
      ElNotification({
        title: '收到新消息',
        message: `${userName}: ${notification.content}`,
        type: 'info',
        duration: 5000,
        onClick: () => {
          // 如果有房源ID和发送者ID，可以跳转到相应的聊天页面
          const houseId = notification.referenceId;
          const senderId = notification.senderId;
          if (houseId && senderId) {
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'LANDLORD') {
              router.push(`/landlord/message?houseId=${houseId}&userId=${senderId}`);
            } else {
              router.push(`/user/message?houseId=${houseId}&landlordId=${senderId}`);
            }
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('处理聊天消息出错:', error);
      return false;
    }
  }

  /**
   * 订阅用户的聊天消息
   * @param {number} userId 用户ID
   */
  subscribeToChatMessages(userId) {
    if (!userId) {
      console.error('订阅聊天消息失败: 未提供用户ID');
      return;
    }
    
    console.log(`准备订阅用户(${userId})的聊天消息...`);
    
    // 确保WebSocket已连接
    if (!this.connected) {
      console.log('WebSocket未连接，先连接再订阅...');
      this.connect();
    }
    
    // 正确的订阅路径: /user/{userId}/queue/chat
    const destination = `/user/${userId}/queue/chat`;
    console.log(`订阅聊天消息目标: ${destination}`);
    
    // 订阅聊天消息
    return this.subscribe(destination, (payload) => {
      console.log(`收到用户(${userId})的聊天消息:`, payload);
      this.handleChatMessageNotification(payload);
    });
  }
}

// 创建单例
const websocketClient = new WebSocketClient()

export default websocketClient 