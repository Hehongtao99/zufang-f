<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-title">
        <h2>租房系统</h2>
        <p>欢迎注册</p>
      </div>
      
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入邮箱">
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="role">
          <el-select v-model="registerForm.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="普通用户" value="USER"></el-option>
            <el-option label="房东" value="LANDLORD"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号">
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <CaptchaInput v-model="registerForm.captcha" ref="captchaRef" />
        
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="register" style="width: 100%">注册</el-button>
        </el-form-item>
        
        <div class="register-options">
          <router-link to="/login">已有账号？去登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { userApi } from '@/utils/api'
import { User, Lock, Phone, Message } from '@element-plus/icons-vue'
import CaptchaInput from '@/components/CaptchaInput.vue'

const router = useRouter()

// 注册表单
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: '',
  phone: '',
  captcha: ''
})

// 表单校验规则
const registerRules = {
  username: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6-20个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!captchaRef.value?.validateCaptcha(value)) {
          callback(new Error('验证码错误'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 表单ref
const registerFormRef = ref(null)
const captchaRef = ref(null)

// 加载状态
const loading = ref(false)

// 注册方法
const register = () => {
  // 表单校验
  registerFormRef.value?.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 调用注册接口
        const registerData = {
          username: registerForm.username,
          password: registerForm.password,
          role: registerForm.role,
          phone: registerForm.phone
        }
        await userApi.register(registerData)
        
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (error) {
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.register-container {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #3494e6, #ec6ead);
}

.register-box {
  width: 400px;
  padding: 30px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
}

.register-title h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 10px;
}

.register-title p {
  font-size: 14px;
  color: #909399;
}

.register-options {
  display: flex;
  justify-content: flex-end;
  font-size: 14px;
  margin-top: 10px;
}

.register-options a {
  color: #409eff;
}
</style> 