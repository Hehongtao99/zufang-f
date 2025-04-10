<template>
  <div class="message-list">
    <el-table :data="messages" v-loading="loading" empty-text="暂无消息">
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
      <el-table-column prop="createTime" label="时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createTime) }}
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="10"
        :total="total"
        @current-change="handlePageChange"
        layout="total, prev, pager, next"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { formatDate } from '@/utils/format'

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  total: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['page-change'])

const currentPage = ref(1)

watch(() => props.messages, () => {
  // 当消息列表更新时，重置分页
  currentPage.value = 1
})

const handlePageChange = (page) => {
  emit('page-change', page)
}
</script>

<style scoped>
.message-list {
  margin-top: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style> 