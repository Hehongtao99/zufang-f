<template>
  <div class="order-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>订单管理</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="订单状态">
          <el-select v-model="queryParams.status" placeholder="请选择订单状态" clearable>
            <el-option label="待支付" value="UNPAID"></el-option>
            <el-option label="已支付" value="PAID"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table
        v-loading="loading"
        :data="orderList"
        style="width: 100%"
        border
      >
        <el-table-column prop="id" label="订单编号" width="100"></el-table-column>
        <el-table-column label="房源信息" min-width="180">
          <template #default="scope">
            <div class="house-info">
              <el-image 
                :src="scope.row.houseImage" 
                fit="cover"
                style="width: 60px; height: 60px; border-radius: 4px;"
              ></el-image>
              <div class="house-detail">
                <div class="house-title">{{ scope.row.houseTitle }}</div>
                <div class="house-address">{{ scope.row.houseAddress }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="租客" width="120">
          <template #default="scope">
            <span>{{ scope.row.userRealName || scope.row.userName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="房东" width="120">
          <template #default="scope">
            <span>{{ scope.row.landlordRealName || scope.row.landlordName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="scope">
            <span class="price">¥ {{ scope.row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180"></el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button
              size="small"
              type="primary"
              link
              @click="handleDetail(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-if="total > 0"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        :page-size="queryParams.pageSize"
        :current-page="queryParams.current"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      >
      </el-pagination>
    </el-card>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="订单详情"
      width="700px"
    >
      <div v-if="orderDetail" class="order-detail">
        <div class="detail-item">
          <span class="label">订单编号：</span>
          <span class="value">{{ orderDetail.id }}</span>
        </div>
        <div class="detail-item">
          <span class="label">房源名称：</span>
          <span class="value">{{ orderDetail.houseTitle }}</span>
        </div>
        <div class="detail-item">
          <span class="label">房源地址：</span>
          <span class="value">{{ orderDetail.houseAddress }}</span>
        </div>
        <div class="detail-item">
          <span class="label">租客姓名：</span>
          <span class="value">{{ orderDetail.userRealName || orderDetail.userName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">租客电话：</span>
          <span class="value">{{ orderDetail.userPhone || '暂无联系方式' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">房东姓名：</span>
          <span class="value">{{ orderDetail.landlordRealName || orderDetail.landlordName }}</span>
        </div>
        <div class="detail-item">
          <span class="label">房东电话：</span>
          <span class="value">{{ orderDetail.landlordPhone || '暂无联系方式' }}</span>
        </div>
        <div class="detail-item">
          <span class="label">租期：</span>
          <span class="value">{{ orderDetail.leaseStartDate }} 至 {{ orderDetail.leaseEndDate }}</span>
        </div>
        <div class="detail-item">
          <span class="label">月租金：</span>
          <span class="value price">¥ {{ orderDetail.monthlyRent }}</span>
        </div>
        <div class="detail-item">
          <span class="label">押金：</span>
          <span class="value price">¥ {{ orderDetail.deposit }}</span>
        </div>
        <div class="detail-item">
          <span class="label">总金额：</span>
          <span class="value price">¥ {{ orderDetail.totalAmount }}</span>
        </div>
        <div class="detail-item">
          <span class="label">创建时间：</span>
          <span class="value">{{ orderDetail.createTime }}</span>
        </div>
        <div class="detail-item">
          <span class="label">订单状态：</span>
          <span class="value">
            <el-tag :type="getStatusType(orderDetail.status)">{{ getStatusText(orderDetail.status) }}</el-tag>
          </span>
        </div>
        <div v-if="orderDetail.payTime" class="detail-item">
          <span class="label">支付时间：</span>
          <span class="value">{{ orderDetail.payTime }}</span>
        </div>
        <div v-if="orderDetail.cancelReason" class="detail-item">
          <span class="label">取消原因：</span>
          <span class="value">{{ orderDetail.cancelReason }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { getOrders, getOrderDetail } from '@/api/order';
import { ElMessage } from 'element-plus';

// 加载状态
const loading = ref(false);
// 订单列表
const orderList = ref([]);
// 总数据量
const total = ref(0);
// 查询参数
const queryParams = reactive({
  current: 1,
  pageSize: 10,
  status: ''
});

// 详情对话框可见性
const detailVisible = ref(false);
// 订单详情
const orderDetail = ref(null);

// 状态选项
const statusOptions = [
  { label: '全部订单', value: '' },
  { label: '待支付', value: 'UNPAID' },
  { label: '已支付', value: 'PAID' },
  { label: '已取消', value: 'CANCELLED' },
  { label: '取消支付', value: 'PAYMENT_CANCELLED' },
  { label: '退款中', value: 'REFUNDING' },
  { label: '已退款', value: 'REFUNDED' },
  { label: '已完成', value: 'COMPLETED' },
];

// 初始加载
onMounted(() => {
  getOrderList();
});

// 获取订单列表
const getOrderList = async () => {
  try {
    loading.value = true;
    const response = await getOrders(queryParams);
    orderList.value = response.data.records;
    total.value = response.data.total;
  } catch (error) {
    ElMessage.error('获取订单列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 查询
const handleQuery = () => {
  queryParams.current = 1;
  getOrderList();
};

// 重置查询
const resetQuery = () => {
  queryParams.status = '';
  handleQuery();
};

// 处理页码变化
const handleCurrentChange = (current) => {
  queryParams.current = current;
  getOrderList();
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  queryParams.pageSize = size;
  queryParams.current = 1;
  getOrderList();
};

// 查看详情
const handleDetail = async (row) => {
  try {
    loading.value = true;
    const response = await getOrderDetail(row.id);
    orderDetail.value = response.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取订单详情失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'UNPAID': return 'warning';
    case 'PAID': return 'success';
    case 'ACTIVE': return 'success';
    case 'CANCELLED': return 'info';
    case 'PAYMENT_CANCELLED': return 'info';
    case 'REFUNDING': return 'warning';
    case 'REFUNDED': return 'info';
    case 'COMPLETED': return 'success';
    case 'TERMINATE_REQUESTED': return 'warning';
    case 'TERMINATE_APPROVED': return 'success';
    case 'TERMINATED': return 'danger';
    case 'TERMINATE_REJECTED': return 'info';
    default: return 'info';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'UNPAID': return '待支付';
    case 'PAID': return '已支付';
    case 'ACTIVE': return '租赁中';
    case 'CANCELLED': return '已取消';
    case 'PAYMENT_CANCELLED': return '取消支付';
    case 'REFUNDING': return '退款中';
    case 'REFUNDED': return '已退款';
    case 'COMPLETED': return '已完成';
    case 'TERMINATE_REQUESTED': return '退租申请中';
    case 'TERMINATE_APPROVED': return '退租已批准';
    case 'TERMINATED': return '已退租';
    case 'TERMINATE_REJECTED': return '退租已拒绝';
    default: return '状态' + status;
  }
};
</script>

<style scoped>
.order-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.house-info {
  display: flex;
  align-items: center;
}

.house-detail {
  margin-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.house-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.house-address {
  font-size: 12px;
  color: #999;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.order-detail {
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 16px;
}

.detail-item {
  line-height: 1.8;
}

.label {
  color: #606266;
  font-weight: bold;
  margin-right: 10px;
  width: 100px;
  display: inline-block;
}
</style> 