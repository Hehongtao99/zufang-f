<template>
  <div class="house-detail-page">
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <h2>房源详情</h2>
          <div class="actions">
            <el-button @click="goBack">返回</el-button>
          </div>
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
      
      <div v-loading="loading" class="house-detail">
        <template v-if="houseInfo">
          <div :class="{'deleted-house': houseInfo.isDeleted}">
            <div class="section main-info">
              <div class="title-area">
                <h1 class="house-title">{{ houseInfo.title }} 
                  <el-tag v-if="houseInfo.isDeleted" type="danger" effect="dark">已删除</el-tag>
                </h1>
                <div class="tags">
                  <el-tag type="success">{{ houseInfo.rentType === 'WHOLE' ? '整租' : '合租' }}</el-tag>
                  <el-tag>{{ houseInfo.houseType === 'APARTMENT' ? '公寓' : '别墅' }}</el-tag>
                  <el-tag v-if="houseInfo.hasElevator">电梯</el-tag>
                  <el-tag v-if="houseInfo.hasParking">停车位</el-tag>
                  <el-tag v-if="houseInfo.decoration">{{ houseInfo.decoration }}</el-tag>
                </div>
              </div>
              
              <div class="price-info">
                <div class="price">¥ <span class="price-value">{{ houseInfo.price?.toFixed(2) }}</span> / 月</div>
                <div class="area">{{ houseInfo.area }} 平方米</div>
              </div>
            </div>
            
            <el-divider />
            
            <div class="section gallery">
              <div v-if="houseInfo.coverImage" class="cover-image">
                <el-image
                  style="width: 100%; max-height: 400px;"
                  :src="houseInfo.coverImage"
                  fit="contain"
                  :preview-src-list="allImagesList"
                />
              </div>
              
              <div v-if="houseInfo.images && houseInfo.images.length > 0" class="image-thumbnails">
                <div class="thumbnail-scroller">
                  <div 
                    v-for="(image, index) in houseInfo.images" 
                    :key="index"
                    class="thumbnail"
                    :class="{ active: currentImageIndex === index }"
                    @click="currentImageIndex = index"
                  >
                    <el-image
                      :src="image"
                      fit="cover"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <el-divider />
            
            <div class="section basic-info">
              <h3 class="section-title">基本信息</h3>
              <el-descriptions :column="3" border>
                <el-descriptions-item label="房型">{{ houseInfo.bedroomCount }}室{{ houseInfo.livingRoomCount }}厅{{ houseInfo.bathroomCount }}卫</el-descriptions-item>
                <el-descriptions-item label="房屋朝向">{{ houseInfo.orientation || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="楼层">{{ houseInfo.floor }}/{{ houseInfo.totalFloor }}</el-descriptions-item>
                <el-descriptions-item label="装修情况">{{ houseInfo.decoration || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="电梯">{{ houseInfo.hasElevator ? '有' : '无' }}</el-descriptions-item>
                <el-descriptions-item label="停车位">{{ houseInfo.hasParking ? '有' : '无' }}</el-descriptions-item>
                <el-descriptions-item label="地址" :span="3">{{ houseInfo.province }}{{ houseInfo.city }}{{ houseInfo.district }}{{ houseInfo.address }}</el-descriptions-item>
              </el-descriptions>
            </div>
            
            <el-divider />
            
            <div class="section house-desc">
              <h3 class="section-title">房源描述</h3>
              <div class="description">
                <p v-if="houseInfo.description">{{ houseInfo.description }}</p>
                <p v-else class="no-data">暂无描述信息</p>
              </div>
            </div>
            
            <el-divider />
            
            <div class="section contact-info">
              <h3 class="section-title">联系方式</h3>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="联系人">{{ houseInfo.ownerName || '未知' }}</el-descriptions-item>
                <el-descriptions-item label="联系电话">
                  <div v-if="houseInfo.isDeleted">
                    <el-tag type="danger">房源已删除，无法进行操作</el-tag>
                  </div>
                  <div v-else>
                    <el-button type="primary" plain @click="showContact">查看联系方式</el-button>
                    <el-button type="success" plain @click="showAppointmentDialog">预约看房</el-button>
                    <el-button type="danger" plain @click="showBookingDialog">立刻订房</el-button>
                    <el-button type="warning" plain @click="showChatDialog">咨询房东</el-button>
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </div>
            
            <el-divider />
            
            <div class="section publish-info">
              <div class="publish-time">发布时间: {{ formatDate(houseInfo.createTime) }}</div>
              <div class="house-id">房源编号: {{ houseInfo.id }}</div>
            </div>
          </div>
        </template>
        
        <div v-else class="empty-result">
          <el-empty description="找不到房源信息" />
        </div>
      </div>
    </el-card>

    <!-- 预约看房对话框 -->
    <el-dialog
      v-model="appointmentDialogVisible"
      title="预约看房"
      width="500px"
    >
      <el-form 
        ref="appointmentFormRef" 
        :model="appointmentForm" 
        :rules="appointmentRules" 
        label-width="80px"
      >
        <el-form-item label="看房时间" prop="appointmentTime">
          <el-date-picker
            v-model="appointmentForm.appointmentTime"
            type="datetime"
            placeholder="选择看房时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD[T]HH:mm:ss"
            :disabled-date="disabledDate"
            :disabled-hours="disabledHours"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="appointmentForm.phone" placeholder="请输入您的联系电话" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input 
            v-model="appointmentForm.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入其他备注信息，如特殊需求等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="appointmentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAppointment" :loading="submitting">确认预约</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 订房对话框 -->
    <el-dialog
      v-model="bookingDialogVisible"
      title="确认订房信息"
      width="500px"
    >
      <el-form 
        ref="bookingFormRef" 
        :model="bookingForm" 
        :rules="bookingRules" 
        label-width="100px"
      >
        <el-form-item label="入住日期" prop="startDate">
          <el-date-picker
            v-model="bookingForm.startDate"
            type="date"
            placeholder="选择入住日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledStartDate"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="租期(月)" prop="leaseTerm">
          <el-input-number 
            v-model="bookingForm.leaseTerm" 
            :min="minLeaseTerm" 
            :step="1"
            controls-position="right"
            style="width: 100%"
            @change="calculateEndDate"
          />
          <div class="form-tip" v-if="minLeaseTerm > 1">最短租期为 {{ minLeaseTerm }} 个月</div>
        </el-form-item>
        <el-form-item label="结束日期">
          <div>{{ bookingForm.endDate }}</div>
        </el-form-item>
        <el-form-item label="月租金">
          <div>¥ {{ houseInfo?.price?.toFixed(2) || 0 }}/月</div>
        </el-form-item>
        <el-form-item label="租金总额">
          <div>¥ {{ calculateMonthlyRentTotal().toFixed(2) }}</div>
          <div class="form-tip">{{ bookingForm.leaseTerm }}个月租金</div>
        </el-form-item>
        <el-form-item label="押金">
          <div>¥ {{ calculateDeposit().toFixed(2) }}</div>
          <div class="form-tip">押金为 {{ houseInfo?.depositMonths || 1 }} 个月租金</div>
        </el-form-item>
        <el-form-item label="服务费">
          <div>¥ {{ calculateServiceFee().toFixed(2) }}</div>
          <div class="form-tip">服务费为月租金的2%</div>
        </el-form-item>
        <el-form-item label="总金额">
          <div class="total-price">¥ {{ calculateTotalAmount().toFixed(2) }}</div>
          <div class="form-tip">租金总额 + 押金 + 服务费</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bookingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBooking" :loading="submitting">确认订房</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 保留预览聊天对话框，并作为主要的聊天对话框 -->
    <el-dialog
      v-model="chatDialogVisible" 
      title="咨询房东"
      width="400px"
      :destroy-on-close="false"
      :before-close="closeChatDialog" 
      class="preview-chat-dialog" 
    >
      <Chat 
        v-if="chatDialogVisible" 
        :houseId="Number(route.params.id)" 
        :userId="Number(userId)"
        :landlordId="Number(houseInfo?.ownerId || 0)"
        :houseName="houseInfo?.title || '房源咨询'"
        :currentUserName="userName"
        :otherUserName="houseInfo?.ownerName || '房东'"
        :currentUserAvatar="userAvatar"
        :otherUserAvatar="houseInfo?.ownerAvatar"
        :compact="true" 
        @close="closeChatDialog" 
        @message-sent="handleMessageSent" 
      />
    </el-dialog>

    <!-- 添加评论区 -->
    <house-comment v-if="houseInfo && houseInfo.id" :house-id="houseInfo.id"></house-comment>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { createOrder } from '@/api/order'
import HouseComment from '@/components/HouseComment.vue'
import Chat from '@/components/Chat.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const error = ref(false)
const houseInfo = ref(null)
const currentImageIndex = ref(0)

// 订房相关
const bookingDialogVisible = ref(false);
const bookingFormRef = ref(null);
const bookingForm = reactive({
  houseId: '',
  startDate: '',
  endDate: '',
  leaseTerm: 1
});

// 计算属性：最短租期
const minLeaseTerm = computed(() => {
  return houseInfo.value?.minLeaseTerm || 1;
});

// 禁用过去的日期作为入住日期
const disabledStartDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7; // 禁用今天之前的日期
};

// 计算结束日期
const calculateEndDate = () => {
  if (!bookingForm.startDate) return;
  
  const startDate = new Date(bookingForm.startDate);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + bookingForm.leaseTerm);
  endDate.setDate(endDate.getDate() - 1); // 租期结束日是从开始日计算的，要减1天
  
  // 格式化日期
  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  
  bookingForm.endDate = `${year}-${month}-${day}`;
};

// 计算押金
const calculateDeposit = () => {
  if (!houseInfo.value?.price) return 0;
  const depositMonths = houseInfo.value.depositMonths || 1;
  return houseInfo.value.price * depositMonths;
};

// 计算月租金总额
const calculateMonthlyRentTotal = () => {
  if (!houseInfo.value?.price) return 0;
  return houseInfo.value.price * bookingForm.leaseTerm;
};

// 计算服务费
const calculateServiceFee = () => {
  if (!houseInfo.value?.price) return 0;
  return houseInfo.value.price * 0.02; // 2%的服务费
};

// 计算总金额
const calculateTotalAmount = () => {
  if (!houseInfo.value?.price) return 0;
  const monthlyRentTotal = calculateMonthlyRentTotal();
  const deposit = calculateDeposit();
  const serviceFee = calculateServiceFee();
  return monthlyRentTotal + deposit + serviceFee;
};

// 订房表单验证规则
const bookingRules = {
  startDate: [
    { required: true, message: '请选择入住日期', trigger: 'change' }
  ],
  leaseTerm: [
    { required: true, message: '请输入租期', trigger: 'change' },
    { type: 'number', min: minLeaseTerm.value, message: `最短租期为${minLeaseTerm.value}个月`, trigger: 'change' }
  ]
};

// 显示订房对话框
const showBookingDialog = () => {
  if (!houseInfo.value) {
    ElMessage.warning('房源信息加载中，请稍后再试');
    return;
  }
  
  bookingForm.houseId = houseInfo.value.id;
  bookingForm.leaseTerm = minLeaseTerm.value;
  
  // 设置默认入住日期为当前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  bookingForm.startDate = `${year}-${month}-${day}`;
  
  // 计算结束日期
  calculateEndDate();
  
  bookingDialogVisible.value = true;
};

// 提交订房
const submitBooking = () => {
  bookingFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitting.value = true;
      try {
        console.log('准备提交订房请求...');
        // 组织API提交的数据
        const data = {
          houseId: bookingForm.houseId,
          startDate: bookingForm.startDate,
          endDate: bookingForm.endDate,
          leaseTerm: bookingForm.leaseTerm
        };
        
        console.log('订房数据:', data);
        const response = await createOrder(data);
        console.log('订房响应:', response);
        
        if (response && response.code === 200) {
          ElMessage.success('订房成功，正在准备合同...');
          
          try {
            const orderId = response.data;
            // 先创建合同
            const contractResponse = await request.post(`/user/contracts/create/${orderId}`);
            
            if (contractResponse && contractResponse.code === 200) {
              // 然后跳转到合同签署页面
              router.push({
                path: '/user/contract/sign',
                query: { orderId: orderId }
              });
            } else {
              // 合同创建失败，但订单已创建
              console.error('合同创建失败:', contractResponse?.message);
              
              ElMessageBox.confirm(
                '订单已创建成功，但合同生成失败。您可以继续前往订单页面，稍后再尝试创建合同。',
                '合同创建失败',
                {
                  confirmButtonText: '前往订单页面',
                  cancelButtonText: '重试创建合同',
                  type: 'warning',
                }
              ).then(() => {
                // 用户选择前往订单页面
                router.push('/user/orders');
              }).catch(() => {
                // 用户选择重试创建合同
                ElMessage.info('正在重试创建合同...');
                request.post(`/user/contracts/create/${orderId}`)
                  .then(retryResponse => {
                    if (retryResponse && retryResponse.code === 200) {
                      ElMessage.success('合同创建成功！');
                      router.push({
                        path: '/user/contract/sign',
                        query: { orderId: orderId }
                      });
                    } else {
                      ElMessage.error('重试创建合同失败，请稍后在订单页面尝试');
                      router.push('/user/orders');
                    }
                  })
                  .catch(err => {
                    console.error('重试创建合同失败:', err);
                    ElMessage.error('重试创建合同失败，请稍后在订单页面尝试');
                    router.push('/user/orders');
                  });
              });
            }
          } catch (err) {
            console.error('合同创建失败:', err);
            // 合同创建出现异常
            ElMessageBox.confirm(
              '订单已创建成功，但合同生成时出现错误。您可以继续前往订单页面，稍后再尝试创建合同。',
              '合同创建失败',
              {
                confirmButtonText: '前往订单页面',
                cancelButtonText: '重试创建合同',
                type: 'warning',
              }
            ).then(() => {
              // 用户选择前往订单页面
              router.push('/user/orders');
            }).catch(() => {
              // 用户选择重试创建合同
              ElMessage.info('正在重试创建合同...');
              request.post(`/user/contracts/create/${orderId}`)
                .then(retryResponse => {
                  if (retryResponse && retryResponse.code === 200) {
                    ElMessage.success('合同创建成功！');
                    router.push({
                      path: '/user/contract/sign',
                      query: { orderId: orderId }
                    });
                  } else {
                    ElMessage.error('重试创建合同失败，请稍后在订单页面尝试');
                    router.push('/user/orders');
                  }
                })
                .catch(err => {
                  console.error('重试创建合同失败:', err);
                  ElMessage.error('重试创建合同失败，请稍后在订单页面尝试');
                  router.push('/user/orders');
                });
            });
          }
        } else {
          ElMessage.error(response?.message || '订房失败，请稍后再试');
        }
      } catch (err) {
        console.error('订房失败:', err);
        ElMessage.error('订房失败，请稍后再试');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 获取所有图片列表用于预览
const allImagesList = computed(() => {
  const list = []
  if (houseInfo.value?.coverImage) {
    list.push(houseInfo.value.coverImage)
  }
  if (houseInfo.value?.images && houseInfo.value.images.length > 0) {
    // 处理可能的对象数组或字符串数组
    const imageUrls = houseInfo.value.images.map(img => typeof img === 'object' ? img.url : img);
    list.push(...imageUrls);
  }
  return list
})

// 获取房源详情
const fetchHouseDetail = async () => {
  const houseId = route.params.id
  if (!houseId) {
    ElMessage.error('房源ID不能为空')
    router.push('/user/house/list')
    return
  }
  
  loading.value = true
  error.value = false
  
  try {
    console.log('正在获取房源详情，房源ID:', houseId)
    // 使用GET方法获取详情，确保使用正确的API路径
    const response = await request.get(`/houses/${houseId}`)
    console.log('房源详情API响应:', response)
    
    // 检查响应状态
    if (response && response.code === 200) {
      houseInfo.value = response.data
      
      if (!houseInfo.value) {
        console.error('房源详情数据为空')
        error.value = true
        ElMessage.error('房源信息不存在')
        return
      }
      
      console.log('获取到房源详情:', houseInfo.value)
      
      // 处理图片URL
      if (houseInfo.value.coverImage && !houseInfo.value.coverImage.startsWith('http')) {
        if (!houseInfo.value.coverImage.startsWith('/')) {
          houseInfo.value.coverImage = '/' + houseInfo.value.coverImage
        }
        houseInfo.value.coverImage = `/api${houseInfo.value.coverImage}`
      }
      
      // 如果存在images并且是对象数组格式，处理为URL格式
      if (houseInfo.value.images && houseInfo.value.images.length > 0) {
        if (typeof houseInfo.value.images[0] === 'object') {
          houseInfo.value.images = houseInfo.value.images.map(img => {
            let url = img.url
            if (!url.startsWith('http')) {
              if (!url.startsWith('/')) {
                url = '/' + url
              }
              url = `/api${url}`
            }
            return url
          })
        } else {
          // 如果已经是字符串数组，也需要确保是完整URL
          houseInfo.value.images = houseInfo.value.images.map(url => {
            if (!url.startsWith('http')) {
              if (!url.startsWith('/')) {
                url = '/' + url
              }
              url = `/api${url}`
            }
            return url
          })
        }
      }
      
      // 检查房源状态
      if (!route.query.fromMyHouse && houseInfo.value.status !== 'APPROVED' && houseInfo.value.status !== 'ONLINE' && 
          houseInfo.value.status !== '1' && houseInfo.value.status !== '3') {
        ElMessage.warning('当前房源不是上架状态，可能已被出租或下架')
        router.push('/user/house/list')
      }
    } else {
      console.error('获取房源详情失败:', response?.message)
      error.value = true
      ElMessage.error(response?.message || '获取数据失败')
    }
  } catch (err) {
    console.error('获取房源详情失败:', err)
    error.value = true
    ElMessage.error(`获取数据失败：${err.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 显示联系方式
const showContact = () => {
  // 这里应该有一个获取联系方式的接口，暂时使用模拟数据
  ElMessageBox.alert('联系电话: 138****8888', '联系方式', {
    confirmButtonText: '确定',
    type: 'info'
  })
}

// 预约看房
const appointmentDialogVisible = ref(false)
const appointmentFormRef = ref(null)
const submitting = ref(false)

// 预约表单
const appointmentForm = reactive({
  houseId: '',
  appointmentTime: '',
  phone: '',
  remark: ''
})

// 预约表单规则
const appointmentRules = {
  appointmentTime: [
    { required: true, message: '请选择看房时间', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e7 // 禁用今天之前的日期
}

// 禁用特定时间段（例如晚上10点到早上9点）
const disabledHours = () => {
  const hours = []
  for (let i = 0; i < 9; i++) {
    hours.push(i)
  }
  for (let i = 22; i < 24; i++) {
    hours.push(i)
  }
  return hours
}

// 显示预约对话框
const showAppointmentDialog = () => {
  if (!houseInfo.value) {
    ElMessage.warning('房源信息加载中，请稍后再试')
    return
  }
  
  // 清空之前的表单数据
  appointmentForm.appointmentTime = '';
  appointmentForm.phone = '';
  appointmentForm.remark = '';
  
  // 设置房屋ID
  appointmentForm.houseId = houseInfo.value.id
  
  // 如果登录用户有手机号，则自动填充
  const userPhone = localStorage.getItem('userPhone');
  if (userPhone) {
    appointmentForm.phone = userPhone;
  }
  
  appointmentDialogVisible.value = true
}

// 提交预约
const submitAppointment = () => {
  appointmentFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        // 创建一个新的预约对象，用于提交
        const appointmentData = { ...appointmentForm };
        
        // 特殊处理日期格式
        if (appointmentData.appointmentTime && typeof appointmentData.appointmentTime === 'object' && appointmentData.appointmentTime instanceof Date) {
          // 如果是Date对象，转换为yyyy-MM-dd HH:mm:ss格式
          const year = appointmentData.appointmentTime.getFullYear();
          const month = String(appointmentData.appointmentTime.getMonth() + 1).padStart(2, '0');
          const day = String(appointmentData.appointmentTime.getDate()).padStart(2, '0');
          const hours = String(appointmentData.appointmentTime.getHours()).padStart(2, '0');
          const minutes = String(appointmentData.appointmentTime.getMinutes()).padStart(2, '0');
          const seconds = String(appointmentData.appointmentTime.getSeconds()).padStart(2, '0');
          
          appointmentData.appointmentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
          console.log('格式化后的预约时间:', appointmentData.appointmentTime);
        } else if (appointmentData.appointmentTime && typeof appointmentData.appointmentTime === 'string') {
          // 如果已经是字符串格式，确保格式正确
          console.log('原始预约时间(字符串):', appointmentData.appointmentTime);
          
          // 如果包含T，保持原样，后端会处理ISO格式
          if (appointmentData.appointmentTime.indexOf('T') !== -1) {
            console.log('使用ISO格式预约时间:', appointmentData.appointmentTime);
          } else {
            // 如果是其他格式，确保使用yyyy-MM-dd HH:mm:ss格式
            const date = new Date(appointmentData.appointmentTime);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            appointmentData.appointmentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            console.log('转换后的标准格式预约时间:', appointmentData.appointmentTime);
          }
        }
        
        // 发送请求
        const response = await request.post('/appointment/create', appointmentData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response && response.code === 200) {
          ElMessage.success('预约成功，房东将尽快与您联系');
          appointmentDialogVisible.value = false;
        } else {
          throw new Error(response?.message || '预约失败，请稍后再试');
        }
      } catch (err) {
        console.error('预约失败:', err);
        ElMessage.error(`预约失败: ${err.message || '请稍后再试'}`);
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 返回
const goBack = () => {
  router.back()
}

// 处理预订
const handleBooking = () => {
  // 如果房源已删除，则不允许预订
  if (houseInfo.value.isDeleted) {
    ElMessage.warning('该房源已被删除，无法预订');
    return;
  }
  
  // ... existing code ...
}

// 聊天相关
const userId = localStorage.getItem('userId')
const userName = localStorage.getItem('nickname') || localStorage.getItem('username') || '租客'
const userAvatar = localStorage.getItem('avatar') || ''

// 重命名预览聊天相关状态和方法
const chatDialogVisible = ref(false); // 原 previewChatDialogVisible
const handleMessageSent = (message) => { // 原 handlePreviewMessageSent
  console.log('对话消息已发送:', message);
};
const closeChatDialog = () => { // 原 closePreviewChatDialog
  chatDialogVisible.value = false;
};
const showChatDialog = () => { // 原 showPreviewChatDialog
  if (!userId) {
    ElMessageBox.confirm('您需要登录后才能咨询房东，是否立即登录？', '提示', {
      confirmButtonText: '去登录',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath));
    }).catch(() => {});
    return;
  }
  
  if (houseInfo.value && houseInfo.value.ownerId === Number(userId)) {
    ElMessage.warning('这是您自己的房源，无需咨询');
    return;
  }
  
  chatDialogVisible.value = true;
};

onMounted(() => {
  fetchHouseDetail();
  // URL参数检查逻辑保持不变，现在会调用重命名后的 showChatDialog
  if (route.query.openChat === 'true') {
    showChatDialog();
  }
});
</script>

<style scoped>
.house-detail-page {
  padding: 20px;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.house-detail {
  padding: 10px 0;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background-color: #409EFF;
  border-radius: 2px;
}

.main-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.house-title {
  font-size: 24px;
  margin: 0 0 15px 0;
  line-height: 1.4;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.price-info {
  text-align: right;
  min-width: 200px;
}

.price {
  color: #f56c6c;
  font-size: 16px;
}

.price-value {
  font-size: 28px;
  font-weight: bold;
}

.area {
  margin-top: 10px;
  color: #606266;
  font-size: 14px;
}

.cover-image {
  text-align: center;
  margin-bottom: 20px;
}

.image-thumbnails {
  margin-top: 10px;
}

.thumbnail-scroller {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding: 5px 0;
}

.thumbnail {
  width: 100px;
  height: 75px;
  cursor: pointer;
  border: 2px solid transparent;
  overflow: hidden;
  border-radius: 4px;
}

.thumbnail.active {
  border-color: #409EFF;
}

.thumbnail .el-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.description {
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  line-height: 1.6;
}

.no-data {
  color: #909399;
  font-style: italic;
}

.publish-info {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 14px;
}

.publish-time {
  color: #909399;
  font-size: 14px;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.total-price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
}

.deleted-house {
  opacity: 0.8;
  position: relative;
}

.deleted-house::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(245, 108, 108, 0.05);
  pointer-events: none;
  z-index: 1;
}

/* 添加对房源内容区域的样式修改 */
.house-content.deleted-house {
  opacity: 0.7;
  border: 1px solid #f56c6c;
}

.image-carousel {
  width: 100%;
  max-height: 500px;
}

.chat-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 500px;
}

.preview-chat-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 400px;
  overflow: hidden; /* 防止可能的内容溢出 */
}

.preview-chat-dialog :deep(.el-dialog) {
  max-width: 400px;
  border-radius: 4px;
}

.preview-chat-dialog :deep(.el-dialog__header) {
  padding: 10px;
  margin: 0;
}

.preview-chat-dialog :deep(.el-dialog__headerbtn) {
  top: 10px;
}

/* 添加以下对话框消息相关样式 */
.preview-chat-dialog :deep(.message-item-right) {
  justify-content: flex-end;
  flex-direction: row-reverse;
  margin-right: 0 !important;
  padding-left: 15% !important; /* 给左侧留出空间 */
}

/* 确保左侧消息也能贴紧左侧 */
.preview-chat-dialog :deep(.message-item-left) {
  justify-content: flex-start;
  margin-left: 0 !important;
  padding-right: 15% !important; /* 给右侧留出空间 */
}

.preview-chat-dialog :deep(.message-content) {
  max-width: 100% !important; /* 修改为100%，确保充分利用可用空间 */
}

.preview-chat-dialog :deep(.message-item-right .message-content) {
  align-items: flex-end;
  margin-right: 0 !important;
}

.preview-chat-dialog :deep(.message-item-left .message-content) {
  align-items: flex-start;
  margin-left: 0 !important;
}

.preview-chat-dialog :deep(.message-item-right .message-text) {
  margin-right: 0 !important;
  background-color: #fff;
  border-top-right-radius: 0;
}

.preview-chat-dialog :deep(.message-item-left .message-text) {
  margin-left: 0 !important;
  background-color: #fff;
  border-top-left-radius: 0;
}

/* 确保聊天气泡内的消息内容正确显示 */
.preview-chat-dialog :deep(.message-text) {
  word-break: break-word;
  max-width: 100%;
  box-sizing: border-box;
}

/* 确保聊天容器布局正确 */
.preview-chat-dialog :deep(.chat-container) {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}

/* 确保聊天消息容器没有额外内边距 */
.preview-chat-dialog :deep(.chat-messages) {
  padding: 8px !important; /* 减少内边距 */
  width: 100%;
  box-sizing: border-box;
}
</style> 