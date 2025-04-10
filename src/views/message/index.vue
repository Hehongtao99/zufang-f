<template>
  <div class="message-center">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="系统通知" name="system">
        <message-list
          :messages="systemMessages"
          :loading="systemLoading"
          :total="systemTotal"
          @page-change="handleSystemPageChange"
          @read="handleMarkAsRead"
        />
      </el-tab-pane>
      <el-tab-pane label="订单消息" name="order">
        <message-list
          :messages="orderMessages"
          :loading="orderLoading"
          :total="orderTotal"
          @page-change="handleOrderPageChange"
          @read="handleMarkAsRead"
        />
      </el-tab-pane>
      <el-tab-pane label="预约消息" name="appointment">
        <message-list
          :messages="appointmentMessages"
          :loading="appointmentLoading"
          :total="appointmentTotal"
          @page-change="handleAppointmentPageChange"
          @read="handleMarkAsRead"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MessageList from './components/MessageList.vue'
import { getUserSystemMessages, markMessageAsRead } from '@/api/message'
import { ElMessage } from 'element-plus'

const activeTab = ref('system')

// 系统消息相关
const systemMessages = ref([])
const systemLoading = ref(false)
const systemTotal = ref(0)
const systemPage = ref(1)
const systemPageSize = ref(10)

// 订单消息相关
const orderMessages = ref([])
const orderLoading = ref(false)
const orderTotal = ref(0)
const orderPage = ref(1)
const orderPageSize = ref(10)

// 预约消息相关
const appointmentMessages = ref([])
const appointmentLoading = ref(false)
const appointmentTotal = ref(0)
const appointmentPage = ref(1)
const appointmentPageSize = ref(10)

// 加载系统消息
const loadSystemMessages = async () => {
  systemLoading.value = true
  try {
    const res = await getUserSystemMessages({
      pageNum: systemPage.value,
      pageSize: systemPageSize.value
    })
    systemMessages.value = res.data.records
    systemTotal.value = res.data.total
  } catch (error) {
    ElMessage.error('获取系统消息失败')
  } finally {
    systemLoading.value = false
  }
}

// 加载订单消息
const loadOrderMessages = async () => {
  // 实现订单消息加载逻辑
}

// 加载预约消息
const loadAppointmentMessages = async () => {
  // 实现预约消息加载逻辑
}

// 处理分页变化
const handleSystemPageChange = (page) => {
  systemPage.value = page
  loadSystemMessages()
}

const handleOrderPageChange = (page) => {
  orderPage.value = page
  loadOrderMessages()
}

const handleAppointmentPageChange = (page) => {
  appointmentPage.value = page
  loadAppointmentMessages()
}

// 标记消息为已读
const handleMarkAsRead = async (messageId) => {
  try {
    await markMessageAsRead(messageId)
    ElMessage.success('已标记为已读')
    // 重新加载当前标签页的消息
    if (activeTab.value === 'system') {
      loadSystemMessages()
    } else if (activeTab.value === 'order') {
      loadOrderMessages()
    } else if (activeTab.value === 'appointment') {
      loadAppointmentMessages()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadSystemMessages()
  loadOrderMessages()
  loadAppointmentMessages()
})
</script>

<style scoped>
.message-center {
  padding: 20px;
}
</style> 