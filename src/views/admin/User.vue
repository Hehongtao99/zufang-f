<template>
  <div class="user-page">
    <h2>用户管理</h2>
    
    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索用户名/姓名/手机号"
        clearable
        @keyup.enter="search"
      >
        <template #append>
          <el-button @click="search">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
      
      <el-select v-model="roleFilter" placeholder="角色" clearable @change="search">
        <el-option label="全部" value="" />
        <el-option label="普通用户" value="USER" />
        <el-option label="房东" value="LANDLORD" />
        <el-option label="管理员" value="ADMIN" />
      </el-select>
      
      <el-select v-model="statusFilter" placeholder="状态" clearable @change="search">
        <el-option label="全部" value="" />
        <el-option label="正常" value="ACTIVE" />
        <el-option label="已禁用" value="DISABLED" />
      </el-select>
      
      <el-button type="primary" @click="showAddUserDialog">新增用户</el-button>
    </div>
    
    <el-table :data="userList" style="width: 100%" v-loading="loading" border>
      <el-table-column type="index" width="50" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="realName" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="email" label="邮箱" min-width="180" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.role === 'ADMIN'" type="danger">管理员</el-tag>
          <el-tag v-else-if="scope.row.role === 'LANDLORD'" type="warning">房东</el-tag>
          <el-tag v-else type="info">用户</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 'ACTIVE'" type="success">正常</el-tag>
          <el-tag v-else type="danger">禁用</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="editUser(scope.row)">编辑</el-button>
          <el-button link type="primary" @click="resetPassword(scope.row)">重置密码</el-button>
          <el-button 
            link 
            :type="scope.row.status === 'ACTIVE' ? 'danger' : 'success'"
            @click="toggleUserStatus(scope.row)"
          >
            {{ scope.row.status === 'ACTIVE' ? '禁用' : '启用' }}
          </el-button>
          <el-button link type="danger" @click="deleteUser(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form :model="userForm" :rules="rules" ref="userFormRef" label-width="80px">
        <el-form-item label="邮箱" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入邮箱" :disabled="isEdit">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="普通用户" value="USER" />
            <el-option label="房东" value="LANDLORD" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="ACTIVE">正常</el-radio>
            <el-radio label="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUser">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordVisible"
      title="重置密码"
      width="400px"
    >
      <el-form :model="resetPasswordForm" :rules="resetPasswordRules" ref="resetFormRef" label-width="100px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPasswordForm.password" type="password" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordVisible = false">取消</el-button>
          <el-button type="primary" @click="submitResetPassword">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Message } from '@element-plus/icons-vue';
import request from '@/utils/request';

// 状态变量
const loading = ref(false);
const userList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const dialogVisible = ref(false);
const isEdit = ref(false);
const resetPasswordVisible = ref(false);
const userFormRef = ref(null);
const resetFormRef = ref(null);
const currentUserId = ref(null);

// 用户表单
const userForm = reactive({
  username: '',
  nickname: '',
  realName: '',
  phone: '',
  role: 'USER',
  status: 'ACTIVE',
  password: ''
});

// 重置密码表单
const resetPasswordForm = reactive({
  password: '',
  confirmPassword: ''
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ]
};

const resetPasswordRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true;
  try {
    const res = await request({
      url: '/admin/users',
      method: 'get',
      params: {
        page: currentPage.value,
        size: pageSize.value,
        query: searchQuery.value || undefined,
        role: roleFilter.value || undefined,
        status: statusFilter.value || undefined
      }
    });
    
    if (res.code === 200) {
      userList.value = res.data.records;
      total.value = res.data.total;
    } else {
      ElMessage.error(res.message || '获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

// 搜索
const search = () => {
  currentPage.value = 1;
  fetchUsers();
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchUsers();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchUsers();
};

// 新增用户
const showAddUserDialog = () => {
  isEdit.value = false;
  Object.assign(userForm, {
    username: '',
    nickname: '',
    realName: '',
    phone: '',
    role: 'USER',
    status: 'ACTIVE',
    password: ''
  });
  dialogVisible.value = true;
};

// 编辑用户
const editUser = (user) => {
  isEdit.value = true;
  currentUserId.value = user.id;
  Object.assign(userForm, {
    username: user.username,
    nickname: user.nickname,
    realName: user.realName,
    phone: user.phone,
    role: user.role,
    status: user.status
  });
  dialogVisible.value = true;
};

// 保存用户
const saveUser = async () => {
  userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const url = isEdit.value ? `/admin/users/${currentUserId.value}` : '/admin/users';
        const method = isEdit.value ? 'put' : 'post';
        
        const res = await request({
          url,
          method,
          data: userForm
        });
        
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '更新用户成功' : '添加用户成功');
          dialogVisible.value = false;
          fetchUsers();
        } else {
          ElMessage.error(res.message || (isEdit.value ? '更新用户失败' : '添加用户失败'));
        }
      } catch (error) {
        console.error(isEdit.value ? '更新用户失败:' : '添加用户失败:', error);
        ElMessage.error(isEdit.value ? '更新用户失败' : '添加用户失败');
      }
    }
  });
};

// 重置密码
const resetPassword = (user) => {
  currentUserId.value = user.id;
  resetPasswordForm.password = '';
  resetPasswordForm.confirmPassword = '';
  resetPasswordVisible.value = true;
};

const submitResetPassword = async () => {
  resetFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await request({
          url: `/admin/users/${currentUserId.value}/reset-password`,
          method: 'post',
          data: {
            password: resetPasswordForm.password
          }
        });
        
        if (res.code === 200) {
          ElMessage.success('重置密码成功');
          resetPasswordVisible.value = false;
        } else {
          ElMessage.error(res.message || '重置密码失败');
        }
      } catch (error) {
        console.error('重置密码失败:', error);
        ElMessage.error('重置密码失败');
      }
    }
  });
};

// 切换用户状态
const toggleUserStatus = async (user) => {
  const action = user.status === 'ACTIVE' ? '禁用' : '启用';
  const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
  
  ElMessageBox.confirm(`确定要${action}该用户吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request({
        url: `/admin/users/${user.id}/status`,
        method: 'put',
        data: {
          status: newStatus
        }
      });
      
      if (res.code === 200) {
        ElMessage.success(`${action}用户成功`);
        // 更新本地状态
        user.status = newStatus;
      } else {
        ElMessage.error(res.message || `${action}用户失败`);
      }
    } catch (error) {
      console.error(`${action}用户失败:`, error);
      ElMessage.error(`${action}用户失败`);
    }
  }).catch(() => {});
};

// 删除用户
const deleteUser = (user) => {
  ElMessageBox.confirm('删除用户后不可恢复，确定要删除吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request({
        url: `/admin/users/${user.id}`,
        method: 'delete'
      });
      
      if (res.code === 200) {
        ElMessage.success('删除用户成功');
        fetchUsers();
      } else {
        ElMessage.error(res.message || '删除用户失败');
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      ElMessage.error('删除用户失败');
    }
  }).catch(() => {});
};

// 格式化日期时间
const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return '';
  return dateTimeStr;
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-page {
  padding: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.el-input {
  max-width: 300px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style> 