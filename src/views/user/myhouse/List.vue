<template>
  <div class="myhouse-page">
    <el-card class="myhouse-card">
      <template #header>
        <div class="card-header">
          <h2>我的订房</h2>
        </div>
      </template>
      
      <el-alert
        v-if="error"
        title="获取数据失败"
        type="error"
        description="连接服务器时发生错误，请稍后再试"
        closable
        show-icon
      />
      
      <div v-loading="loading">
        <div v-if="houseList.length === 0 && !loading" class="empty-result">
          <el-empty description="您还没有租赁的房源" />
          <div class="empty-action">
            <el-button type="primary" @click="goToHouseList">去找房</el-button>
          </div>
        </div>
        
        <el-table v-else :data="houseList" style="width: 100%">
          <el-table-column label="房源信息" min-width="350">
            <template #default="scope">
              <div class="house-info-cell">
                <el-image 
                  :src="scope.row.coverImage" 
                  fit="cover"
                  class="house-cover"
                  @click="scope.row.isHouseDeleted ? null : viewHouseDetail(scope.row.id)"
                  :class="{ 'deleted-house': scope.row.isHouseDeleted }"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><picture-failed /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="house-info" :class="{ 'deleted-house-info': scope.row.isHouseDeleted }">
                  <h3 class="house-title" @click="viewHouseDetail(scope.row.id)">
                    {{ scope.row.title }}
                    <span v-if="scope.row.isHouseDeleted" class="deleted-badge">已删除</span>
                  </h3>
                  <div class="house-attrs">
                    <el-tag size="small">{{ scope.row.rentType === 'WHOLE' ? '整租' : '合租' }}</el-tag>
                    <el-tag size="small" type="info">{{ scope.row.bedroomCount || '-' }}室{{ scope.row.livingRoomCount || '-' }}厅</el-tag>
                    <el-tag size="small" type="success">{{ (scope.row.area && scope.row.area > 0) ? scope.row.area : (scope.row.houseArea && scope.row.houseArea > 0 ? scope.row.houseArea : (scope.row.realArea ? scope.row.realArea : '未知')) + (scope.row.area > 0 || scope.row.houseArea > 0 || scope.row.realArea ? '㎡' : '') }}</el-tag>
                  </div>
                  <div class="house-location">
                    <el-icon><location /></el-icon>
                    <span>{{ scope.row.city }}{{ scope.row.district }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="price" label="月租金" width="120">
            <template #default="scope">
              <span class="price">¥{{ scope.row.price }}/月</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="orderStatus" label="状态" width="120">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.orderStatus || 'ACTIVE')" effect="plain">
                {{ getStatusText(scope.row.orderStatus || 'ACTIVE') }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="leaseStartDate" label="租赁开始时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.leaseStartDate || scope.row.createTime) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="leaseEndDate" label="租赁结束时间" width="180">
            <template #default="scope">
              {{ formatDate(scope.row.leaseEndDate) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <div v-if="scope.row.isHouseDeleted">
                <el-tag type="danger" size="small">房源已删除</el-tag>
              </div>
              <div v-else>
                <el-button type="primary" link @click="viewHouseDetail(scope.row.id)">查看详情</el-button>
                <el-button 
                  v-if="scope.row.orderStatus === 'PENDING_PAYMENT' || scope.row.orderStatus === 'PENDING'" 
                  type="success" 
                  link 
                  @click="handlePayOrder(scope.row)"
                >去支付</el-button>
                <el-button 
                  v-if="scope.row.orderStatus === 'ACTIVE' || scope.row.orderStatus === 'PAID'" 
                  type="danger" 
                  link 
                  @click="openTerminateDialog(scope.row)"
                >申请退租</el-button>
                <el-button 
                  v-if="scope.row.orderStatus === 'TERMINATE_APPROVED' && scope.row.penaltyAmount > 0 && !scope.row.isPenaltyPaid" 
                  type="warning" 
                  link 
                  @click="handlePayPenalty(scope.row)"
                >支付违约金</el-button>
<!--                <el-button -->
<!--                  v-if="scope.row.orderStatus === 'ACTIVE'" -->
<!--                  type="primary" -->
<!--                  link -->
<!--                  @click="handleRenewal(scope.row)"-->
<!--                >续租</el-button>-->
                <el-button 
                  v-if="scope.row.orderStatus === 'PENDING_PAYMENT' || scope.row.orderStatus === 'PENDING' || scope.row.orderStatus === 'PENDING_APPROVAL'" 
                  type="info" 
                  link 
                  @click="handleCancelOrder(scope.row)"
                >取消订单</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :background="true"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 退租对话框 -->
    <el-dialog
      v-model="terminateDialogVisible"
      title="申请退租"
      width="500px"
      destroy-on-close
    >
      <div v-if="currentHouse" class="terminate-form">
        <el-alert
          type="warning"
          :closable="false"
          show-icon
        >
          <p>提示：根据合同约定，提前退租需要支付违约金 <strong>¥{{ calculatePenalty(currentHouse) }}</strong></p>
        </el-alert>
        
        <el-form label-width="100px" class="mt-4">
          <el-form-item label="退租原因" required>
            <el-input 
              v-model="terminateReason" 
              type="textarea"
              :rows="4"
              placeholder="请填写退租原因"
            ></el-input>
          </el-form-item>
          
          <el-form-item label="期望退租日期" required>
            <el-date-picker
              v-model="expectedTerminateDate"
              type="date"
              placeholder="选择期望退租日期"
              :disabled-date="disabledDate"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="terminateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTerminate" :disabled="!terminateReason || !expectedTerminateDate">确认申请</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { PictureRounded as PictureFailed } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getUserOrders, terminateRental, payPenalty, payOrder, cancelOrder } from '@/api/order'

const router = useRouter()
const loading = ref(false)
const error = ref(false)
const houseList = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 退租相关
const terminateDialogVisible = ref(false)
const currentHouse = ref(null)
const terminateReason = ref('')
const expectedTerminateDate = ref('')

// 获取我的租房列表
const fetchUserHouses = async () => {
  loading.value = true;
  error.value = false;
  try {
    console.log('正在请求用户订单数据，参数:', {
      page: currentPage.value,
      size: pageSize.value
    });
    
    // 检查token是否存在
    const token = localStorage.getItem('token');
    console.log('当前token:', token ? token.substring(0, 15) + '...' : 'null');
    
    // 使用getUserOrders获取用户订单，不传status参数
    const res = await getUserOrders({
      page: currentPage.value,
      size: pageSize.value
    });
    
    console.log('API响应完整数据:', res);
    
    if (res.code === 200) {
      console.log('获取到订单数据结构:', res.data);
      console.log('订单记录列表:', res.data.records);
      console.log('订单记录数量:', res.data.records ? res.data.records.length : 0);
      
      // 过滤并处理订单数据，准备显示
      if (res.data && res.data.records && res.data.records.length > 0) {
        // 转换订单到房源显示格式
        const houses = res.data.records.map(order => {
          return {
            id: order.houseId,
            title: order.houseTitle,
            coverImage: order.houseImage || order.houseCoverImage,
            city: order.houseAddress ? order.houseAddress.split(/(?<=市|区)/)[0] : '',
            district: order.houseAddress ? order.houseAddress.replace(/^.*?(?<=市|区)/, '') : '',
            area: order.area || order.houseArea || null,
            price: order.monthlyRent,
            bedroomCount: order.bedroomCount || 1,
            livingRoomCount: order.livingRoomCount || 1,
            orderId: order.id,
            orderStatus: order.status,
            leaseStartDate: order.leaseStartDate,
            leaseEndDate: order.leaseEndDate,
            penaltyAmount: order.penaltyAmount,
            isPenaltyPaid: order.isPenaltyPaid,
            rentType: order.rentType || 'WHOLE',
            isHouseDeleted: order.isHouseDeleted || false
          };
        });
        
        // 过滤掉不是租赁状态的订单
        houseList.value = houses.filter(house => {
          // 保留已支付和活跃状态的订单
          return house.orderStatus === 'ACTIVE' || 
                 house.orderStatus === 'PAID' ||
                 house.orderStatus === 'PENDING_PAYMENT' ||
                 house.orderStatus === 'PENDING_APPROVAL' ||
                 house.orderStatus === 'TERMINATE_REQUESTED' || 
                 house.orderStatus === 'TERMINATE_APPROVED' ||
                 house.orderStatus === 'TERMINATED';
        });
        
        console.log('处理后的房源显示数据:', houseList.value);
        
        // 获取每个房源的详细信息
        fetchHouseDetails();
      } else {
        console.log('返回的订单列表为空');
        houseList.value = [];
      }
      
      total.value = res.data.total || 0;
    } else {
      console.error('API返回错误:', res.message, res);
      ElMessage.error(res.message || '获取我的租房失败');
      error.value = true;
    }
  } catch (error) {
    console.error('获取我的租房失败, 详细错误:', error);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    if (error.response) {
      console.error('服务器响应:', error.response.data);
      console.error('状态码:', error.response.status);
    }
    ElMessage.error('获取我的租房失败: ' + error.message);
    error.value = true;
  } finally {
    loading.value = false;
  }
};

// 获取房源详细信息，包括面积
const fetchHouseDetails = async () => {
  if (!houseList.value || houseList.value.length === 0) return;
  
  try {
    for (const house of houseList.value) {
      // 如果房源已被标记为删除，则跳过获取详情
      if (house.isHouseDeleted) {
        console.log(`跳过获取已删除房源 ${house.id} 的详情`);
        continue;
      }
      
      if ((!house.area || house.area <= 0) && house.id) {
        try {
          // 获取房源详情
          const response = await request.get(`/houses/${house.id}`);
          if (response && response.code === 200) {
            // 获取真实面积
            if (response.data.area && response.data.area > 0) {
              house.realArea = response.data.area;
              console.log(`更新房源 ${house.id} 的真实面积为: ${house.realArea}㎡`);
            }
          }
        } catch (err) {
          console.error(`获取房源 ${house.id} 详情失败:`, err.message);
          // 如果获取失败，可能是房源已删除，将其标记为已删除
          house.isHouseDeleted = true;
        }
      }
    }
  } catch (error) {
    console.error('获取房源详情失败:', error);
  }
};

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchUserHouses()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchUserHouses()
}

// 查看房源详情
const viewHouseDetail = (id) => {
  // 如果房源已删除，则不跳转
  const house = houseList.value.find(h => h.id === id);
  if (house && house.isHouseDeleted) {
    ElMessage.info('该房源已被删除，无法查看详情');
    return;
  }
  
  router.push({
    path: `/user/house/detail/${id}`,
    query: { fromMyHouse: 'true' }
  })
}

// 去找房
const goToHouseList = () => {
  router.push('/user/house/list')
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '暂无'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'ACTIVE':
    case 'PAID':
      return 'success'
    case 'PENDING':
    case 'PENDING_PAYMENT':
    case 'PENDING_APPROVAL':
      return 'warning'
    case 'EXPIRED':
    case 'CANCELLED':
      return 'danger'
    case 'TERMINATE_REQUESTED':
      return 'info'
    case 'TERMINATE_APPROVED':
      return 'warning'
    case 'TERMINATED':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'ACTIVE':
      return '租赁中'
    case 'PAID':
      return '已支付'
    case 'PENDING':
    case 'PENDING_PAYMENT':
      return '待支付'
    case 'PENDING_APPROVAL':
      return '待审核'
    case 'EXPIRED':
      return '已过期'
    case 'CANCELLED':
      return '已取消'
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

// 打开退租对话框
const openTerminateDialog = (house) => {
  currentHouse.value = house;
  terminateReason.value = '';
  expectedTerminateDate.value = '';
  terminateDialogVisible.value = true;
};

// 计算违约金
const calculatePenalty = (house) => {
  if (!house) return 0;
  // 这里可以根据合同约定的计算方式计算违约金，示例中简单按月租金的50%计算
  return house.price * 0.5;
}

// 禁用不可选择的日期（今天之前的日期不可选）
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7; // 禁用今天之前的日期
}

// 提交退租请求
const submitTerminate = async () => {
  if (!terminateReason.value.trim()) {
    ElMessage.error('请填写退租原因');
    return;
  }
  
  if (!expectedTerminateDate.value) {
    ElMessage.error('请选择预期退租日期');
    return;
  }
  
  if (!currentHouse.value.orderId) {
    ElMessage.error('未找到对应的订单ID，无法提交退租请求');
    console.error('退租失败：缺少订单ID', currentHouse.value);
    return;
  }
  
  try {
    const res = await terminateRental(currentHouse.value.orderId, {
      reason: terminateReason.value,
      expectedDate: expectedTerminateDate.value
    });
    
    if (res.code === 200) {
      ElMessage.success('退租申请提交成功');
      terminateDialogVisible.value = false;
      terminateReason.value = '';
      expectedTerminateDate.value = '';
      fetchUserHouses(); // 刷新列表
    } else {
      ElMessage.error(res.message || '退租申请提交失败');
    }
  } catch (error) {
    console.error('退租申请提交失败:', error);
    ElMessage.error('退租申请提交失败: ' + error.message);
  }
};

// 处理续租
const handleRenewal = (house) => {
  ElMessageBox.confirm('确定要续租该房源吗？', '续租确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 这里实现续租逻辑
    ElMessage.success('已发起续租请求，等待系统处理');
  }).catch(() => {
    // 用户取消操作
  });
}

// 处理支付罚金
const handlePayPenalty = async (house) => {
  if (!house.orderId) {
    ElMessage.error('未找到对应的订单ID，无法支付罚金');
    console.error('支付罚金失败：缺少订单ID', house);
    return;
  }
  
  try {
    ElMessageBox.confirm(
      `确定要支付¥${house.penaltyAmount}的违约金吗？`,
      '支付确认',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(async () => {
      // 只需要传递订单ID，不需要额外参数
      const res = await payPenalty(house.orderId);
      if (res.code === 200) {
        ElMessage.success('罚金支付成功');
        fetchUserHouses(); // 刷新列表
      } else {
        ElMessage.error(res.message || '罚金支付失败');
      }
    }).catch(() => {
      ElMessage.info('已取消支付');
    });
  } catch (error) {
    console.error('支付罚金失败:', error);
    ElMessage.error('支付罚金失败: ' + error.message);
  }
};

// 处理支付订单
const handlePayOrder = (house) => {
  if (!house.orderId) {
    ElMessage.error('未找到对应的订单ID，无法支付');
    console.error('支付订单失败：缺少订单ID', house);
    return;
  }

  ElMessageBox.confirm(
    `确定要支付订单吗？订单金额：¥${house.price}/月`,
    '支付确认',
    {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      // 只需要传递订单ID，不需要额外参数
      const res = await payOrder(house.orderId);
      if (res.code === 200) {
        ElMessage.success('订单支付成功');
        fetchUserHouses(); // 刷新列表
      } else {
        ElMessage.error(res.message || '订单支付失败');
      }
    } catch (error) {
      console.error('支付订单失败:', error);
      ElMessage.error('支付订单失败: ' + error.message);
    }
  }).catch(() => {
    ElMessage.info('已取消支付');
  });
};

// 处理取消订单
const handleCancelOrder = (house) => {
  if (!house.orderId) {
    ElMessage.error('未找到对应的订单ID，无法取消');
    console.error('取消订单失败：缺少订单ID', house);
    return;
  }

  ElMessageBox.prompt('请输入取消原因', '取消订单', {
    confirmButtonText: '确认取消',
    cancelButtonText: '返回',
    inputPlaceholder: '请输入取消订单的原因',
    type: 'warning'
  }).then(async ({ value }) => {
    if (!value) {
      ElMessage.warning('请输入取消原因');
      return;
    }
    
    try {
      // 根据API定义，可能需要修改参数传递方式
      const res = await cancelOrder(house.orderId, {
        reason: value
      });
      if (res.code === 200) {
        ElMessage.success('订单取消成功');
        fetchUserHouses(); // 刷新列表
      } else {
        ElMessage.error(res.message || '订单取消失败');
      }
    } catch (error) {
      console.error('取消订单失败:', error);
      ElMessage.error('取消订单失败: ' + error.message);
    }
  }).catch(() => {
    ElMessage.info('已取消操作');
  });
};

onMounted(() => {
  fetchUserHouses()
})
</script>

<style scoped>
.myhouse-page {
  padding: 20px;
}

.myhouse-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.empty-action {
  margin-top: 20px;
}

.house-info-cell {
  display: flex;
  align-items: center;
}

.house-cover {
  width: 120px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 24px;
}

.house-info {
  flex: 1;
}

.house-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.house-title:hover {
  color: #409eff;
}

.house-attrs {
  margin-bottom: 8px;
}

.house-attrs .el-tag {
  margin-right: 5px;
}

.house-location {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 13px;
}

.house-location .el-icon {
  margin-right: 5px;
}

.price {
  font-weight: bold;
  color: #f56c6c;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.terminate-form {
  margin-top: 15px;
}

.mt-4 {
  margin-top: 15px;
}

.deleted-house {
  filter: grayscale(100%);
  opacity: 0.7;
  cursor: not-allowed;
}

.deleted-house-info {
  color: #909399;
  opacity: 0.8;
}

.deleted-badge {
  background-color: #f56c6c;
  color: #fff;
  padding: 2px 5px;
  border-radius: 4px;
  margin-left: 5px;
  font-size: 12px;
}
</style> 