<template>
  <div class="order-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>我的订单</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="订单状态">
          <el-select 
            v-model="queryParams.status" 
            placeholder="请选择订单状态" 
            clearable
            size="large"
            style="width: 180px;"
          >
            <el-option label="待支付" value="UNPAID"></el-option>
            <el-option label="已支付" value="PAID"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
            <el-option label="已退租" value="TERMINATED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery" size="large">查询</el-button>
          <el-button @click="resetQuery" size="large">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="全部订单" name="ALL"></el-tab-pane>
        <el-tab-pane label="待支付" name="UNPAID"></el-tab-pane>
        <el-tab-pane label="已支付" name="PAID"></el-tab-pane>
        <el-tab-pane label="已取消" name="CANCELLED"></el-tab-pane>
        <el-tab-pane label="已完成" name="COMPLETED"></el-tab-pane>
        <el-tab-pane label="已退租" name="TERMINATED"></el-tab-pane>
      </el-tabs>
      
      <div v-if="orderList.length === 0 && !loading" class="empty-data">
        <el-empty description="暂无订单数据"></el-empty>
      </div>
      
      <div v-else class="order-list" v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.8)">
        <div v-for="order in orderList" :key="order.id" class="order-item">
          <el-card shadow="never">
            <div class="order-header">
              <img 
                v-if="order.houseImage" 
                :src="order.houseImage" 
                class="house-image" 
                :class="{ 'deleted-house': order.isHouseDeleted }"
                alt="房源图片" 
              />
              <div v-else class="no-image">暂无图片</div>
              <div class="order-info" :class="{ 'deleted-house-info': order.isHouseDeleted }">
                <div class="house-title">
                  {{ order.houseTitle }}
                  <span v-if="order.isHouseDeleted" class="deleted-badge">已删除</span>
                </div>
                <div class="house-address">{{ order.houseAddress }}</div>
                <div class="price">¥ {{ order.monthlyRent }} / 月</div>
                <div class="order-status">
                  状态：<el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
                </div>
              </div>
            </div>
            
            <div class="order-content">
              <div class="house-info">
                <div class="lease-term">租期：{{ order.leaseStartDate ? formatDate(order.leaseStartDate) : '未设置' }} 至 {{ order.leaseEndDate ? formatDate(order.leaseEndDate) : '未设置' }}</div>
              </div>
              
              <div class="order-price">
                <div class="price-item">
                  <span class="label">月租金：</span>
                  <span class="price">¥ {{ order.monthlyRent }}</span>
                </div>
                <div class="price-item">
                  <span class="label">押金：</span>
                  <span class="price">¥ {{ order.deposit }}</span>
                </div>
                <div class="price-item">
                  <span class="label">总金额：</span>
                  <span class="total-price">¥ {{ order.totalAmount }}</span>
                </div>
              </div>
            </div>
            
            <div class="order-footer">
              <div class="order-time">
                下单时间：{{ order.createTime }}
                <span v-if="order.status === 'ACTIVE' && order.terminateRejectReason" class="reject-reason">
                  (退租申请被拒绝：{{ order.terminateRejectReason }})
                </span>
              </div>
              <div class="order-actions">
                <el-button
                  v-if="order.status === 'UNPAID'"
                  size="small"
                  type="primary"
                  @click="handlePay(order)"
                >
                  立即支付
                </el-button>
                <el-button
                  v-if="order.status === 'UNPAID'"
                  size="small"
                  type="danger"
                  @click="handleCancel(order)"
                >
                  取消订单
                </el-button>
                <el-button
                  v-if="order.status === 'TERMINATE_REQUESTED' && !order.isPenaltyPaid && order.penaltyAmount > 0"
                  size="small"
                  type="warning"
                  @click="handlePayPenalty(order)"
                >
                  支付违约金
                </el-button>
                <el-button
                  size="small"
                  type="info"
                  @click="handleDetail(order)"
                >
                  查看详情
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </div>
      
      <el-pagination
        v-if="total > 0"
        :page-sizes="[5, 10, 20, 30]"
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
          <span class="value">
            {{ orderDetail.houseTitle }}
            <span v-if="orderDetail.isHouseDeleted" class="deleted-badge">已删除</span>
          </span>
        </div>
        <div class="detail-item">
          <span class="label">房源地址：</span>
          <span class="value">{{ orderDetail.houseAddress }}</span>
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
          <span class="value">{{ orderDetail.leaseStartDate ? formatDate(orderDetail.leaseStartDate) : '未设置' }} 至 {{ orderDetail.leaseEndDate ? formatDate(orderDetail.leaseEndDate) : '未设置' }}</span>
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
        <div v-if="orderDetail.terminateReason" class="detail-item">
          <span class="label">退租原因：</span>
          <span class="value">{{ orderDetail.terminateReason }}</span>
        </div>
        <div v-if="orderDetail.terminateRejectReason" class="detail-item">
          <span class="label">退租拒绝原因：</span>
          <span class="value">{{ orderDetail.terminateRejectReason }}</span>
        </div>
        <div v-if="orderDetail.penaltyAmount" class="detail-item">
          <span class="label">违约金：</span>
          <span class="value price">¥ {{ orderDetail.penaltyAmount }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 支付对话框 -->
    <el-dialog
      v-model="payVisible"
      title="订单支付"
      width="500px"
    >
      <div v-if="currentOrder" class="pay-dialog">
        <div class="pay-amount">
          <div class="amount-label">支付金额</div>
          <div class="amount-value">¥ {{ currentOrder.totalAmount }}</div>
        </div>
        
        <div class="pay-method">
          <div class="method-label">支付方式</div>
          <div class="method-options">
            <el-radio-group v-model="payMethod">
              <el-radio label="WECHAT">
                <i class="iconfont icon-wechat-pay"></i>
                微信支付
              </el-radio>
              <el-radio label="ALIPAY">
                <i class="iconfont icon-alipay"></i>
                支付宝
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        
        <div class="pay-qrcode" v-if="payMethod">
          <el-image
            src="https://demo-1312071495.cos.ap-guangzhou.myqcloud.com/demo/qrcode.png"
            fit="contain"
            style="width: 200px; height: 200px;"
          ></el-image>
          <div class="qrcode-tip">请使用{{ payMethod === 'WECHAT' ? '微信' : '支付宝' }}扫码完成支付</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="payVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPay">确认已支付</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 取消订单对话框 -->
    <el-dialog
      v-model="cancelVisible"
      title="取消订单"
      width="500px"
    >
      <div class="cancel-dialog">
        <el-form :model="cancelForm" label-width="80px">
          <el-form-item label="取消原因" required>
            <el-select v-model="cancelForm.reason" placeholder="请选择取消原因" style="width: 100%">
              <el-option label="房源不符合预期" value="房源不符合预期"></el-option>
              <el-option label="找到更合适的房源" value="找到更合适的房源"></el-option>
              <el-option label="价格原因" value="价格原因"></el-option>
              <el-option label="计划有变" value="计划有变"></el-option>
              <el-option label="其他原因" value="其他原因"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="补充说明" v-if="cancelForm.reason === '其他原因'">
            <el-input
              v-model="cancelForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入取消原因"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!cancelForm.reason" @click="submitCancel">确认取消订单</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 支付违约金对话框 -->
    <el-dialog
      v-model="penaltyPayVisible"
      title="支付违约金"
      width="500px"
    >
      <div v-if="currentOrder" class="pay-dialog">
        <div class="pay-amount">
          <div class="amount-label">违约金金额</div>
          <div class="amount-value">¥ {{ currentOrder.penaltyAmount }}</div>
        </div>
        
        <div class="pay-method">
          <div class="method-label">支付方式</div>
          <div class="method-options">
            <el-radio-group v-model="payMethod">
              <el-radio label="WECHAT">
                <i class="iconfont icon-wechat-pay"></i>
                微信支付
              </el-radio>
              <el-radio label="ALIPAY">
                <i class="iconfont icon-alipay"></i>
                支付宝
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        
        <div class="pay-qrcode" v-if="payMethod">
          <el-image
            src="https://demo-1312071495.cos.ap-guangzhou.myqcloud.com/demo/qrcode.png"
            fit="contain"
            style="width: 200px; height: 200px;"
          ></el-image>
          <div class="qrcode-tip">请使用{{ payMethod === 'WECHAT' ? '微信' : '支付宝' }}扫码完成支付</div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="penaltyPayVisible = false">取消</el-button>
          <el-button type="primary" @click="submitPayPenalty">确认已支付</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { getUserOrders, getUserOrderDetail, payOrder, cancelOrder, payPenalty } from '@/api/order';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';

// 激活的标签页
const activeTab = ref('ALL');
// 加载状态
const loading = ref(false);
// 订单列表
const orderList = ref([]);
// 总数据量
const total = ref(0);
// 查询参数
const queryParams = reactive({
  current: 1,
  pageSize: 5,
  status: ''
});

// 详情对话框可见性
const detailVisible = ref(false);
// 订单详情
const orderDetail = ref(null);

// 支付对话框可见性
const payVisible = ref(false);
// 当前操作的订单
const currentOrder = ref(null);
// 支付方式
const payMethod = ref('WECHAT');

// 取消订单对话框可见性
const cancelVisible = ref(false);
// 取消订单表单
const cancelForm = reactive({
  reason: '',
  remark: ''
});

// 违约金支付对话框可见性
const penaltyPayVisible = ref(false);

const router = useRouter();

// 初始加载
onMounted(() => {
  getOrderList();
});

// 获取订单列表
const getOrderList = async () => {
  try {
    loading.value = true;
    const response = await getUserOrders(queryParams);
    orderList.value = response.data.records;
    total.value = response.data.total;
  } catch (error) {
    ElMessage.error('获取订单列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 处理标签页点击
const handleTabClick = (tab) => {
  loading.value = true;
  queryParams.status = tab.props.name === 'ALL' ? '' : tab.props.name;
  queryParams.current = 1;
  getOrderList();
};

// 查询
const handleQuery = () => {
  loading.value = true;
  queryParams.current = 1;
  getOrderList();
};

// 重置查询
const resetQuery = () => {
  loading.value = true;
  queryParams.status = activeTab.value === 'ALL' ? '' : activeTab.value;
  handleQuery();
};

// 处理页码变化
const handleCurrentChange = (current) => {
  loading.value = true;
  queryParams.current = current;
  getOrderList();
};

// 处理每页条数变化
const handleSizeChange = (size) => {
  loading.value = true;
  queryParams.pageSize = size;
  queryParams.current = 1;
  getOrderList();
};

// 查看详情
const handleDetail = async (order) => {
  try {
    loading.value = true;
    const response = await getUserOrderDetail(order.id);
    orderDetail.value = response.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('获取订单详情失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 处理支付
const handlePay = (order) => {
  currentOrder.value = order;
  payVisible.value = true;
};

// 提交支付
const submitPay = async () => {
  if (!payMethod.value) {
    ElMessage.warning('请选择支付方式');
    return;
  }
  
  try {
    loading.value = true;
    
    // 支付数据
    const payData = {
      payMethod: payMethod.value,
      amount: currentOrder.value.totalAmount
    };
    
    const response = await payOrder(currentOrder.value.id, payData);
    
    if (response.code === 200) {
      ElMessage.success('支付成功');
      payVisible.value = false;
      // 刷新订单列表
      getOrderList();
    }
  } catch (error) {
    ElMessage.error('支付失败，请稍后再试');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 处理取消订单
const handleCancel = (order) => {
  currentOrder.value = order;
  cancelForm.reason = '';
  cancelForm.remark = '';
  cancelVisible.value = true;
};

// 提交取消订单
const submitCancel = async () => {
  if (!cancelForm.reason) {
    ElMessage.warning('请选择取消原因');
    return;
  }
  
  loading.value = true;
  try {
    // 根据是否选择"其他原因"决定使用哪个reason值
    const reason = cancelForm.reason === '其他原因' && cancelForm.remark
      ? cancelForm.remark
      : cancelForm.reason;
    
    // 确保使用对象传递参数，方便后端用@RequestBody接收
    const response = await cancelOrder(currentOrder.value.id, { reason });
    
    if (response.code === 200) {
      ElMessage.success('订单已取消');
      cancelVisible.value = false;
      // 刷新订单列表
      getOrderList();
    } else {
      ElMessage.error(response.message || '取消订单失败');
    }
  } catch (error) {
    ElMessage.error('取消订单失败，请稍后再试');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'UNPAID':
      return 'warning'
    case 'PAID':
      return 'success'
    case 'ACTIVE':
      return 'success'
    case 'CANCELLED':
      return 'info'
    case 'PAYMENT_CANCELLED':
      return 'info'
    case 'REFUNDING':
      return 'warning'
    case 'REFUNDED':
      return 'info'
    case 'COMPLETED':
      return 'success'
    case 'TERMINATE_REQUESTED':
      return 'warning'
    case 'TERMINATE_APPROVED':
      return 'success'
    case 'TERMINATED':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'UNPAID':
      return '待支付'
    case 'PAID':
      return '已支付'
    case 'ACTIVE':
      return '租赁中'
    case 'CANCELLED':
      return '已取消'
    case 'PAYMENT_CANCELLED':
      return '已取消支付'
    case 'REFUNDING':
      return '退款中'
    case 'REFUNDED':
      return '已退款'
    case 'COMPLETED':
      return '已完成'
    case 'TERMINATE_REQUESTED':
      return '退租申请中'
    case 'TERMINATE_APPROVED':
      return '退租已批准'
    case 'TERMINATED':
      return '已退租'
    default:
      return '未知状态'
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未设置';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 处理违约金支付
const handlePayPenalty = (order) => {
  currentOrder.value = order
  payMethod.value = ''
  penaltyPayVisible.value = true
}

// 提交违约金支付
const submitPayPenalty = async () => {
  if (!payMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }
  
  try {
    const response = await payPenalty(currentOrder.value.id, {
      payMethod: payMethod.value
    })
    
    if (response && response.code === 200) {
      ElMessage.success('违约金支付成功')
      penaltyPayVisible.value = false
      handleQuery() // 刷新列表
    } else {
      ElMessage.error(response?.message || '违约金支付失败')
    }
  } catch (err) {
    console.error('违约金支付失败:', err)
    ElMessage.error('违约金支付失败')
  }
}

// 查看房源详情
const viewHouseDetail = (id) => {
  // 如果房源已删除，则提示用户
  if (currentOrder.value && currentOrder.value.isHouseDeleted) {
    ElMessage.info('该房源已被删除，无法查看详情');
    return;
  }
  router.push(`/user/house/detail/${id}`);
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

.demo-form-inline {
  margin: 10px 0 20px 0;
}

.demo-form-inline :deep(.el-form-item__label) {
  font-size: 16px;
  font-weight: 500;
}

.demo-form-inline :deep(.el-select) {
  font-weight: 500;
}

.demo-form-inline :deep(.el-select .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6;
}

.demo-form-inline :deep(.el-select:hover .el-input__wrapper) {
  box-shadow: 0 0 0 1px #409eff;
}

.empty-data {
  margin: 40px 0;
}

.order-list {
  margin-top: 20px;
}

.order-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.order-header {
  background-color: #f5f7fa;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
}

.order-content {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed #ebeef5;
}

.house-info {
  display: flex;
  flex: 1;
}

.house-detail {
  margin-left: 15px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.house-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
}

.house-address, .lease-term {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.order-price {
  min-width: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
}

.price-item {
  margin-bottom: 8px;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.total-price {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.order-footer {
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-time {
  color: #909399;
  font-size: 14px;
}

.reject-reason {
  color: #f56c6c;
  margin-left: 8px;
  font-size: 13px;
}

.order-actions {
  display: flex;
  gap: 10px;
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

.pay-dialog {
  text-align: center;
}

.pay-amount {
  margin-bottom: 20px;
}

.amount-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.amount-value {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.pay-method {
  margin-bottom: 20px;
  text-align: left;
}

.method-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.method-options {
  margin-left: 20px;
}

.pay-qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}

.qrcode-tip {
  margin-top: 10px;
  color: #606266;
}

.cancel-dialog {
  padding: 20px 0;
}

.house-image {
  width: 120px;
  height: 90px;
  border-radius: 4px;
  object-fit: cover;
}

.no-image {
  width: 120px;
  height: 90px;
  border-radius: 4px;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
}

.deleted-house {
  filter: grayscale(100%);
}

.deleted-house-info {
  color: #909399;
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