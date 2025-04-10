<template>
  <div class="system-container">
    <h1>系统设置</h1>
    <el-card class="setting-card">
      <el-form :model="systemSettings" label-width="120px">
        <el-form-item label="系统名称">
          <el-input v-model="systemSettings.systemName" placeholder="请输入系统名称" />
        </el-form-item>
        
        <el-form-item label="系统描述">
          <el-input v-model="systemSettings.systemDescription" 
                   type="textarea" 
                   :rows="3" 
                   placeholder="请输入系统描述" />
        </el-form-item>
        
        <el-form-item label="联系电话">
          <el-input v-model="systemSettings.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        
        <el-form-item label="联系邮箱">
          <el-input v-model="systemSettings.contactEmail" placeholder="请输入联系邮箱" />
        </el-form-item>
        
        <el-form-item label="备案信息">
          <el-input v-model="systemSettings.icp" placeholder="请输入备案信息" />
        </el-form-item>
        
        <el-form-item label="系统Logo">
          <el-upload
            class="avatar-uploader"
            action="/upload"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
            :on-success="handleAvatarSuccess">
            <img v-if="systemSettings.logoUrl" :src="systemSettings.logoUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        
        <el-divider content-position="center">功能开关</el-divider>
        
        <el-form-item label="开启合同签署">
          <el-switch v-model="featureToggles.contractEnabled" />
        </el-form-item>
        
        <el-form-item label="开启在线支付">
          <el-switch v-model="featureToggles.paymentEnabled" />
        </el-form-item>
        
        <el-form-item label="开启消息通知">
          <el-switch v-model="featureToggles.notificationEnabled" />
        </el-form-item>
        
        <el-divider content-position="center">系统任务</el-divider>
        
        <el-form-item label="自动退租检查">
          <div class="task-action">
            <span class="task-description">检查到期的租约，自动处理退租和押金退还流程</span>
            <el-button type="primary" :loading="autoTerminateLoading" @click="handleAutoTerminate">立即执行</el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="自动退租设置">
          <el-switch v-model="featureToggles.autoTerminateEnabled" />
          <span class="setting-hint">启用后系统会每天自动检查到期的租约并处理退租</span>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { triggerAutoTerminate } from '@/api/order';

const systemSettings = ref({
  systemName: '租房系统',
  systemDescription: '一个现代化的租房管理平台',
  contactPhone: '400-123-4567',
  contactEmail: 'support@zufang.com',
  icp: '京ICP备12345678号',
  logoUrl: '',
  version: '1.0.0'
});

const featureToggles = ref({
  contractEnabled: true,
  paymentEnabled: true,
  notificationEnabled: true,
  autoTerminateEnabled: false
});

const autoTerminateLoading = ref(false);

// 加载系统设置
const loadSettings = async () => {
  // 模拟从API获取数据
  console.log('加载系统设置');
  // 实际项目中应该从API获取数据
  // const response = await request.get('/admin/system/settings');
  // if (response.code === 200) {
  //   systemSettings.value = response.data;
  // }
};

// 保存系统设置
const saveSettings = () => {
  // 模拟保存数据
  console.log('保存系统设置', systemSettings.value, featureToggles.value);
  ElMessage.success('设置保存成功');
  // 实际项目中应该调用API保存数据
  // const response = await request.post('/admin/system/settings', {
  //   ...systemSettings.value,
  //   featureToggles: featureToggles.value
  // });
  // if (response.code === 200) {
  //   ElMessage.success('设置保存成功');
  // }
};

// 重置表单
const resetForm = () => {
  loadSettings();
  ElMessage.info('表单已重置');
};

// 上传Logo前的验证
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('上传头像图片只能是图片格式!');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!');
    return false;
  }
  return true;
};

// 上传成功后的处理
const handleAvatarSuccess = (response) => {
  systemSettings.value.logoUrl = response.data.url;
  ElMessage.success('Logo上传成功');
};

// 触发自动退租检查
const handleAutoTerminate = async () => {
  autoTerminateLoading.value = true;
  try {
    const res = await triggerAutoTerminate();
    if (res.code === 200) {
      ElMessage.success(`自动退租检查成功，共处理 ${res.data || 0} 个到期租约`);
    } else {
      ElMessage.error(res.message || '自动退租检查失败');
    }
  } catch (error) {
    console.error('自动退租检查失败:', error);
    ElMessage.error('自动退租检查失败: ' + error.message);
  } finally {
    autoTerminateLoading.value = false;
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.system-container {
  padding: 20px;
}

.setting-card {
  margin-bottom: 20px;
}

.task-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-description {
  color: #606266;
  font-size: 14px;
}

.setting-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.avatar-uploader {
  width: 178px;
  height: 178px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  line-height: 178px;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style> 