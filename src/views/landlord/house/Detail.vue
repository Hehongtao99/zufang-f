<template>
  <div class="house-detail">
    <el-card class="detail-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <h2>房源详情</h2>
          <div class="actions">
            <el-button v-if="house && house.status === 'OFFLINE'" type="primary" @click="onlineHouse" :loading="actionLoading">上架房源</el-button>
            <el-button v-if="house && (house.status === 'APPROVED' || house.status === 'ONLINE')" type="warning" @click="offlineHouse" :loading="actionLoading">下架房源</el-button>
            <el-button type="danger" @click="deleteHouse" :loading="actionLoading">删除房源</el-button>
            <el-button @click="goBack">返回列表</el-button>
          </div>
        </div>
      </template>
      
      <div v-if="house" class="detail-content">
        <div class="house-status">
          <el-tag v-if="house.status === 'PENDING'" type="warning">待审核</el-tag>
          <el-tag v-else-if="house.status === 'APPROVED'" type="success">已上架</el-tag>
          <el-tag v-else-if="house.status === 'REJECTED'" type="danger">已拒绝</el-tag>
          <el-tag v-else-if="house.status === 'RENTED'" type="info">已出租</el-tag>
          <el-tag v-else-if="house.status === 'OFFLINE'" type="info">已下架</el-tag>
          <el-tag v-else>未知状态</el-tag>
        </div>
        
        <div v-if="house.rejectReason" class="reject-reason">
          <el-alert
            type="error"
            title="拒绝原因"
            :description="house.rejectReason"
            :closable="false"
            show-icon
          />
        </div>
        
        <div class="image-carousel">
          <el-carousel :interval="4000" height="400px">
            <el-carousel-item v-for="image in house.images" :key="image">
              <el-image
                :src="getImageUrl(image)"
                fit="contain"
                style="width: 100%; height: 100%;"
              />
            </el-carousel-item>
          </el-carousel>
        </div>
        
        <div class="house-header">
          <h1 class="title">{{ house.title }}</h1>
          <div class="price">¥ {{ house.price }} / 月</div>
        </div>
        
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-descriptions :column="3" border>
          <el-descriptions-item label="面积">{{ house.area }} 平方米</el-descriptions-item>
          <el-descriptions-item label="户型">{{ house.bedroomCount }}室{{ house.livingRoomCount }}厅{{ house.bathroomCount }}卫</el-descriptions-item>
          <el-descriptions-item label="朝向">{{ house.orientation }}</el-descriptions-item>
          <el-descriptions-item label="楼层">{{ house.floor }}/{{ house.totalFloor }}层</el-descriptions-item>
          <el-descriptions-item label="装修">{{ house.decoration }}</el-descriptions-item>
          <el-descriptions-item label="电梯">{{ house.hasElevator ? '有' : '无' }}</el-descriptions-item>
          <el-descriptions-item label="停车位">{{ house.hasParking ? '有' : '无' }}</el-descriptions-item>
          <el-descriptions-item label="房源类型">{{ getHouseTypeText(house.houseType) }}</el-descriptions-item>
          <el-descriptions-item label="出租类型">{{ getRentTypeText(house.rentType) }}</el-descriptions-item>
          <el-descriptions-item label="最短租期">{{ house.minLeaseTerm || 1 }}个月</el-descriptions-item>
          <el-descriptions-item label="押金月数">{{ house.depositMonths || 1 }}个月</el-descriptions-item>
          <el-descriptions-item label="合同模板">{{ house.contractTemplateName || '默认模板' }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">地址信息</el-divider>
        
        <div class="address-info">
          <p><strong>地址：</strong>{{ house.city }}{{ house.district }}{{ house.address }}</p>
        </div>
        
        <el-divider content-position="left">详细描述</el-divider>
        
        <div class="description">
          <p>{{ house.description }}</p>
        </div>
        
        <el-divider content-position="left">发布信息</el-divider>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="发布时间">{{ formatDateTime(house.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(house.updateTime) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <el-empty v-else-if="!loading" description="房源不存在或已被删除" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const router = useRoute();
const navigation = useRouter();
const loading = ref(false);
const actionLoading = ref(false);
const house = ref(null);

// 获取房源详情
const fetchHouseDetail = async () => {
  const id = router.params.id;
  if (!id) {
    ElMessage.error('房源ID不能为空');
    navigation.push('/landlord/house/list');
    return;
  }
  
  loading.value = true;
  
  try {
    const response = await request.get(`/houses/${id}`);
    
    if (response && response.code === 200) {
      house.value = response.data;
    } else {
      ElMessage.error(response?.message || '获取房源信息失败');
    }
  } catch (err) {
    console.error('获取房源详情失败:', err);
    ElMessage.error('获取房源信息失败');
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

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// 获取房源类型文本
const getHouseTypeText = (type) => {
  switch (type) {
    case 'APARTMENT': return '公寓';
    case 'HOUSE': return '别墅';
    default: return '未知';
  }
};

// 获取出租类型文本
const getRentTypeText = (type) => {
  switch (type) {
    case 'WHOLE': return '整租';
    case 'SHARED': return '合租';
    default: return '未知';
  }
};

// 返回列表
const goBack = () => {
  navigation.push('/landlord/house/list');
};

// 上架房源
const onlineHouse = async () => {
  if (actionLoading.value) return;
  actionLoading.value = true;
  
  try {
    const response = await request.post(`/houses/online/${house.value.id}`);
    
    if (response && response.code === 200) {
      ElMessage.success('房源已上架');
      fetchHouseDetail();
    } else {
      ElMessage.error(response?.message || '操作失败');
    }
  } catch (err) {
    console.error('上架房源失败:', err);
    ElMessage.error('操作失败，请检查网络连接');
  } finally {
    actionLoading.value = false;
  }
};

// 下架房源
const offlineHouse = async () => {
  if (actionLoading.value) return;
  actionLoading.value = true;
  
  try {
    const response = await request.post(`/houses/offline/${house.value.id}`);
    
    if (response && response.code === 200) {
      ElMessage.success('房源已下架');
      fetchHouseDetail();
    } else {
      ElMessage.error(response?.message || '操作失败');
    }
  } catch (err) {
    console.error('下架房源失败:', err);
    ElMessage.error('操作失败，请检查网络连接');
  } finally {
    actionLoading.value = false;
  }
};

// 删除房源
const deleteHouse = () => {
  if (!house.value || actionLoading.value) return;
  
  ElMessageBox.confirm('确定要删除此房源吗？此操作不可恢复', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    actionLoading.value = true;
    try {
      const response = await request.delete(`/houses/${house.value.id}`);
      
      if (response && response.code === 200) {
        ElMessage.success('房源已删除');
        navigation.push('/landlord/house/list');
      } else {
        ElMessage.error(response?.message || '删除失败');
      }
    } catch (err) {
      console.error('删除房源失败:', err);
      ElMessage.error('删除失败，请检查网络连接');
    } finally {
      actionLoading.value = false;
    }
  }).catch(() => {});
};

onMounted(() => {
  fetchHouseDetail();
});
</script>

<style scoped>
.house-detail {
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

.actions {
  display: flex;
  gap: 10px;
}

.house-status {
  margin-bottom: 15px;
}

.reject-reason {
  margin-bottom: 15px;
}

.image-carousel {
  margin-bottom: 20px;
}

.house-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 22px;
  margin: 0;
}

.price {
  font-size: 24px;
  font-weight: bold;
  color: #f56c6c;
}

.address-info {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.description {
  white-space: pre-line;
  line-height: 1.6;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style> 