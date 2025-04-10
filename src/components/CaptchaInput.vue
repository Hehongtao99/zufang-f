<template>
  <div class="captcha-container">
    <el-form-item prop="captcha">
      <el-input 
        v-model="captchaValue" 
        placeholder="请输入验证码"
        @input="handleInput"
        maxlength="4"
      >
        <template #prefix>
          <el-icon><Key /></el-icon>
        </template>
      </el-input>
    </el-form-item>
    <div class="captcha-image" @click="refreshCaptcha">
      <canvas ref="captchaCanvas" width="120" height="40"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Key } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'captcha-change'])

const captchaValue = ref(props.modelValue)
const captchaCanvas = ref(null)
const captchaText = ref('')

// 生成随机验证码
const generateCaptcha = () => {
  const canvas = captchaCanvas.value
  const ctx = canvas.getContext('2d')
  
  // 清空画布
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 生成4位随机数字
  let code = ''
  for (let i = 0; i < 4; i++) {
    const num = Math.floor(Math.random() * 10)
    code += num
    
    // 随机字体大小和颜色
    const fontSize = Math.random() * 10 + 20
    ctx.font = fontSize + 'px Arial'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = `rgb(${Math.random() * 100}, ${Math.random() * 100}, ${Math.random() * 100})`
    
    // 随机旋转角度
    const rotation = (Math.random() - 0.5) * 0.3
    ctx.save()
    ctx.translate(30 * i + 15, 20)
    ctx.rotate(rotation)
    ctx.fillText(num.toString(), 0, 0)
    ctx.restore()
  }
  
  // 添加干扰线
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgb(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200})`
    ctx.beginPath()
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
    ctx.stroke()
  }
  
  // 添加干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgb(${Math.random() * 200}, ${Math.random() * 200}, ${Math.random() * 200})`
    ctx.beginPath()
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI)
    ctx.fill()
  }
  
  captchaText.value = code
  // 将验证码保存到 localStorage
  localStorage.setItem('captchaCode', code)
}

// 刷新验证码
const refreshCaptcha = () => {
  generateCaptcha()
}

// 处理输入
const handleInput = (value) => {
  emit('update:modelValue', value)
}

// 验证验证码
const validateCaptcha = (value) => {
  const storedCode = localStorage.getItem('captchaCode')
  return storedCode && value === storedCode
}

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  captchaValue.value = newValue
})

// 组件挂载时生成验证码
onMounted(() => {
  generateCaptcha()
})

// 暴露方法给父组件
defineExpose({
  refreshCaptcha,
  validateCaptcha
})
</script>

<style scoped>
.captcha-container {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.captcha-container :deep(.el-form-item) {
  flex: 1;
  margin-bottom: 0;
}

.captcha-image {
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.captcha-image canvas {
  display: block;
}
</style> 