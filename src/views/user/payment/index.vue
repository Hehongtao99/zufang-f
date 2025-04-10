<template>
  <div class="payment-container">
    <el-card class="payment-card">
      <template #header>
        <div class="card-header">
          <h2>订单支付</h2>
        </div>
      </template>
      
      <div v-loading="loading" class="payment-content">
        <template v-if="order">
          <div class="order-info">
            <div class="house-info">
              <div class="house-image" v-if="order.houseImage">
                <el-image 
                  :src="order.houseImage" 
                  fit="cover"
                  style="width: 120px; height: 90px; border-radius: 4px;"
                ></el-image>
              </div>
              <div class="house-detail">
                <div class="house-title">{{ order.houseTitle }}</div>
                <div class="house-address">{{ order.houseAddress }}</div>
                <div class="lease-term">租期：{{ order.leaseStartDate }} 至 {{ order.leaseEndDate }}</div>
              </div>
            </div>
            
            <el-divider content-position="center">支付详情</el-divider>
            
            <div class="payment-info">
              <div class="payment-row">
                <span class="label">月租金：</span>
                <span class="value">¥ {{ order.monthlyRent }}/月</span>
              </div>
              <div class="payment-row">
                <span class="label">租期：</span>
                <span class="value">{{ calculateLeaseMonths() }}个月</span>
              </div>
              <div class="payment-row">
                <span class="label">租金总额：</span>
                <span class="value">¥ {{ formatCurrency(order.monthlyRent * calculateLeaseMonths()) }}</span>
              </div>
              <div class="payment-row">
                <span class="label">押金：</span>
                <span class="value">¥ {{ order.deposit }}</span>
              </div>
              <div class="payment-row">
                <span class="label">服务费：</span>
                <span class="value">¥ {{ order.serviceFee || (order.monthlyRent * 0.02).toFixed(2) }}</span>
              </div>
              <div class="payment-row total">
                <span class="label">总金额：</span>
                <span class="value">¥ {{ order.totalAmount }}</span>
              </div>
            </div>
            
            <el-divider content-position="center">选择支付方式</el-divider>
            
            <div class="payment-methods">
              <el-radio-group v-model="paymentMethod">
                <el-radio-button label="WECHAT">
                  <i class="el-icon-money"></i> 微信支付
                </el-radio-button>
                <el-radio-button label="ALIPAY">
                  <i class="el-icon-shopping-cart-full"></i> 支付宝
                </el-radio-button>
                <el-radio-button label="BANK">
                  <i class="el-icon-bank-card"></i> 银行卡
                </el-radio-button>
              </el-radio-group>
            </div>
            
            <div class="payment-qrcode" v-if="paymentMethod">
              <div class="qrcode-title">
                请使用{{ 
                  paymentMethod === 'WECHAT' ? '微信' : 
                  paymentMethod === 'ALIPAY' ? '支付宝' : '银行APP' 
                }}扫描下方二维码完成支付
              </div>
              <div class="qrcode-container">
                <div class="qrcode-image">
                  <el-image
                    :src="getQrCodeImage()"
                    fit="contain"
                    style="width: 200px; height: 200px;"
                  ></el-image>
                </div>
                <div class="qrcode-info">
                  <div class="qrcode-order-info">
                    <div class="order-info-item">
                      <span class="label">订单号：</span>
                      <span class="value">{{ order.orderNo }}</span>
                    </div>
                    <div class="order-info-item">
                      <span class="label">金额：</span>
                      <span class="value price">¥ {{ order.totalAmount }}</span>
                    </div>
                  </div>
                  <div class="qrcode-tips">
                    <p>请在<span class="highlight">{{ formatTime(countdown) }}</span>内完成支付</p>
                    <p>支付完成后，系统将自动处理您的订单</p>
                  </div>
                </div>
              </div>
              <div class="countdown">
                <span class="countdown-label">支付倒计时：</span>
                <span class="countdown-time">{{ formatTime(countdown) }}</span>
              </div>
            </div>
            
            <div class="payment-actions">
              <el-button @click="goBack">取消支付</el-button>
              <el-button type="primary" @click="simulatePayment" :disabled="!paymentMethod">
                模拟支付完成
              </el-button>
            </div>
          </div>
        </template>
        
        <el-empty v-else description="未找到订单信息"></el-empty>
      </div>
    </el-card>
    
    <!-- 支付成功对话框 -->
    <el-dialog
      v-model="paymentSuccessDialogVisible"
      title="支付成功"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="payment-success">
        <div class="success-icon">
          <i class="el-icon-circle-check"></i>
        </div>
        <div class="success-message">
          恭喜您，订单支付成功！
        </div>
        <div class="success-tips">
          我们会尽快处理您的订单，感谢您的信任和支持。
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="goToOrderList">查看我的订单</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { payOrder, cancelPayment } from '@/api/order';

const router = useRoute();
const navigation = useRouter();
const loading = ref(false);
const order = ref(null);
const paymentMethod = ref('');
const countdown = ref(900); // 15分钟倒计时
const countdownTimer = ref(null);
const paymentSuccessDialogVisible = ref(false);

// 获取订单信息
const fetchOrder = async () => {
  const orderId = router.query.orderId;
  if (!orderId) {
    ElMessage.error('订单ID不能为空');
    navigation.push('/user/orders');
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await request.get(`/user/orders/${orderId}`);
    if (response && response.code === 200) {
      order.value = response.data;
      
      // 验证订单状态
      if (order.value.status !== 'UNPAID') {
        ElMessage.warning('当前订单状态不需要支付');
        navigation.push('/user/orders');
      }
    } else {
      ElMessage.error(response?.message || '获取订单失败');
    }
  } catch (err) {
    console.error('获取订单失败:', err);
    ElMessage.error('获取订单失败');
  } finally {
    loading.value = false;
  }
};

// 开始倒计时
const startCountdown = () => {
  countdownTimer.value = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(countdownTimer.value);
      handleTimeoutCancel();
    }
  }, 1000);
};

// 处理超时自动取消
const handleTimeoutCancel = async () => {
  loading.value = true;
  try {
    const response = await cancelPayment(order.value.id, { reason: '支付超时自动取消' });
    if (response && response.code === 200) {
      ElMessage.warning('支付已超时，订单已自动取消');
      navigation.push('/user/orders');
    } else {
      ElMessage.error(response?.message || '取消支付失败');
      navigation.push('/user/orders');
    }
  } catch (err) {
    console.error('自动取消支付失败:', err);
    ElMessage.error('支付已超时，请返回订单列表');
    navigation.push('/user/orders');
  } finally {
    loading.value = false;
  }
};

// 格式化时间
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// 计算租期月数
const calculateLeaseMonths = () => {
  if (!order.value || !order.value.startDate || !order.value.endDate) {
    return 1;
  }
  
  const startDate = new Date(order.value.startDate);
  const endDate = new Date(order.value.endDate);
  
  // 计算月份差
  const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
  
  // 考虑日期差，如果结束日期的日期大于等于开始日期的日期，则增加一个月
  if (endDate.getDate() >= startDate.getDate()) {
    return monthsDiff + 1;
  }
  
  return Math.max(1, monthsDiff);
};

// 格式化货币
const formatCurrency = (value) => {
  if (!value) return '0.00';
  return Number(value).toFixed(2);
};

// 获取支付二维码图片
const getQrCodeImage = () => {
  // 根据支付方式返回不同的二维码图片
  switch(paymentMethod.value) {
    case 'WECHAT':
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(`weixin://wxpay/bizpayurl?pr=${order.value.totalAmount}&orderno=${order.value.orderNo}`);
    case 'ALIPAY':
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(`https://qr.alipay.com/${order.value.orderNo}`);
    case 'BANK':
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(`bank://pay?amount=${order.value.totalAmount}&order=${order.value.orderNo}`);
    default:
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com';
  }
};

// 模拟支付
const simulatePayment = async () => {
  if (!paymentMethod.value) {
    ElMessage.warning('请选择支付方式');
    return;
  }
  
  loading.value = true;
  
  try {
    // 支付数据
    const payData = {
      orderId: order.value.id,
      payMethod: paymentMethod.value
    };
    
    const response = await payOrder(order.value.id, payData);
    
    if (response && response.code === 200) {
      clearInterval(countdownTimer.value);
      paymentSuccessDialogVisible.value = true;
    } else {
      ElMessage.error(response?.message || '支付失败');
    }
  } catch (err) {
    console.error('支付失败:', err);
    ElMessage.error('支付失败，请稍后再试');
  } finally {
    loading.value = false;
  }
};

// 取消支付
const goBack = () => {
  ElMessageBox.confirm(
    '确认取消支付吗？此操作将会取消当前订单',
    '取消支付',
    {
      confirmButtonText: '确认取消',
      cancelButtonText: '继续支付',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true;
    try {
      const response = await cancelPayment(order.value.id, { reason: '用户取消支付' });
      if (response && response.code === 200) {
        ElMessage.success('已取消支付');
        navigation.push('/user/orders');
      } else {
        ElMessage.error(response?.message || '取消支付失败');
      }
    } catch (err) {
      console.error('取消支付失败:', err);
      ElMessage.error('取消支付失败，请稍后再试');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 用户选择继续支付，不做任何操作
  });
};

// 查看订单列表
const goToOrderList = () => {
  navigation.push('/user/orders');
};

onMounted(() => {
  fetchOrder();
  startCountdown();
});

onBeforeUnmount(() => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value);
  }
});
</script>

<style scoped>
.payment-container {
  padding: 20px;
}

.payment-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-content {
  padding: 20px 0;
}

.house-info {
  display: flex;
  margin-bottom: 20px;
}

.house-detail {
  margin-left: 15px;
  flex: 1;
}

.house-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.house-address, .lease-term {
  color: #606266;
  margin-bottom: 5px;
}

.payment-info {
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  margin-bottom: 20px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.payment-row.total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #dcdfe6;
}

.payment-row .label {
  color: #606266;
}

.payment-row .value {
  font-weight: bold;
}

.payment-row.total .value {
  color: #f56c6c;
  font-size: 20px;
}

.payment-methods {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.payment-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 30px 0;
}

.qrcode-title {
  margin-bottom: 15px;
  color: #606266;
}

.qrcode-container {
  display: flex;
  align-items: center;
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.qrcode-image {
  margin-right: 25px;
  background-color: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
}

.qrcode-info {
  flex: 1;
}

.qrcode-order-info {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #dcdfe6;
}

.order-info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-info-item .label {
  color: #606266;
}

.order-info-item .value {
  font-weight: bold;
}

.order-info-item .value.price {
  color: #f56c6c;
  font-size: 18px;
}

.qrcode-tips {
  color: #606266;
  line-height: 1.8;
}

.qrcode-tips .highlight {
  color: #f56c6c;
  font-weight: bold;
  padding: 0 3px;
}

.countdown {
  margin-top: 15px;
  text-align: center;
}

.countdown-label {
  color: #606266;
}

.countdown-time {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
  padding: 0 5px;
}

.payment-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.payment-success {
  text-align: center;
  padding: 20px;
}

.success-icon {
  font-size: 60px;
  color: #67c23a;
  margin-bottom: 20px;
}

.success-message {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.success-tips {
  color: #606266;
}
</style> 