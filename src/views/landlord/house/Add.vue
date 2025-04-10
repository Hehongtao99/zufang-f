<template>
  <div class="house-add">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h2>发布新房源</h2>
        </div>
      </template>
      
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="house-form">
        <el-divider content-position="left">
          <el-tag size="large" effect="dark" type="primary">基本信息</el-tag>
        </el-divider>
        
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入房源标题" maxlength="50" show-word-limit />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            rows="5" 
            placeholder="请输入房源详细描述，如周边设施、交通状况、室内设施等" 
            maxlength="1000" 
            show-word-limit
          />
        </el-form-item>
        
        <el-divider content-position="left">
          <el-tag size="large" effect="dark" type="success">价格与条件</el-tag>
        </el-divider>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="面积(㎡)" prop="area">
              <el-input-number v-model="form.area" :min="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="月租(元)" prop="price">
              <el-input-number v-model="form.price" :min="1" :precision="2" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最短租期(月)" prop="minLeaseTerm">
              <el-input-number v-model="form.minLeaseTerm" :min="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金(月数)" prop="depositMonths">
              <el-input-number v-model="form.depositMonths" :min="1" :max="3" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="违约金比例" prop="penaltyRate">
              <el-input-number 
                v-model="form.penaltyRate" 
                :min="0" 
                :max="100" 
                :precision="2"
                controls-position="right" 
                style="width: 100%;" 
              >
                <template #suffix>%</template>
              </el-input-number>
              <div class="form-tip">提前退租时，将收取剩余租金的百分比作为违约金</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低违约金" prop="minPenalty">
              <el-input-number 
                v-model="form.minPenalty" 
                :min="0" 
                :precision="2"
                controls-position="right" 
                style="width: 100%;" 
              >
                <template #suffix>元</template>
              </el-input-number>
              <div class="form-tip">最低违约金金额，实际违约金不低于此金额</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="合同模板" prop="contractTemplateId">
          <el-select 
            v-model="form.contractTemplateId" 
            placeholder="请选择合同模板" 
            style="width: 100%;"
            @change="handleTemplateChange"
          >
            <el-option 
              v-for="item in contractTemplates" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
          <div class="template-preview" v-if="selectedTemplate">
            <span class="preview-label">模板内容预览：</span>
            <div class="template-content" v-html="templatePreview"></div>
          </div>
        </el-form-item>
        
        <el-divider content-position="left">
          <el-tag size="large" effect="dark" type="warning">位置信息</el-tag>
        </el-divider>
        
        <el-form-item label="省市区选择">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label-width="0">
                <div class="region-select-container">
                  <el-select v-model="form.provinceId" placeholder="请选择省份" @change="handleProvinceChange" style="width: 100%" ref="provinceSelect">
                    <template #prefix>
                      <el-tag v-if="form.province" class="region-tag" type="primary" closable @close="clearProvince">
                        {{ form.province }}
                      </el-tag>
                    </template>
                    <el-option
                      v-for="item in provinceList"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label-width="0">
                <div class="region-select-container">
                  <el-select v-model="form.cityId" placeholder="请选择城市" @change="handleCityChange" style="width: 100%" :disabled="!form.provinceId" ref="citySelect">
                    <template #prefix>
                      <el-tag v-if="form.city" class="region-tag" type="success" closable @close="clearCity">
                        {{ form.city }}
                      </el-tag>
                    </template>
                    <el-option
                      v-for="item in cityList"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label-width="0">
                <div class="region-select-container">
                  <el-select v-model="form.districtId" placeholder="请选择区域" @change="handleDistrictChange" style="width: 100%" :disabled="!form.cityId" ref="districtSelect">
                    <template #prefix>
                      <el-tag v-if="form.district" class="region-tag" type="warning" closable @close="clearDistrict">
                        {{ form.district }}
                      </el-tag>
                    </template>
                    <el-option
                      v-for="item in districtList"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="详细地址" prop="address">
          <el-input 
            v-model="form.address" 
            placeholder="请输入详细地址，如：xx小区xx号楼xx单元xx室" 
            type="textarea" 
            rows="2"
            maxlength="200" 
            show-word-limit
          />
        </el-form-item>
        
        <el-divider content-position="left">
          <el-tag size="large" effect="dark" type="danger">房屋信息</el-tag>
        </el-divider>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="卧室数量" prop="bedroomCount">
              <el-input-number v-model="form.bedroomCount" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客厅数量" prop="livingRoomCount">
              <el-input-number v-model="form.livingRoomCount" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="卫生间数量" prop="bathroomCount">
              <el-input-number v-model="form.bathroomCount" :min="0" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="朝向" prop="orientation">
              <el-select v-model="form.orientation" placeholder="请选择朝向" style="width: 100%;">
                <el-option label="东" value="东" />
                <el-option label="南" value="南" />
                <el-option label="西" value="西" />
                <el-option label="北" value="北" />
                <el-option label="东南" value="东南" />
                <el-option label="东北" value="东北" />
                <el-option label="西南" value="西南" />
                <el-option label="西北" value="西北" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="楼层" prop="floor">
              <el-input-number v-model="form.floor" :min="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总楼层" prop="totalFloor">
              <el-input-number v-model="form.totalFloor" :min="1" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="装修情况" prop="decoration">
          <el-select v-model="form.decoration" placeholder="请选择装修情况" style="width: 100%;">
            <el-option label="精装修" value="精装修" />
            <el-option label="简装修" value="简装修" />
            <el-option label="毛坯" value="毛坯" />
          </el-select>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否有电梯" prop="hasElevator">
              <el-switch v-model="form.hasElevator" active-text="有" inactive-text="无" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否有停车位" prop="hasParking">
              <el-switch v-model="form.hasParking" active-text="有" inactive-text="无" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="房源类型" prop="houseType">
              <el-select v-model="form.houseType" placeholder="请选择房源类型" style="width: 100%;">
                <el-option label="公寓" value="APARTMENT" />
                <el-option label="别墅" value="HOUSE" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出租类型" prop="rentType">
              <el-select v-model="form.rentType" placeholder="请选择出租类型" style="width: 100%;">
                <el-option label="整租" value="WHOLE" />
                <el-option label="合租" value="SHARED" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">
          <el-tag size="large" effect="dark" type="info">房源图片</el-tag>
        </el-divider>
        
        <el-form-item label="封面图片" prop="coverImageFile">
          <el-upload
            class="cover-uploader"
            action="#"
            :http-request="uploadCoverImage"
            :show-file-list="false"
            :before-upload="beforeImageUpload"
          >
            <img v-if="coverImageUrl" :src="coverImageUrl" class="cover-image" />
            <el-icon v-else class="cover-uploader-icon"><plus /></el-icon>
          </el-upload>
          <div class="upload-tip">请上传房源封面图片（必选）</div>
        </el-form-item>
        
        <el-form-item label="房源图片" prop="imageFiles">
          <el-upload
            class="image-uploader"
            action="#"
            :http-request="uploadHouseImage"
            :before-upload="beforeImageUpload"
            list-type="picture-card"
            :limit="9"
            multiple
          >
            <el-icon><plus /></el-icon>
          </el-upload>
          <div class="upload-tip">可上传多张房源图片（最多9张）</div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" size="large" @click="submitForm" :loading="submitting" class="submit-button">发布房源</el-button>
          <el-button size="large" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getContractTemplates, getContractTemplate, getAllContractTemplates } from '@/api/contract'
import { publishHouse } from '@/api/house'
import { getUserInfo, updateUserInfo } from '@/api/user'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const coverImageUrl = ref('')
const houseImages = ref([])
const contractTemplates = ref([])
const selectedTemplate = ref(null)
const templatePreview = ref('')
const provinceList = ref([])
const cityList = ref([])
const districtList = ref([])
const provinceSelect = ref(null)
const citySelect = ref(null)
const districtSelect = ref(null)
const hasFormChanged = ref(false)

// 表单数据
const form = reactive({
  title: '',
  description: '',
  area: 0,
  price: 0,
  address: '',
  province: '',
  city: '',
  district: '',
  districtId: null,
  provinceId: null,
  cityId: null,
  bedroomCount: 1,
  livingRoomCount: 1,
  bathroomCount: 1,
  orientation: '',
  floor: null,
  totalFloor: null,
  decoration: '',
  hasElevator: false,
  hasParking: false,
  houseType: 'APARTMENT',
  rentType: 'WHOLE',
  coverImageFile: null,
  imageFiles: [],
  minLeaseTerm: 12,
  depositMonths: 1,
  penaltyRate: 30,
  minPenalty: 1000,
  contractTemplateId: null
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' }
  ],
  area: [
    { required: true, message: '请输入面积', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入月租价格', trigger: 'blur' }
  ],
  provinceId: [
    { required: true, message: '请选择省份', trigger: 'change' }
  ],
  cityId: [
    { required: true, message: '请选择城市', trigger: 'change' }
  ],
  city: [
    { required: true, message: '城市不能为空', trigger: 'change' }
  ],
  districtId: [
    { required: true, message: '请选择区域', trigger: 'change' }
  ],
  district: [
    { required: true, message: '区域不能为空', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ],
  bedroomCount: [
    { required: true, message: '请输入卧室数量', trigger: 'blur' }
  ],
  livingRoomCount: [
    { required: true, message: '请输入客厅数量', trigger: 'blur' }
  ],
  bathroomCount: [
    { required: true, message: '请输入卫生间数量', trigger: 'blur' }
  ],
  houseType: [
    { required: true, message: '请选择房源类型', trigger: 'change' }
  ],
  rentType: [
    { required: true, message: '请选择出租类型', trigger: 'change' }
  ],
  contractTemplateId: [
    { required: true, message: '请选择合同模板', trigger: 'change' }
  ],
  minLeaseTerm: [
    { required: true, message: '请输入最短租期', trigger: 'blur' }
  ],
  depositMonths: [
    { required: true, message: '请输入押金月数', trigger: 'blur' }
  ],
  penaltyRate: [
    { required: true, message: '请输入违约金比例', trigger: 'blur' }
  ],
  minPenalty: [
    { required: true, message: '请输入最低违约金', trigger: 'blur' }
  ]
}

// 获取合同模板列表
const fetchContractTemplates = async () => {
  try {
    console.log('正在获取合同模板列表...');
    console.log('请求URL: /api/contract-templates/all');
    
    // 尝试使用公共API获取合同模板
    const res = await getAllContractTemplates();
    
    if (res && res.code === 200 && res.data) {
      console.log('成功获取合同模板:', res.data);
      contractTemplates.value = res.data;
    } else {
      console.warn('通过API获取合同模板失败，使用测试数据');
      console.log('API返回结果:', res);
      
      // 使用默认测试数据
      contractTemplates.value = [
        {
          id: 1,
          name: '标准住房租赁合同',
          content: '<h1>标准住房租赁合同</h1><p>这是一份标准的租赁合同模板...</p>'
        },
        {
          id: 2,
          name: '商铺租赁合同',
          content: '<h1>商铺租赁合同</h1><p>这是一份商铺租赁合同模板...</p>'
        }
      ];
    }
    
    // 检查结果
    if (contractTemplates.value.length === 0) {
      ElMessage.warning('未找到任何合同模板，请联系管理员添加模板');
    } else {
      console.log(`成功加载了${contractTemplates.value.length}个合同模板`);
    }
  } catch (error) {
    console.error('获取合同模板出错:', error);
    console.error('错误详情:', error.response ? error.response.data : '无响应数据');
    ElMessage.error('获取合同模板失败，使用默认测试数据');
    
    // 使用默认测试数据
    contractTemplates.value = [
      {
        id: 1,
        name: '标准住房租赁合同',
        content: '<h1>标准住房租赁合同</h1><p>这是一份标准的租赁合同模板...</p>'
      },
      {
        id: 2,
        name: '商铺租赁合同',
        content: '<h1>商铺租赁合同</h1><p>这是一份商铺租赁合同模板...</p>'
      }
    ];
  }
};

// 处理合同模板变更
const handleTemplateChange = async (templateId) => {
  if (!templateId) {
    selectedTemplate.value = null;
    templatePreview.value = '';
    return;
  }
  
  try {
    console.log('获取合同模板详情:', templateId);
    const res = await getContractTemplate(templateId);
    if (res && res.code === 200 && res.data) {
      console.log('成功获取模板详情:', res.data);
      selectedTemplate.value = res.data;
      
      // 替换变量占位符并保存模板内容
      let content = res.data.content;
      // 正则表达式匹配${...}形式的变量占位符
      content = content.replace(/\$\{([^}]+)\}/g, 'xxx');
      templatePreview.value = content;
    } else {
      // 如果API请求失败，尝试从已加载的模板列表中查找
      console.warn('API请求模板详情失败，从本地列表查找');
      const template = contractTemplates.value.find(t => t.id === templateId);
      if (template) {
        console.log('在本地列表找到模板:', template);
        selectedTemplate.value = template;
        
        // 替换变量占位符并保存模板内容
        let content = template.content;
        // 正则表达式匹配${...}形式的变量占位符
        content = content.replace(/\$\{([^}]+)\}/g, 'xxx');
        templatePreview.value = content;
      } else {
        ElMessage.error('无法获取合同模板详情');
      }
    }
  } catch (error) {
    console.error('获取合同模板详情出错:', error);
    ElMessage.error('获取合同模板详情失败');
  }
};

// 上传前校验
const beforeImageUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('上传图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 上传封面图片
const uploadCoverImage = async (options) => {
  const file = options.file
  form.coverImageFile = file
  
  // 本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    coverImageUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// 上传房源图片
const uploadHouseImage = async (options) => {
  const file = options.file
  form.imageFiles = [...(form.imageFiles || []), file]
  
  // 本地预览
  const reader = new FileReader()
  reader.onload = (e) => {
    houseImages.value.push({
      url: e.target.result
    })
  }
  reader.readAsDataURL(file)
}

// 判断表单是否有内容
const hasFormContent = () => {
  return (
    form.title !== '' || 
    form.description !== '' || 
    form.area !== 0 || 
    form.price !== 0 || 
    form.address !== '' || 
    form.provinceId !== null || 
    form.cityId !== null || 
    form.districtId !== null ||
    form.coverImageFile !== null || 
    (form.imageFiles && form.imageFiles.length > 0)
  );
};

// 重置表单时清除草稿
const resetForm = () => {
  if (!formRef.value) return;
  
  ElMessageBox.confirm('确定要重置表单吗？这将清除所有已填写的内容和草稿', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    formRef.value.resetFields();
    coverImageUrl.value = '';
    houseImages.value = [];
    form.coverImageFile = null;
    form.imageFiles = [];
    selectedTemplate.value = null;
    templatePreview.value = '';
    ElMessage.success('表单已重置，草稿已清除');
  }).catch(() => {});
};

// 修改提交表单函数
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!form.coverImageFile) {
        ElMessage.error('请上传封面图片');
        if (coverImageUrl.value) {
          ElMessage.warning('您有封面图片预览，但需要重新上传图片文件才能提交');
        }
        return;
      }
      
      if (houseImages.value.length > 0 && (!form.imageFiles || form.imageFiles.length === 0)) {
        ElMessage.warning('您有房源图片预览，但需要重新上传图片文件才能提交');
        return;
      }
      
      submitting.value = true;
      try {
        // 确保city字段有值
        if (!form.city && form.cityId) {
          const selectedCity = cityList.value.find(city => city.id === form.cityId);
          if (selectedCity) {
            form.city = selectedCity.name;
            console.log('设置city值:', form.city, '通过cityId:', form.cityId);
          } else {
            console.error('未找到对应城市信息，cityId:', form.cityId);
            ElMessage.error('请选择城市');
            submitting.value = false;
            return;
          }
        }
        
        if (!form.city) {
          console.error('city字段仍然为空');
          ElMessage.error('城市信息不能为空');
          submitting.value = false;
          return;
        }
        
        // 创建FormData对象
        const formData = new FormData();
        
        // 创建包含所有文本字段的对象
        const publishDTO = {};
        Object.keys(form).forEach(key => {
          if (key !== 'coverImageFile' && key !== 'imageFiles') {
            publishDTO[key] = form[key];
          }
        });
        
        // 打印准备提交的数据
        console.log('准备提交的数据:', JSON.stringify(publishDTO, null, 2));
        
        // 将对象转为JSON并添加到FormData中
        formData.append('data', new Blob([JSON.stringify(publishDTO)], { type: 'application/json' }));
        
        // 添加图片文件
        if (form.coverImageFile) {
          console.log('添加封面图片:', form.coverImageFile.name);
          formData.append('coverImage', form.coverImageFile);
        }
        
        if (form.imageFiles && form.imageFiles.length > 0) {
          console.log('添加房源图片数量:', form.imageFiles.length);
          form.imageFiles.forEach(file => {
            formData.append('images', file);
          });
        }
        
        // 检查FormData中的内容
        console.log('FormData内容检查:');
        let formDataLog = [];
        for (const pair of formData.entries()) {
          const value = pair[1] instanceof File 
            ? `File: ${pair[1].name} (${Math.round(pair[1].size / 1024)}KB)` 
            : pair[1];
          formDataLog.push(`${pair[0]}: ${value}`);
        }
        console.log(formDataLog.join('\n'));
        
        // 发布房源
        const result = await publishHouse(formData);
        
        if (result && result.code === 200) {
          ElMessage.success('房源发布成功，等待管理员审核');
          router.push('/landlord/house/list');
        } else {
          ElMessage.error(result?.message || '发布失败，请检查网络连接');
        }
      } catch (error) {
        console.error('发布房源出错:', error);
        ElMessage.error(error?.message || '发布失败，请稍后重试');
      } finally {
        submitting.value = false;
      }
    } else {
      ElMessage.error('请完善表单信息');
    }
  });
};

// 添加省市区处理函数
const loadProvinces = async () => {
  try {
    const response = await request({
      url: '/region/provinces',
      method: 'get'
    });
    if (response && response.code === 200) {
      provinceList.value = response.data;
    } else {
      ElMessage.error(response?.message || '获取省份列表失败');
    }
  } catch (error) {
    console.error('获取省份列表失败:', error);
    ElMessage.error('获取省份列表失败');
  }
};

const loadCities = async (provinceId) => {
  if (!provinceId) {
    cityList.value = [];
    districtList.value = [];
    form.cityId = null;
    form.districtId = null;
    form.city = '';
    form.district = '';
    return;
  }
  
  try {
    const response = await request({
      url: `/region/cities/${provinceId}`,
      method: 'get'
    });
    if (response && response.code === 200) {
      cityList.value = response.data;
      
      // 由于provinceId改变，检查省份名称是否需要更新
      const selectedProvince = provinceList.value.find(province => province.id === provinceId);
      if (selectedProvince) {
        console.log('更新省份名称:', selectedProvince.name);
        form.province = selectedProvince.name;
      }
    } else {
      ElMessage.error(response?.message || '获取城市列表失败');
    }
  } catch (error) {
    console.error('获取城市列表失败:', error);
    ElMessage.error('获取城市列表失败');
  }
};

const loadDistricts = async (cityId) => {
  if (!cityId) {
    districtList.value = [];
    form.districtId = null;
    form.district = '';
    return;
  }
  
  try {
    const response = await request({
      url: `/region/districts/${cityId}`,
      method: 'get'
    });
    if (response && response.code === 200) {
      districtList.value = response.data;
      
      // 更新城市名称
      const selectedCity = cityList.value.find(city => city.id === cityId);
      if (selectedCity) {
        console.log('更新城市名称:', selectedCity.name);
        form.city = selectedCity.name;
      }
    } else {
      ElMessage.error(response?.message || '获取区域列表失败');
    }
  } catch (error) {
    console.error('获取区域列表失败:', error);
    ElMessage.error('获取区域列表失败');
  }
};

const handleProvinceChange = (provinceId) => {
  form.cityId = null;
  form.districtId = null;
  form.city = '';
  form.district = '';
  
  // 更新省份名称
  if (provinceId) {
    const selectedProvince = provinceList.value.find(province => province.id === provinceId);
    if (selectedProvince) {
      console.log('选择省份:', selectedProvince.name);
      form.province = selectedProvince.name;
    }
  } else {
    form.province = '';
  }
  
  loadCities(provinceId).then(() => {
    // 加载城市列表后，自动聚焦到城市选择框
    if (provinceId && citySelect.value) {
      setTimeout(() => {
        citySelect.value.focus();
      }, 100);
    }
  });
};

const handleCityChange = (cityId) => {
  form.districtId = null;
  form.district = '';
  
  if (cityId) {
    const selectedCity = cityList.value.find(city => city.id === cityId);
    if (selectedCity) {
      console.log('选择城市:', selectedCity.name);
      form.city = selectedCity.name;
    }
  } else {
    form.city = '';
  }
  
  loadDistricts(cityId).then(() => {
    // 加载区域列表后，自动聚焦到区域选择框
    if (cityId && districtSelect.value) {
      setTimeout(() => {
        districtSelect.value.focus();
      }, 100);
    }
  });
};

const handleDistrictChange = (districtId) => {
  if (districtId) {
    const selectedDistrict = districtList.value.find(district => district.id === districtId);
    if (selectedDistrict) {
      console.log('选择区域:', selectedDistrict.name);
      form.district = selectedDistrict.name;
    }
  } else {
    form.district = '';
  }
};

// 清除省份选择
const clearProvince = () => {
  form.provinceId = null;
  form.cityId = null;
  form.districtId = null;
  form.province = '';
  form.city = '';
  form.district = '';
  cityList.value = [];
  districtList.value = [];
};

// 清除城市选择
const clearCity = () => {
  form.cityId = null;
  form.districtId = null;
  form.city = '';
  form.district = '';
  districtList.value = [];
};

// 清除区域选择
const clearDistrict = () => {
  form.districtId = null;
  form.district = '';
};

// 离开页面前提醒
const beforeUnload = (e) => {
  if (hasFormChanged.value) {
    // 显示浏览器默认的"离开此页面"对话框
    e.preventDefault()
    e.returnValue = ''
  }
}

// 添加检查用户资料的逻辑
const checkUserProfile = async () => {
  try {
    const res = await getUserInfo()
    if (res && res.code === 200 && res.data) {
      const user = res.data
      
      // 检查是否缺少真实姓名或身份证号
      if (!user.realName || !user.idCard) {
        ElMessageBox.confirm(
          '发布房源需要完善真实姓名和身份证号信息，为了保障您和租客的权益，请先完善您的个人资料',
          '个人资料不完整',
          {
            confirmButtonText: '前往完善',
            cancelButtonText: '取消',
            type: 'warning',
            closeOnClickModal: false,
            callback: (action) => {
              if (action === 'confirm') {
                router.push('/landlord/profile')
              } else {
                router.push('/landlord/house/list')
              }
            }
          }
        )
      }
    }
  } catch (error) {
    console.error('检查个人资料失败:', error)
  }
}

// 监听页面关闭
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
  
  // 获取地区和合同模板数据
  loadProvinces()
  fetchContractTemplates()
  checkUserProfile()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload)
})

// 处理路由离开
const handleRouteLeave = (to, from, next) => {
  if (hasFormChanged.value) {
    ElMessageBox.confirm('表单尚未保存，确定要离开吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      next()
    }).catch(() => {
      next(false)
    })
  } else {
    next()
  }
}

// 返回
const goBack = () => {
  if (hasFormChanged.value) {
    ElMessageBox.confirm('您编辑的内容未发布，确定要离开吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.back()
    }).catch(() => {
      // 用户取消，留在当前页面
    })
  } else {
    router.back()
  }
}
</script>

<style scoped>
.house-add {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.form-card {
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.house-form {
  margin-top: 20px;
}

.el-divider {
  margin: 30px 0;
}

.cover-uploader {
  display: block;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
  width: 280px;
  height: 200px;
}

.cover-uploader:hover {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 280px;
  height: 200px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cover-image {
  width: 280px;
  height: 200px;
  display: block;
  object-fit: cover;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.template-preview {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f5f7fa;
}

.preview-label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.template-content {
  font-size: 12px;
  color: #606266;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-line;
  padding: 8px;
  background-color: white;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  line-height: 1.4;
}

.template-content :deep(h1) {
  font-size: 16px;
  margin: 10px 0;
}

.template-content :deep(h2) {
  font-size: 14px;
  margin: 8px 0;
}

.template-content :deep(p) {
  margin: 4px 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.submit-button {
  min-width: 120px;
}

:deep(.el-form-item__label) {
  font-weight: bold;
}

:deep(.el-input__wrapper) {
  border-radius: 4px;
}

:deep(.el-textarea__inner) {
  border-radius: 4px;
}

:deep(.el-select) {
  width: 100%;
}

.region-select-container {
  width: 100%;
}

.region-tag {
  margin-right: 6px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.region-select-container .el-select {
  width: 100%;
}

.region-select-container .el-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-input-focus-border-color) inset;
}
</style> 