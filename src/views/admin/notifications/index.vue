<template>
  <div class="notification-manager">
    <el-card class="send-form">
      <template #header>
        <div class="card-header">
          <span>发送系统通知</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入通知内容"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="sending" @click="handleSubmit">发送通知</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="history-list">
      <template #header>
        <div class="card-header">
          <span>通知历史</span>
        </div>
      </template>
      <el-table :data="notifications" v-loading="loading">
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column prop="createTime" label="发送时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
          layout="total, prev, pager, next"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

export default {
  name: 'NotificationManager',
  setup() {
    const formRef = ref(null)
    const form = ref({
      receiverType: 'ALL',
      title: '',
      content: ''
    })

    const rules = {
      title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
      content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }]
    }

    const notifications = ref([])
    const loading = ref(false)
    const sending = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    const getReceiverTypeLabel = (type) => {
      const map = {
        ALL: '所有用户',
        USER: '租客',
        LANDLORD: '房东'
      }
      return map[type] || type
    }

    const formatDateTime = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    }

    const loadNotifications = async () => {
      loading.value = true
      try {
        const res = await request.get('/api/messages/system', {
          params: {
            pageNum: currentPage.value,
            pageSize: pageSize.value
          }
        })
        if (res.code === 200) {
          notifications.value = res.data.records
          total.value = res.data.total
        }
      } catch (error) {
        ElMessage.error('获取通知列表失败')
      } finally {
        loading.value = false
      }
    }

    const handlePageChange = () => {
      loadNotifications()
    }

    const handleSubmit = async () => {
      if (!formRef.value) return
      
      await formRef.value.validate(async (valid) => {
        if (valid) {
          sending.value = true
          try {
            const res = await request.post('/api/messages/broadcast', form.value)
            if (res.code === 200) {
              ElMessage.success('发送成功')
              form.value.title = ''
              form.value.content = ''
              currentPage.value = 1
              await loadNotifications()
            }
          } catch (error) {
            ElMessage.error('发送失败')
          } finally {
            sending.value = false
          }
        }
      })
    }

    onMounted(() => {
      loadNotifications()
    })

    return {
      formRef,
      form,
      rules,
      notifications,
      loading,
      sending,
      currentPage,
      pageSize,
      total,
      getReceiverTypeLabel,
      formatDateTime,
      handlePageChange,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.notification-manager {
  padding: 20px;
}

.send-form {
  margin-bottom: 20px;
}

.history-list {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 