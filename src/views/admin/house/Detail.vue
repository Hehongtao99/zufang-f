<template>
  <div class="admin-house-detail">
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>房源详情</span>
          <div class="header-buttons">
            <el-button @click="goBack" plain>返回</el-button>
            <template v-if="house.status === 0 || house.status === 'PENDING'">
              <el-button type="primary" @click="showApproveDialog">审核</el-button>
            </template>
            <template v-if="house.status === 1 || house.status === 'APPROVED'">
              <el-button type="success" @click="handleStatusChange(3)">上架</el-button>
            </template>
            <template v-if="house.status === 3 || house.status === 'ONLINE'">
              <el-button type="warning" @click="handleStatusChange(4)">下架</el-button>
            </template>
            <template v-if="house.status === 4 || house.status === 'OFFLINE'">
              <el-button type="success" @click="handleStatusChange(3)">上架</el-button>
            </template>
          </div>
        </div>
      </template>
      
      <div v-if="loading" class="loading-container">
        <el-skeleton style="width: 100%" :rows="10" animated />
      </div>
      
      <div v-else-if="error" class="error-container">
        <el-empty description="加载房源详情失败，请稍后再试" />
      </div>
      
      <div v-else class="house-detail">
        <!-- 基本信息 -->
        <div class="house-header">
          <h1 class="house-title">{{ house.title }}</h1>
          <el-tag :type="getStatusType(house.status)">{{ getStatusText(house.status) }}</el-tag>
        </div>
        
        <!-- 图片展示 -->
        <div class="house-images">
          <el-image 
            v-if="house.coverImage" 
            :src="getImageUrl(house.coverImage)" 
            fit="cover"
            :preview-src-list="[getImageUrl(house.coverImage)]"
            class="cover-image"
          />
          <div class="image-list" v-if="house.images && house.images.length > 0">
            <el-image 
              v-for="(image, index) in house.images" 
              :key="index"
              :src="getImageUrl(typeof image === 'string' ? image : image.url)" 
              fit="cover"
              :preview-src-list="house.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))"
              class="small-image"
            />
          </div>
        </div>
        
        <!-- 价格和地址信息 -->
        <div class="price-address">
          <div class="price">
            <span class="price-value">{{ house.price || '-' }}</span>
            <span class="price-unit">元/月</span>
          </div>
          <div class="address">
            {{ house.city || '' }}{{ house.district || '' }}{{ house.address || '' }}
          </div>
        </div>
        
        <!-- 基础信息表格 -->
        <el-descriptions title="基础信息" :column="3" border>
          <el-descriptions-item label="房源类型">{{ house.houseType === 'APARTMENT' ? '公寓' : '别墅' }}</el-descriptions-item>
          <el-descriptions-item label="出租方式">{{ house.rentType === 'WHOLE' ? '整租' : '合租' }}</el-descriptions-item>
          <el-descriptions-item label="面积">{{ house.area || '-' }}平方米</el-descriptions-item>
          <el-descriptions-item label="户型">{{ formatRoomType(house) }}</el-descriptions-item>
          <el-descriptions-item label="楼层">{{ house.floor || '-' }}/{{ house.totalFloor || '-' }}层</el-descriptions-item>
          <el-descriptions-item label="朝向">{{ house.orientation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="装修">{{ house.decoration || '-' }}</el-descriptions-item>
          <el-descriptions-item label="电梯">{{ house.hasElevator ? '有' : '无' }}</el-descriptions-item>
          <el-descriptions-item label="车位">{{ house.hasParking ? '有' : '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 房源详情 -->
        <div class="house-description">
          <h3>房源描述</h3>
          <p>{{ house.description || '暂无描述' }}</p>
        </div>
        
        <!-- 发布者信息 -->
        <el-descriptions title="房东信息" :column="3" border>
          <el-descriptions-item label="房东ID">{{ house.ownerId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="房东名">{{ house.ownerName || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ house.ownerPhone || '未知' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 发布信息 -->
        <el-descriptions title="发布信息" :column="3" border>
          <el-descriptions-item label="创建时间">{{ formatDate(house.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(house.updateTime) }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(house.status) }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 拒绝原因 -->
        <div v-if="(house.status === 2 || house.status === 'REJECTED') && house.rejectReason" class="reject-reason">
          <h3>拒绝原因</h3>
          <el-alert
            type="error"
            :title="house.rejectReason"
            :closable="false"
            show-icon
          />
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button 
            v-if="house.status === 'PENDING' || house.status === '0'"
            type="primary" 
            @click="showApproveDialog"
          >审核通过</el-button>
          
          <el-button 
            v-if="house.status === 'PENDING' || house.status === '0'"
            type="danger" 
            @click="showRejectDialog"
          >拒绝</el-button>
          
          <el-button 
            v-if="house.status === 'APPROVED' || house.status === '3' || house.status === 'ONLINE'"
            type="warning" 
            @click="showOfflineDialog"
          >下架</el-button>
          
          <el-button 
            v-if="house.status === 'OFFLINE' || house.status === '4' || house.status === 'REJECTED' || house.status === '2'"
            type="success" 
            @click="showOnlineDialog"
          >上架</el-button>
          
          <el-button type="danger" @click="showDeleteDialog">删除</el-button>
        </div>
      </div>
    </el-card>
    
    <!-- 审核对话框 -->
    <el-dialog v-model="approveDialogVisible" title="房源审核" width="550px">
      <div class="approve-dialog">
        <div class="house-basic">
          <div><span>房源标题:</span>{{ house?.title }}</div>
          <div><span>所在地址:</span>{{ house?.city || '' }}{{ house?.district || '' }}{{ house?.address || '' }}</div>
        </div>
        <el-divider></el-divider>
        <div class="approve-options">
          <el-radio-group v-model="approveForm.approved">
            <el-radio :label="true">通过</el-radio>
            <el-radio :label="false">拒绝</el-radio>
          </el-radio-group>
          <el-input
            v-if="!approveForm.approved"
            v-model="approveForm.reason"
            type="textarea"
            placeholder="请输入拒绝理由"
            rows="3"
          ></el-input>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approveDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitApprove" :loading="approveLoading">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { formatDate } from '@/utils/date';

const route = useRoute();
const router = useRouter();
const houseId = ref(route.params.id);

// 房源详情数据
const house = ref({});
const loading = ref(true);
const error = ref(false);

// 审核对话框
const approveDialogVisible = ref(false);
const approveLoading = ref(false);
const approveForm = ref({
  houseId: null,
  approved: true,
  reason: ''
});

// 其他对话框
const rejectDialogVisible = ref(false);
const offlineDialogVisible = ref(false);
const onlineDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

// 显示拒绝对话框
const showRejectDialog = () => {
  rejectDialogVisible.value = true;
};

// 显示下架对话框
const showOfflineDialog = () => {
  ElMessageBox.confirm(
    '确定要下架该房源吗？',
    '下架房源',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    offlineHouse();
  }).catch(() => {
    // 用户取消操作
  });
};

// 显示上架对话框
const showOnlineDialog = () => {
  ElMessageBox.confirm(
    '确定要上架该房源吗？',
    '上架房源',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    onlineHouse();
  }).catch(() => {
    // 用户取消操作
  });
};

// 显示删除对话框
const showDeleteDialog = () => {
  ElMessageBox.confirm(
    '确定要删除该房源吗？该操作不可恢复！',
    '删除房源',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    deleteHouse();
  }).catch(() => {
    // 用户取消操作
  });
};

// 显示设为已出租对话框
const showSetRentedDialog = () => {
  ElMessageBox.confirm(
    '确定要将该房源设置为已出租状态吗？',
    '修改房源状态',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    setHouseRented();
  }).catch(() => {
    // 用户取消操作
  });
};

// 获取房源详情
const fetchHouseDetail = async () => {
  loading.value = true;
  error.value = false;
  
  try {
    const response = await request.get(`/houses/${houseId.value}`);
    
    if (response && response.code === 200) {
      house.value = response.data;
      console.log('房源详情:', house.value);
      
      // 保存审核表单的房源ID
      approveForm.value.houseId = house.value.id;
      
      // 处理图片URL - 确保所有图片URL格式正确
      if (house.value.coverImage) {
        house.value.coverImage = getImageUrl(house.value.coverImage);
      }
      
      if (house.value.images && house.value.images.length > 0) {
        house.value.images = house.value.images.map(img => {
          if (typeof img === 'string') {
            return getImageUrl(img);
          } else if (img && img.url) {
            return {
              ...img,
              url: getImageUrl(img.url)
            };
          }
          return img;
        });
      }
    } else {
      error.value = true;
      ElMessage.error(response?.message || '获取房源详情失败');
    }
  } catch (err) {
    console.error('获取房源详情失败:', err);
    error.value = true;
    ElMessage.error(err?.message || '获取房源详情失败');
  } finally {
    loading.value = false;
  }
};

// 处理图片URL
const getImageUrl = (url) => {
  if (!url) return '';
  
  // 如果已经是完整URL（以http或https开头），则直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // 确保URL以/开头
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // 如果URL以/api开头，则移除/api前缀
  if (url.startsWith('/api/')) {
    url = url.substring(4);
  }
  
  // 如果是相对路径，加上API前缀
  return `/api${url}`;
};

// 格式化户型
const formatRoomType = (house) => {
  if (!house) return '';
  return `${house.bedroomCount || 0}室${house.livingRoomCount || 0}厅${house.bathroomCount || 0}卫`;
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '已审核',
    2: '已拒绝',
    3: '已上架',
    4: '已下架',
    5: '已出租',
    'PENDING': '待审核',
    'APPROVED': '已审核',
    'REJECTED': '已拒绝',
    'ONLINE': '已上架',
    'OFFLINE': '已下架',
    'RENTED': '已出租'
  };
  return statusMap[status] || '未知';
};

// 获取状态标签类型
const getStatusType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'success',
    2: 'danger',
    3: 'primary',
    4: 'warning',
    5: 'success',
    'PENDING': 'info',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'ONLINE': 'primary',
    'OFFLINE': 'warning',
    'RENTED': 'success'
  };
  return typeMap[status] || '';
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 显示审核对话框
const showApproveDialog = () => {
  approveDialogVisible.value = true;
};

// 将房源设置为已出租
const setHouseRented = async () => {
  try {
    loading.value = true;
    const response = await request.put(`/houses/status/${houseId.value}`, {
      status: 'RENTED'
    });
    
    if (response && response.code === 200) {
      ElMessage.success('房源状态已设置为已出租');
      // 刷新数据
      fetchHouseDetail();
    } else {
      ElMessage.error(response?.message || '设置房源状态失败');
    }
  } catch (err) {
    console.error('设置房源状态失败:', err);
    ElMessage.error('设置房源状态失败');
  } finally {
    loading.value = false;
  }
};

// 提交审核
const submitApprove = async () => {
  if (!approveForm.value.approved && !approveForm.value.reason.trim()) {
    ElMessage.warning('请输入拒绝理由');
    return;
  }
  
  approveLoading.value = true;
  try {
    const response = await request.post('/admin/houses/approve', approveForm.value);
    if (response && response.code === 200) {
      ElMessage.success('审核操作成功');
      approveDialogVisible.value = false;
      fetchHouseDetail(); // 刷新详情
    } else {
      ElMessage.error(response?.message || '审核失败');
    }
  } catch (err) {
    console.error('审核操作出错:', err);
    ElMessage.error(err?.message || '审核操作失败');
  } finally {
    approveLoading.value = false;
  }
};

// 处理上架/下架状态变更
const handleStatusChange = (newStatus) => {
  const actionText = newStatus === 3 ? '上架' : '下架';
  
  ElMessageBox.confirm(
    `确定要${actionText}该房源吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const url = newStatus === 3 
        ? `/admin/houses/${house.value.id}/online` 
        : `/admin/houses/${house.value.id}/offline`;
        
      const response = await request.post(url);
      if (response && response.code === 200) {
        ElMessage.success(`${actionText}成功`);
        fetchHouseDetail(); // 刷新详情
      } else {
        ElMessage.error(response?.message || `${actionText}失败`);
      }
    } catch (err) {
      console.error(`${actionText}操作出错:`, err);
      ElMessage.error(err?.message || `${actionText}操作失败`);
    }
  }).catch(() => {
    // 用户取消操作
  });
};

// 删除房源
const deleteHouse = async () => {
  try {
    const response = await request.delete(`/admin/houses/${houseId.value}`);
    if (response && response.code === 200) {
      ElMessage.success('房源删除成功');
      // 返回列表页
      router.push('/admin/house');
    } else {
      ElMessage.error(response?.message || '删除房源失败');
    }
  } catch (err) {
    console.error('删除房源失败:', err);
    ElMessage.error(err?.message || '删除房源失败');
  }
};

// 下架房源
const offlineHouse = async () => {
  try {
    const response = await request.post(`/admin/houses/${houseId.value}/offline`);
    if (response && response.code === 200) {
      ElMessage.success('房源下架成功');
      fetchHouseDetail(); // 刷新详情
    } else {
      ElMessage.error(response?.message || '下架房源失败');
    }
  } catch (err) {
    console.error('下架房源失败:', err);
    ElMessage.error(err?.message || '下架房源失败');
  }
};

// 上架房源
const onlineHouse = async () => {
  try {
    const response = await request.post(`/admin/houses/${houseId.value}/online`);
    if (response && response.code === 200) {
      ElMessage.success('房源上架成功');
      fetchHouseDetail(); // 刷新详情
    } else {
      ElMessage.error(response?.message || '上架房源失败');
    }
  } catch (err) {
    console.error('上架房源失败:', err);
    ElMessage.error(err?.message || '上架房源失败');
  }
};

onMounted(() => {
  fetchHouseDetail();
});
</script>

<style scoped>
.admin-house-detail {
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

.header-buttons {
  display: flex;
  gap: 10px;
}

.loading-container, .error-container {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.house-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.house-title {
  margin: 0;
  margin-right: 15px;
  font-size: 22px;
}

.house-images {
  margin-bottom: 30px;
}

.cover-image {
  width: 100%;
  height: 400px;
  margin-bottom: 10px;
  border-radius: 4px;
}

.image-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.small-image {
  width: 120px;
  height: 90px;
  flex-shrink: 0;
  border-radius: 4px;
}

.price-address {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.price {
  margin-bottom: 10px;
}

.price-value {
  font-size: 28px;
  font-weight: bold;
  color: #ff4d4f;
}

.price-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
}

.address {
  font-size: 16px;
  color: #303133;
}

.house-description {
  margin: 30px 0;
}

.house-description h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
}

.house-description p {
  margin: 0;
  white-space: pre-line;
  line-height: 1.5;
  color: #606266;
}

.reject-reason {
  margin-top: 30px;
}

.reject-reason h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
}

.approve-dialog .house-basic {
  margin-bottom: 15px;
}

.approve-dialog .house-basic div {
  margin-bottom: 8px;
}

.approve-dialog .house-basic span {
  display: inline-block;
  width: 80px;
  color: #909399;
}

.approve-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style> 