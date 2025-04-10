<template>
  <div class="order-list-container">
    <el-card class="order-list-card">
      <template #header>
        <div class="card-header">
          <h2>订单管理</h2>
          <div class="header-actions">
            <el-select v-model="statusFilter" placeholder="订单状态" clearable @change="fetchOrders">
              <el-option label="全部" value=""></el-option>
              <el-option label="待支付" value="UNPAID"></el-option>
              <el-option label="已支付" value="PAID"></el-option>
              <el-option label="已取消" value="CANCELLED"></el-option>
              <el-option label="已完成" value="COMPLETED"></el-option>
            </el-select>
            <el-button type="primary" @click="fetchOrders">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </div>
        </div>
      </template>
      
      <div class="order-table" v-loading="loading">
        <el-table :data="orders" border stripe style="width: 100%">
          <el-table-column prop="orderNo" label="订单编号"></el-table-column>
          <el-table-column label="房源信息">
            <template #default="scope">
              <div class="house-info">
                <el-image 
                  v-if="scope.row.houseImage" 
                  :src="scope.row.houseImage" 
                  fit="cover" 
                  style="width: 80px; height: 60px; border-radius: 4px;"
                ></el-image>
                <div v-else class="no-image">暂无图片</div>
                <div class="house-details">
                  <div class="house-title">{{ scope.row.houseTitle || '未知房源' }}</div>
                  <div class="house-address">{{ scope.row.houseAddress || '地址未提供' }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="租期">
            <template #default="scope">
              {{ formatDate(scope.row.startDate) }} 至 {{ formatDate(scope.row.endDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalAmount" label="订单金额">
            <template #default="scope">
              <span class="price">¥ {{ scope.row.totalAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间">
            <template #default="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="订单状态">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
              <div v-if="scope.row.status === 'CANCELLED'" class="cancel-reason">
                取消原因: {{ scope.row.cancelReason || '用户主动取消' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button type="primary" size="small" @click="viewOrderDetail(scope.row.id)">查看详情</el-button>
              <el-button 
                v-if="scope.row.contractId && scope.row.status === 'PAID'" 
                type="success" 
                size="small" 
                @click="viewContract(scope.row.contractId)"
              >查看合同</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:currentPage="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :background="true"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const router = useRouter();
const orders = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const statusFilter = ref('');

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    };
    
    if (statusFilter.value) {
      params.status = statusFilter.value;
    }
    
    const res = await request.get('/landlord/orders', { params });
    if (res.code === 200) {
      orders.value = res.data.records || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取订单列表失败');
    }
  } catch (error) {
    console.error('获取订单列表失败', error);
    ElMessage.error('获取订单列表失败');
  } finally {
    loading.value = false;
  }
};

// 重置筛选条件
const resetFilter = () => {
  statusFilter.value = '';
  currentPage.value = 1;
  fetchOrders();
};

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchOrders();
};

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchOrders();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未设置';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN');
};

// 格式化日期时间
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '未知时间';
  const date = new Date(dateTimeString);
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'UNPAID': '待支付',
    'PAID': '已支付',
    'ACTIVE': '租赁中',
    'CANCELLED': '已取消',
    'PAYMENT_CANCELLED': '取消支付',
    'REFUNDING': '退款中',
    'REFUNDED': '已退款',
    'COMPLETED': '已完成',
    'TERMINATE_REQUESTED': '退租申请中',
    'TERMINATE_APPROVED': '退租已批准',
    'TERMINATED': '已退租'
  };
  return statusMap[status] || '状态' + status;
};

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    'UNPAID': 'warning',
    'PAID': 'success',
    'ACTIVE': 'success',
    'CANCELLED': 'info',
    'PAYMENT_CANCELLED': 'info',
    'REFUNDING': 'warning',
    'REFUNDED': 'info',
    'COMPLETED': 'success',
    'TERMINATE_REQUESTED': 'warning',
    'TERMINATE_APPROVED': 'success',
    'TERMINATED': 'danger'
  };
  return typeMap[status] || 'info';
};

// 查看订单详情
const viewOrderDetail = (id) => {
  router.push(`/landlord/orders/${id}`);
};

// 查看合同
const viewContract = (contractId) => {
  router.push(`/landlord/contracts/${contractId}`);
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.order-list-container {
  padding: 20px;
}

.order-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.house-info {
  display: flex;
  align-items: center;
}

.no-image {
  width: 80px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #909399;
  font-size: 12px;
}

.house-details {
  margin-left: 10px;
}

.house-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.house-address {
  font-size: 12px;
  color: #909399;
}

.price {
  color: #ff6b6b;
  font-weight: bold;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.cancel-reason {
  margin-top: 5px;
  font-size: 12px;
  color: #f56c6c;
}
</style> 