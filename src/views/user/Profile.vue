<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人资料</h2>
        </div>
      </template>
      
      <div class="profile-content">
        <!-- 左侧头像区域 -->
        <div class="avatar-section">
          <div class="avatar-container">
            <el-avatar :size="120" :src="tempAvatar || userInfo.avatar || defaultAvatar"></el-avatar>
            <div class="avatar-upload" v-if="isEditing">
              <el-upload
                class="avatar-uploader"
                action="/api/file/upload"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
                :data="{type: 'avatar'}"
              >
                <div class="upload-overlay">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <span>更换头像</span>
                </div>
              </el-upload>
            </div>
          </div>
          <p class="username">{{ userInfo.nickname || userInfo.username }}</p>
          <p class="user-role">{{ userRoleMap[userInfo.role] || '普通用户' }}</p>
        </div>
        
        <!-- 右侧信息区域 -->
        <div class="info-section">
          <div v-if="!isEditing">
            <!-- 显示模式 -->
            <div class="info-item">
              <span class="label">用户名:</span>
              <span class="value">{{ userInfo.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">昵称:</span>
              <span class="value">{{ userInfo.nickname || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">真实姓名:</span>
              <span class="value">{{ userInfo.realName || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">手机号:</span>
              <span class="value">{{ userInfo.phone || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱:</span>
              <span class="value">{{ userInfo.email || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">身份证号:</span>
              <span class="value">{{ userInfo.idCard ? maskIdCard(userInfo.idCard) : '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">个人简介:</span>
              <span class="value">{{ userInfo.description || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">注册时间:</span>
              <span class="value">{{ formatTime(userInfo.createTime) }}</span>
            </div>
            
            <div class="action-buttons">
              <el-button type="primary" @click="startEditing">编辑资料</el-button>
              <el-button @click="openChangePasswordDialog">修改密码</el-button>
            </div>
          </div>
          
          <div v-else>
            <!-- 编辑模式 -->
            <el-form 
              ref="formRef" 
              :model="userForm" 
              :rules="rules" 
              label-width="100px"
              class="user-form"
            >
              <el-form-item label="用户名" prop="username">
                <el-input v-model="userForm.username" disabled></el-input>
              </el-form-item>
              
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="userForm.nickname" placeholder="请输入昵称"></el-input>
              </el-form-item>
              
              <el-form-item label="真实姓名" prop="realName">
                <el-input v-model="userForm.realName" placeholder="请输入真实姓名"></el-input>
              </el-form-item>
              
              <el-form-item label="手机号" prop="phone">
                <el-input v-model="userForm.phone" placeholder="请输入手机号"></el-input>
              </el-form-item>
              
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
              </el-form-item>
              
              <el-form-item label="身份证号" prop="idCard">
                <el-input v-model="userForm.idCard" placeholder="请输入身份证号"></el-input>
              </el-form-item>
              
              <el-form-item label="个人简介" prop="description">
                <el-input
                  v-model="userForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入个人简介"
                  maxlength="500"
                  show-word-limit
                ></el-input>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="submitForm">保存</el-button>
                <el-button @click="cancelEditing">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
    >
      <el-form 
        ref="passwordFormRef" 
        :model="passwordForm" 
        :rules="passwordRules" 
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            placeholder="请输入原密码"
            show-password
          ></el-input>
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码"
            show-password
          ></el-input>
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
          ></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="changePassword">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { userApi } from '@/utils/api';
import { Plus } from '@element-plus/icons-vue';

// 默认头像
const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

// 用户角色映射
const userRoleMap = {
  'ADMIN': '管理员',
  'LANDLORD': '房东',
  'USER': '普通用户'
};

// 用户信息
const userInfo = ref({});
const isEditing = ref(false);
const formRef = ref(null);

// 编辑表单
const userForm = ref({
  username: '',
  nickname: '',
  realName: '',
  phone: '',
  email: '',
  idCard: '',
  avatar: '',
  description: ''
});

// 表单校验规则
const rules = {
  nickname: [
    { max: 20, message: '昵称长度不能超过20个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  idCard: [
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号码', trigger: 'blur' }
  ]
};

// 在data部分添加一个新的ref变量
const tempAvatar = ref('');

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const res = await userApi.getUserInfo();
    if (res.code === 200 && res.data) {
      userInfo.value = res.data;
    } else {
      ElMessage.error('获取用户信息失败');
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    ElMessage.error('获取用户信息失败');
  }
};

// 开始编辑
const startEditing = () => {
  userForm.value = { ...userInfo.value };
  tempAvatar.value = userInfo.value.avatar || '';
  isEditing.value = true;
};

// 取消编辑
const cancelEditing = () => {
  isEditing.value = false;
  ElMessageBox.confirm('确定要取消编辑吗？所有修改将不会保存。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '继续编辑',
    type: 'warning'
  }).then(() => {
    isEditing.value = false;
    tempAvatar.value = '';
  }).catch(() => {
    isEditing.value = true;
  });
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 确保将ID传递给后端
        const updateData = { ...userForm.value };
        if (!updateData.id) {
          updateData.id = userInfo.value.id;
        }
        
        const res = await userApi.updateUserInfo(updateData);
        if (res.code === 200) {
          ElMessage.success('保存成功');
          isEditing.value = false;
          tempAvatar.value = '';
          fetchUserInfo(); // 重新获取用户信息
        } else {
          ElMessage.error(res.msg || '保存失败');
        }
      } catch (error) {
        console.error('保存用户信息失败:', error);
        ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message || '未知错误'));
      }
    } else {
      ElMessage.warning('请正确填写表单');
      return false;
    }
  });
};

// 上传头像前的校验
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

// 上传头像成功的回调
const handleAvatarSuccess = (response) => {
  if (response.code === 200) {
    userForm.value.avatar = response.data;
    // 设置临时头像URL，立即显示
    tempAvatar.value = response.data;
    ElMessage.success('头像上传成功');
  } else {
    ElMessage.error(response.msg || '头像上传失败');
  }
};

// 上传文件的请求头
const uploadHeaders = {
  token: localStorage.getItem('token') || ''
};

// 密码修改相关
const passwordDialogVisible = ref(false);
const passwordFormRef = ref(null);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 密码校验规则
const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在6-20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
};

// 打开修改密码对话框
const openChangePasswordDialog = () => {
  passwordDialogVisible.value = true;
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
};

// 修改密码
const changePassword = async () => {
  if (!passwordFormRef.value) return;
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await userApi.changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        });
        
        if (res.code === 200) {
          ElMessage.success('密码修改成功');
          passwordDialogVisible.value = false;
        } else {
          ElMessage.error(res.msg || '密码修改失败');
        }
      } catch (error) {
        console.error('密码修改失败:', error);
        ElMessage.error('密码修改失败');
      }
    } else {
      ElMessage.warning('请正确填写表单');
      return false;
    }
  });
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 掩码身份证号
const maskIdCard = (idCard) => {
  if (!idCard) return '';
  if (idCard.length >= 18) {
    return idCard.substr(0, 6) + '********' + idCard.substr(14);
  } else if (idCard.length >= 15) {
    return idCard.substr(0, 6) + '*****' + idCard.substr(11);
  }
  return idCard;
};

onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 15px;
}

.profile-card {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.profile-content {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
}

.avatar-section {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-container {
  margin-bottom: 15px;
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-upload {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  color: white;
  border-radius: 50%;
}

.avatar-upload:hover .upload-overlay {
  opacity: 1;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.username {
  font-size: 18px;
  font-weight: bold;
  margin: 10px 0 5px;
  color: #303133;
}

.user-role {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.info-section {
  flex: 1;
  min-width: 300px;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
}

.label {
  color: #606266;
  width: 100px;
  text-align: right;
  padding-right: 12px;
}

.value {
  color: #303133;
  flex: 1;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.user-form {
  max-width: 500px;
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }
  
  .avatar-section {
    flex: 0 0 auto;
    margin-bottom: 20px;
  }
  
  .info-item {
    flex-direction: column;
  }
  
  .label {
    width: 100%;
    text-align: left;
    margin-bottom: 5px;
  }
}
</style> 