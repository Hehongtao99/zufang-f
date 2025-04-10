<template>
  <div class="contract-sign-container">
    <el-card class="contract-card" v-loading="loading">
      <template #header v-if="contract">
        <div class="card-header">
          <h2>合同签署</h2>
          <div class="status-tag">
            <el-tag :type="contract.status === 'PENDING' ? 'warning' : 'success'">
              {{ contract.status === 'PENDING' ? '待签署' : '已签署' }}
            </el-tag>
            <span v-if="contract.status === 'SIGNED'" class="sign-date">
              签署日期: {{ formatDateTime(contract.signDate) }}
            </span>
          </div>
        </div>
      </template>
      <template #header v-else>
        <div class="card-header">
          <h2>合同签署</h2>
        </div>
      </template>
      
      <div class="contract-content">
        <template v-if="contract">
          <div class="contract-info">
            <div class="info-item">
              <span class="label">合同编号：</span>
              <span>{{ contract.contractNo }}</span>
            </div>
            <div class="info-item">
              <span class="label">房源名称：</span>
              <span>{{ contract.houseTitle }}</span>
            </div>
            <div class="info-item">
              <span class="label">租期：</span>
              <span>{{ formatDate(contract.startDate) }} 至 {{ formatDate(contract.endDate) }}</span>
            </div>
          </div>
          
          <el-divider content-position="center">合同内容</el-divider>
          
          <div class="contract-document">
            <div v-html="contract.filledContent"></div>
          </div>
          
          <el-divider content-position="center">合同签署</el-divider>
          
          <div class="signature-area">
            <div class="signature-box landlord">
              <div class="signature-label">甲方（房东）签名</div>
              <div class="signature" v-if="contract.partyASignature">
                <img :src="contract.partyASignature" alt="甲方签名" class="signature-image" />
                <div class="sign-date-info">
                  <span>签署日期: {{ formatDate(contract.createTime) }}</span>
                </div>
              </div>
              <div class="no-signature" v-else>
                <span class="auto-signed">房东已在创建合同时预先签署</span>
              </div>
            </div>
            
            <div class="signature-box tenant">
              <div class="signature-label">乙方（租客）签名</div>
              <div class="signature" v-if="contract.partyBSignature">
                <img :src="contract.partyBSignature" alt="乙方签名" class="signature-image" />
                <div class="sign-date-info">
                  <span>签署日期: {{ formatDate(contract.signDate) }}</span>
                </div>
              </div>
              <div class="signature-pad-container" v-else>
                <div ref="signaturePadContainer" class="signature-pad"></div>
                <div class="signature-actions">
                  <el-button size="small" @click="clearSignature">清除</el-button>
                  <el-button size="small" type="primary" @click="saveSignature" :disabled="!canSign">确认签名</el-button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="contract-actions">
            <el-button type="primary" @click="submitSign" :disabled="!canSign || !signatureData">
              提交签署
            </el-button>
            <el-button @click="goToPayment" :disabled="contract.status !== 'SIGNED'">
              前往支付
            </el-button>
          </div>
          
          <!-- 支付信息部分 -->
          <div class="payment-section" v-if="showPaymentInfo">
            <el-divider content-position="center">支付信息</el-divider>
            
            <div class="payment-info">
              <div class="payment-header">
                <h3>请支付房屋租赁订金</h3>
                <div class="payment-amount">¥ {{ contract.totalAmount }}</div>
              </div>
              
              <div class="payment-methods">
                <div class="method-title">请选择支付方式：</div>
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
                        <span class="label">合同编号：</span>
                        <span class="value">{{ contract.contractNo }}</span>
                      </div>
                      <div class="order-info-item">
                        <span class="label">金额：</span>
                        <span class="value price">¥ {{ contract.totalAmount }}</span>
                      </div>
                    </div>
                    <div class="qrcode-tips">
                      <p>请在<span class="highlight">15分钟</span>内完成支付</p>
                      <p>支付完成后，系统将自动处理您的订单</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="payment-actions">
                <el-button @click="goToPayment">去订单页面支付</el-button>
                <el-button type="primary" @click="simulatePayment" :disabled="!paymentMethod">
                  模拟支付完成
                </el-button>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <el-empty description="正在加载合同信息，请稍候...">
            <template #image>
              <el-icon :size="60"><Loading /></el-icon>
            </template>
          </el-empty>
        </template>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import SignaturePad from 'signature_pad';
import { Loading } from '@element-plus/icons-vue';

const router = useRoute();
const navigation = useRouter();
const loading = ref(false);
const contract = ref(null);
const signaturePad = ref(null);
const signaturePadContainer = ref(null);
const signatureData = ref('');
const showPaymentInfo = ref(false);
const paymentMethod = ref('');

// 检查是否可以签名
const canSign = computed(() => {
  return contract.value && contract.value.status === 'PENDING';
});

// 获取合同信息
const fetchContract = async () => {
  const orderId = router.query.orderId;
  if (!orderId) {
    ElMessage.error('订单ID不能为空');
    navigation.push('/user/orders');
    return;
  }
  
  loading.value = true;
  
  try {
    // 先获取订单的合同ID
    const orderResponse = await request.get(`/user/orders/${orderId}`);
    if (orderResponse && orderResponse.code === 200 && orderResponse.data.contractId) {
      // 获取合同详情
      const contractResponse = await request.get(`/user/contracts/${orderResponse.data.contractId}`);
      if (contractResponse && contractResponse.code === 200) {
        contract.value = contractResponse.data;
        console.log('获取到合同信息:', contract.value);
      } else {
        ElMessage.error(contractResponse?.message || '获取合同失败');
      }
    } else {
      // 订单可能还没有关联的合同，尝试请求生成合同
      console.log('开始创建合同...');
      try {
        const createContractResponse = await request.post(`/user/contracts/create/${orderId}`);
        if (createContractResponse && createContractResponse.code === 200) {
          const contractId = createContractResponse.data;
          console.log('合同创建成功，ID:', contractId);
          
          // 获取新创建的合同详情
          const contractResponse = await request.get(`/user/contracts/${contractId}`);
          if (contractResponse && contractResponse.code === 200) {
            contract.value = contractResponse.data;
            console.log('获取新创建的合同成功:', contract.value);
          } else {
            ElMessage.error('获取新创建的合同失败');
          }
        } else {
          ElMessage.error(createContractResponse?.message || '创建合同失败');
        }
      } catch (err) {
        console.error('合同创建失败:', err);
        ElMessage.error('该订单尚未生成合同，请稍后再试');
      }
    }
  } catch (err) {
    console.error('获取合同信息失败:', err);
    ElMessage.error('获取合同信息失败');
  } finally {
    loading.value = false;
    if (contract.value) {
      setTimeout(() => {
        initSignaturePad();
      }, 100);
    }
  }
};

// 监听contract变化，确保在合同加载后初始化签名板
watch(contract, (newValue) => {
  if (newValue) {
    // 检查合同是否已签署但未支付
    if (newValue.status === 'SIGNED' && !newValue.isPaid) {
      showPaymentInfo.value = true;
    }
    
    setTimeout(() => {
      initSignaturePad();
    }, 100);
  }
});

// 初始化签名板
const initSignaturePad = () => {
  if (!signaturePadContainer.value) return;
  
  // 等下一个渲染周期，确保DOM已更新
  setTimeout(() => {
    const canvas = document.createElement('canvas');
    canvas.width = signaturePadContainer.value.offsetWidth;
    canvas.height = 200;
    signaturePadContainer.value.innerHTML = '';
    signaturePadContainer.value.appendChild(canvas);
    
    signaturePad.value = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)'
    });
  }, 100);
};

// 清除签名
const clearSignature = () => {
  if (signaturePad.value) {
    signaturePad.value.clear();
    signatureData.value = '';
  }
};

// 保存签名
const saveSignature = () => {
  if (signaturePad.value && !signaturePad.value.isEmpty()) {
    signatureData.value = signaturePad.value.toDataURL();
    ElMessage.success('签名已保存');
  } else {
    ElMessage.warning('请先进行签名');
  }
};

// 提交签署
const submitSign = async () => {
  if (!signatureData.value) {
    ElMessage.warning('请先进行签名');
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await request.post('/user/contracts/sign', {
      contractId: contract.value.id,
      signature: signatureData.value
    });
    
    if (response && response.code === 200) {
      ElMessage.success('合同签署成功，请继续进行支付');
      // 更新合同状态，避免重新请求API
      contract.value.status = 'SIGNED';
      contract.value.partyBSignature = signatureData.value;
      contract.value.signDate = new Date().toISOString();
      // 保存签名数据，以便显示
      localStorage.setItem(`contract_signature_${contract.value.id}`, signatureData.value);
    } else {
      // 检查是否需要完善个人资料的错误消息
      if (response?.message && response.message.includes('完善个人资料')) {
        ElMessageBox.confirm(
          '签署合同需要完善真实姓名和身份证号，是否前往个人资料页面？',
          '提示',
          {
            confirmButtonText: '前往完善',
            cancelButtonText: '取消',
            type: 'warning',
          }
        ).then(() => {
          // 导航到个人资料页面
          navigation.push('/user/profile');
        }).catch(() => {
          // 用户取消，不做操作
        });
      } else {
        ElMessage.error(response?.message || '签署失败');
      }
    }
  } catch (err) {
    console.error('签署合同失败:', err);
    // 检查错误响应中是否包含需要完善个人资料的提示
    if (err.response?.data?.message && err.response.data.message.includes('完善个人资料')) {
      ElMessageBox.confirm(
        '签署合同需要完善真实姓名和身份证号，是否前往个人资料页面？',
        '提示',
        {
          confirmButtonText: '前往完善',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        // 导航到个人资料页面
        navigation.push('/user/profile');
      }).catch(() => {
        // 用户取消，不做操作
      });
    } else {
      ElMessage.error('签署合同失败');
    }
  } finally {
    loading.value = false;
  }
};

// 前往支付
const goToPayment = () => {
  if (contract.value && contract.value.orderId) {
    navigation.push({
      path: '/user/payment',
      query: { orderId: contract.value.orderId }
    });
  } else {
    ElMessage.warning('无法获取订单信息，请刷新页面重试');
  }
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取支付二维码图片
const getQrCodeImage = () => {
  if (!contract.value || !contract.value.orderId) return '';
  
  // 根据支付方式返回不同的二维码图片
  switch(paymentMethod.value) {
    case 'WECHAT':
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(`weixin://wxpay/bizpayurl?pr=${contract.value.totalAmount}&contractno=${contract.value.contractNo}`);
    case 'ALIPAY':
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(`https://qr.alipay.com/${contract.value.contractNo}`);
    case 'BANK':
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(`bank://pay?amount=${contract.value.totalAmount}&contract=${contract.value.contractNo}`);
    default:
      return 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com';
  }
};

// 模拟支付完成
const simulatePayment = async () => {
  if (!paymentMethod.value) {
    ElMessage.warning('请选择支付方式');
    return;
  }
  
  if (!contract.value || !contract.value.orderId) {
    ElMessage.error('无法获取订单信息，请刷新页面重试');
    return;
  }
  
  loading.value = true;
  
  try {
    const payData = {
      orderId: contract.value.orderId,
      payMethod: paymentMethod.value
    };
    
    const response = await request.post(`/user/orders/${contract.value.orderId}/pay`, payData);
    
    if (response && response.code === 200) {
      ElMessage.success('支付成功！');
      // 更新合同状态
      contract.value.isPaid = true;
      showPaymentInfo.value = false;
      
      // 延迟跳转到订单列表
      setTimeout(() => {
        navigation.push('/user/orders');
      }, 2000);
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

onMounted(() => {
  fetchContract();
});
</script>

<style scoped>
.contract-sign-container {
  padding: 20px;
}

.contract-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contract-content {
  padding: 10px 0;
}

.contract-info {
  margin-bottom: 20px;
  background-color: #f8f8f8;
  padding: 15px;
  border-radius: 4px;
}

.info-item {
  margin-bottom: 10px;
  display: flex;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  font-weight: bold;
  width: 100px;
}

.contract-document {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ebeef5;
  background-color: #fff;
  max-height: 400px;
  overflow-y: auto;
}

.contract-document > div {
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

.contract-document h1, 
.contract-document h2, 
.contract-document h3, 
.contract-document h4 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.contract-document p {
  margin-bottom: 1em;
}

.contract-document ul, 
.contract-document ol {
  padding-left: 20px;
  margin-bottom: 1em;
}

.contract-document table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.contract-document th,
.contract-document td {
  border: 1px solid #dcdfe6;
  padding: 8px;
  text-align: left;
}

.signature-area {
  display: flex;
  justify-content: space-between;
  margin: 20px 0;
}

.signature-box {
  width: 48%;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.signature-label {
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
}

.signature {
  text-align: center;
}

.signature-image {
  max-width: 100%;
  max-height: 150px;
}

.no-signature {
  color: #909399;
  text-align: center;
  padding: 30px 0;
}

.auto-signed {
  color: #67C23A;
  font-weight: bold;
}

.signature-pad-container {
  margin-top: 10px;
}

.signature-pad {
  width: 100%;
  height: 200px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  margin-bottom: 10px;
}

.signature-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.contract-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sign-date {
  font-size: 14px;
  color: #409EFF;
}

.sign-date-info {
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}

.payment-section {
  margin-top: 30px;
}

.payment-info {
  background-color: #f8f8f8;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.payment-header h3 {
  margin: 0;
  color: #303133;
}

.payment-amount {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.payment-methods {
  margin: 20px 0;
}

.method-title {
  margin-bottom: 10px;
  color: #606266;
}

.payment-qrcode {
  margin: 20px 0;
}

.qrcode-title {
  margin-bottom: 15px;
  color: #606266;
  text-align: center;
}

.qrcode-container {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
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

.payment-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
</style> 