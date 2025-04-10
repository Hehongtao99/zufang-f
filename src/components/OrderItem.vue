<template>
  <div class="order-item">
    <div class="order-header">
      <div class="order-no">订单编号：{{ order.orderNo }}</div>
      <div class="order-status" :class="statusClass">{{ statusText }}</div>
    </div>
    <div class="order-body">
      <div class="house-info">
        <img v-if="order.houseImage" :src="order.houseImage" class="house-image" :class="{ 'deleted-house': order.isHouseDeleted }" alt="房源图片" />
        <div v-else class="no-image">暂无图片</div>
        <div class="house-detail" :class="{ 'deleted-house-info': order.isHouseDeleted }">
          <div class="house-title">
            {{ order.houseTitle || '未知房源' }}
            <span v-if="order.isHouseDeleted" class="deleted-badge">已删除</span>
          </div>
          <div class="house-address">{{ order.houseAddress || '地址信息未提供' }}</div>
          <div class="lease-period">租期：{{ formatDate(order.startDate) }} 至 {{ formatDate(order.endDate) }}</div>
        </div>
      </div>
      <div class="price-info">
        <div class="price-item">
          <div class="label">月租金：</div>
          <div class="value">¥ {{ order.monthlyRent }}/月</div>
        </div>
        <div class="price-item">
          <div class="label">租期：</div>
          <div class="value">{{ calculateLeaseMonths() }}个月</div>
        </div>
        <div class="price-item">
          <div class="label">押金：</div>
          <div class="value">¥ {{ order.deposit }}</div>
        </div>
        <div class="price-item">
          <div class="label">总金额：</div>
          <div class="value total">¥ {{ order.totalAmount }}</div>
        </div>
      </div>
    </div>
    <div class="order-footer">
      <div class="order-time">下单时间：{{ formatDateTime(order.createTime) }}</div>
      <div class="order-actions">
        <el-button size="small" type="primary" @click="viewDetail" plain>查看详情</el-button>
        <el-button size="small" type="primary" @click="viewContract" plain v-if="order.contractId && order.status === 'PAID'">查看合同</el-button>
        <el-button size="small" type="success" @click="pay" v-if="order.status === 'UNPAID'">支付</el-button>
        <el-button size="small" type="danger" @click="cancelOrder" v-if="order.status === 'UNPAID'">取消订单</el-button>
        <div v-if="order.status === 'CANCELLED'" class="cancel-reason">
          取消原因：{{ order.cancelReason || '用户主动取消' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import request from '@/utils/request';

const props = defineProps({
  order: {
    type: Object,
    required: true
  }
});

const router = useRouter();

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未设置';
  return new Date(date).toLocaleDateString('zh-CN');
};

// 格式化日期时间
const formatDateTime = (datetime) => {
  if (!datetime) return '未知时间';
  const date = new Date(datetime);
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
};

// 订单状态文本映射
const statusText = computed(() => {
  const statusMap = {
    'UNPAID': '待支付',
    'PAID': '已支付',
    'CANCELLED': '已取消',
    'PAYMENT_CANCELLED': '取消支付',
    'REFUNDING': '退款中',
    'REFUNDED': '已退款',
    'COMPLETED': '已完成'
  };
  return statusMap[props.order.status] || '未知状态';
});

// 订单状态样式类
const statusClass = computed(() => {
  return {
    'status-unpaid': props.order.status === 'UNPAID',
    'status-paid': props.order.status === 'PAID',
    'status-cancelled': props.order.status === 'CANCELLED',
    'status-payment-cancelled': props.order.status === 'PAYMENT_CANCELLED',
    'status-refunding': props.order.status === 'REFUNDING',
    'status-refunded': props.order.status === 'REFUNDED',
    'status-completed': props.order.status === 'COMPLETED'
  };
});

// 计算租期月数
const calculateLeaseMonths = () => {
  if (!props.order || !props.order.startDate || !props.order.endDate) {
    return 1;
  }
  
  const startDate = new Date(props.order.startDate);
  const endDate = new Date(props.order.endDate);
  
  // 计算月份差
  const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
  
  // 考虑日期差，如果结束日期的日期大于等于开始日期的日期，则增加一个月
  if (endDate.getDate() >= startDate.getDate()) {
    return monthsDiff + 1;
  }
  
  return Math.max(1, monthsDiff);
};

// 查看详情
const viewDetail = () => {
  // 如果房源已删除，提示用户
  if (props.order.isHouseDeleted) {
    ElMessage.info('该房源已被删除，无法查看详情');
    return;
  }
  router.push(`/user/orders/${props.order.id}`);
};

// 支付
const pay = () => {
  router.push(`/user/payment?orderId=${props.order.id}`);
};

// 查看合同
const viewContract = () => {
  router.push(`/user/contract/sign?orderId=${props.order.id}`);
};

// 取消订单
const cancelOrder = async () => {
  try {
    const confirmed = await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    if (confirmed) {
      const reason = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '如不想租了、找到其他房源等'
      });
      
      const res = await request.post(`/user/orders/${props.order.id}/cancel?reason=${encodeURIComponent(reason.value)}`);
      if (res && res.code === 200) {
        ElMessage.success('订单已取消');
        // 通知父组件刷新订单列表
        emits('refresh');
      } else {
        ElMessage.error(res?.message || '取消失败');
      }
    }
  } catch (error) {
    console.error('取消订单失败', error);
    if (error !== 'cancel' && error?.message !== 'cancel') {
      ElMessage.error('取消订单失败');
    }
  }
};

const emits = defineEmits(['refresh']);
</script>

<style scoped>
.order-item {
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  margin-bottom: 16px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #e6e6e6;
  background-color: #f7f7f7;
}

.order-no {
  font-weight: bold;
  color: #666;
}

.order-status {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-unpaid {
  color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.1);
}

.status-paid {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.1);
}

.status-cancelled {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

.status-payment-cancelled {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

.status-refunding, .status-refunded {
  color: #909399;
  background-color: rgba(144, 147, 153, 0.1);
}

.status-completed {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

.order-body {
  padding: 16px;
  display: flex;
  justify-content: space-between;
}

.house-info {
  display: flex;
  flex: 3;
}

.house-image {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
}

.no-image {
  width: 120px;
  height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #999;
}

.house-detail {
  margin-left: 16px;
  flex: 1;
}

.house-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
}

.house-address {
  color: #666;
  margin-bottom: 8px;
  font-size: 14px;
}

.lease-period {
  color: #666;
  font-size: 14px;
}

.price-info {
  flex: 1;
  text-align: right;
}

.price-item {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.label {
  color: #666;
}

.value {
  margin-left: 8px;
  font-weight: bold;
}

.value.total {
  color: #f56c6c;
  font-size: 18px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #e6e6e6;
  background-color: #f7f7f7;
}

.order-time {
  color: #666;
  font-size: 14px;
}

.order-actions {
  display: flex;
  align-items: center;
}

.order-actions .el-button {
  margin-left: 8px;
}

.cancel-reason {
  margin-left: 10px;
  color: #f56c6c;
  font-size: 14px;
}

.deleted-house {
  opacity: 0.5;
}

.deleted-house-info {
  opacity: 0.5;
}

.deleted-badge {
  background-color: #f56c6c;
  color: #fff;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}
</style> 