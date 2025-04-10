<template>
  <div class="house-edit">
    <el-card class="edit-card">
      <template #header>
        <div class="card-header">
          <h2>编辑房源</h2>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="error" class="error-container">
        <el-alert
          title="获取房源信息失败"
          type="error"
          description="获取房源信息时发生错误，请稍后再试或联系管理员"
          closable
          show-icon
        />
        <div class="error-actions">
          <el-button type="primary" @click="goBack">返回列表</el-button>
          <el-button @click="fetchHouseInfo">重试加载</el-button>
        </div>
      </div>

      <el-form 
        v-else
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="edit-form"
      >
        <!-- 基本信息 -->
        <h3 class="form-section-title">基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="房源标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入房源标题" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="租金" prop="price">
              <el-input-number v-model="form.price" :min="1" :precision="2" placeholder="月租金" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面积" prop="area">
              <el-input-number v-model="form.area" :min="1" :precision="0" placeholder="平方米" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最短租期" prop="minLeaseTerm">
              <el-input-number v-model="form.minLeaseTerm" :min="1" :precision="0" placeholder="月" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金月数" prop="depositMonths">
              <el-input-number v-model="form.depositMonths" :min="1" :precision="0" placeholder="月" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="房源类型" prop="houseType">
              <el-select v-model="form.houseType" placeholder="请选择" style="width: 100%">
                <el-option label="公寓" value="APARTMENT" />
                <el-option label="别墅" value="HOUSE" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出租类型" prop="rentType">
              <el-select v-model="form.rentType" placeholder="请选择" style="width: 100%">
                <el-option label="整租" value="WHOLE" />
                <el-option label="合租" value="SHARED" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="房屋信息" prop="houseType">
              <el-input v-model="form.houseType" placeholder="请输入房屋信息" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 房屋信息 -->
        <h3 class="form-section-title">房屋信息</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="卧室数量" prop="bedroomCount">
              <el-input-number v-model="form.bedroomCount" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客厅数量" prop="livingRoomCount">
              <el-input-number v-model="form.livingRoomCount" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="卫生间数量" prop="bathroomCount">
              <el-input-number v-model="form.bathroomCount" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="朝向" prop="orientation">
              <el-select v-model="form.orientation" placeholder="请选择" style="width: 100%">
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
            <el-form-item label="所在楼层" prop="floor">
              <el-input-number v-model="form.floor" :min="1" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总楼层" prop="totalFloor">
              <el-input-number v-model="form.totalFloor" :min="1" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="装修情况" prop="decoration">
              <el-select v-model="form.decoration" placeholder="请选择" style="width: 100%">
                <el-option label="精装修" value="精装修" />
                <el-option label="简装修" value="简装修" />
                <el-option label="中等装修" value="中等装修" />
                <el-option label="毛坯" value="毛坯" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设施" prop="facilities">
              <div class="facilities-container">
                <el-checkbox v-model="form.hasElevator" label="电梯" />
                <el-checkbox v-model="form.hasParking" label="停车位" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 地址信息 -->
        <h3 class="form-section-title">地址信息</h3>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="所在地区" prop="provinceId">
              <div style="display: flex; gap: 10px;">
                <el-select 
                  v-model="form.provinceId" 
                  :key="provinceKey" 
                  class="region-selector province-selector" 
                  placeholder="请选择省份" 
                  style="width: 120px"
                  filterable 
                  @change="handleProvinceChange"
                >
                  <el-option
                    v-for="item in provinceList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
                <el-select 
                  v-model="form.cityId" 
                  :key="cityKey" 
                  class="region-selector city-selector"
                  placeholder="请选择城市" 
                  style="width: 120px" 
                  filterable
                  @change="handleCityChange"
                >
                  <el-option
                    v-for="item in cityList"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                  />
                </el-select>
                <el-select 
                  v-model="form.districtId" 
                  :key="districtKey" 
                  class="region-selector district-selector"
                  placeholder="请选择区域" 
                  style="width: 120px" 
                  filterable
                >
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
        
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>

        <!-- 合同模板 -->
        <h3 class="form-section-title">合同设置</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最短租期" prop="minLeaseTerm">
              <el-input-number v-model="form.minLeaseTerm" :min="1" :precision="0" placeholder="月" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="押金月数" prop="depositMonths">
              <el-input-number v-model="form.depositMonths" :min="1" :precision="0" placeholder="月" style="width: 100%" />
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
        
        <!-- 房源描述 -->
        <h3 class="form-section-title">房源描述</h3>
        <el-form-item label="房源描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入房源描述信息" />
        </el-form-item>

        <!-- 封面图片上传 -->
        <el-form-item label="封面图片">
          <el-upload
            :action="uploadActionUrl" 
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="1"
            :file-list="coverFileList" 
            :on-success="handleCoverUploadSuccess"
            :on-error="handleUploadError"
            :on-remove="handleCoverRemove"
            :before-upload="beforeImageUpload"
            :on-change="handleCoverChange" 
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">只能上传一张封面图片，大小不超过2MB</div>
            </template>
            <template #file="{ file }" v-if="!coverFile && form.coverImage">
               <!-- 显示已有的封面图片 -->
               <img class="el-upload-list__item-thumbnail" :src="getImageUrl(form.coverImage)" alt="封面图片" />
               <span class="el-upload-list__item-actions">
                 <span class="el-upload-list__item-delete" @click="removeCoverImage">
                   <el-icon><Delete /></el-icon>
                 </span>
               </span>
             </template>
          </el-upload>
        </el-form-item>

        <!-- 其他房源图片 -->
        <el-form-item label="房源图片">
          <div class="image-list-container">
            <!-- 显示已存在的非封面图片 -->
            <div v-for="(imgUrl, index) in existingImages" :key="`existing-${index}`" class="image-item">
              <el-image
                  style="width: 100px; height: 100px"
                  :src="getImageUrl(imgUrl)"
                  fit="cover"
                  :preview-src-list="[getImageUrl(imgUrl)]"
                  preview-teleported
               />
              <div class="image-actions">
                <el-tooltip content="设为封面" placement="top">
                  <el-button type="primary" :icon="ArrowUp" circle size="small" @click="setExistingImageAsCover(index)"></el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" :icon="Delete" circle size="small" @click="removeExistingImage(index)"></el-button>
                </el-tooltip>
              </div>
            </div>
            
            <!-- 图片上传组件 -->
            <el-upload
              :action="uploadActionUrl"
              :headers="uploadHeaders"
              list-type="picture-card"
              multiple
              :file-list="otherImageFileList" 
              :on-success="handleOtherImagesUploadSuccess"
              :on-error="handleUploadError"
              :on-remove="handleImagesRemove"
              :before-upload="beforeImageUpload"
              :on-change="handleImagesChange" 
            >
              <el-icon><Plus /></el-icon>
              <template #tip>
                <div class="el-upload__tip">可上传多张房源图片，单张大小不超过2MB</div>
              </template>
            </el-upload>
          </div>
        </el-form-item>

        <!-- 按钮操作 -->
        <div class="form-actions">
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">保存修改</el-button>
        </div>
      </el-form>
    </el-card>
  </div>

  <!-- 图片预览对话框 -->
  <el-dialog v-model="previewVisible" title="图片预览">
    <img :src="previewImage" alt="Preview" style="width: 100%;" />
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Warning, Delete, Top, ArrowUp } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { getContractTemplates, getContractTemplate, getAllContractTemplates } from '@/api/contract'

const route = useRoute()
const router = useRouter()
const houseId = ref(route.params.id)

// 状态控制
const loading = ref(true)
const error = ref(false)
const submitting = ref(false)
const formRef = ref()
const coverFile = ref(null)
const existingImages = ref([])
const newImageFiles = ref([])
const imagesToDelete = ref([])
const provinceList = ref([])
const cityList = ref([])
const districtList = ref([])
const isInitialLoad = ref(true)
const areaSelectorsKey = ref(0)
const previewVisible = ref(false)
const previewImage = ref('')
const coverFileList = ref([])
const otherImageFileList = ref([])

// 合同模板相关
const contractTemplates = ref([])
const selectedTemplate = ref(null)
const templatePreview = ref('')

// 为选择器生成唯一key
const provinceKey = computed(() => `province-${areaSelectorsKey.value}`)
const cityKey = computed(() => `city-${areaSelectorsKey.value}`)
const districtKey = computed(() => `district-${areaSelectorsKey.value}`)

// 计算新图片的预览URL
const newImageFilesPreviews = computed(() => {
  return newImageFiles.value.map(file => {
    if (file._preview) return file._preview
    const preview = URL.createObjectURL(file)
    // 在文件对象上添加预览URL以便重用
    file._preview = preview
    return preview
  })
})

// 获取省份数据
const loadProvinces = async () => {
  try {
    const response = await request.get('/region/provinces')
    if (response && response.code === 200) {
      provinceList.value = response.data
      console.log('省份数据加载成功，数量:', provinceList.value.length)
    } else {
      console.error('获取省份数据失败:', response)
      ElMessage.error('获取省份数据失败')
    }
  } catch (error) {
    console.error('获取省份数据异常:', error)
    ElMessage.error('获取省份数据失败')
  }
}

// 表单数据
const form = reactive({
  id: '',
  title: '',
  price: 0,
  area: 0,
  description: '',
  address: '',
  city: '',
  district: '',
  provinceId: null,
  cityId: null,
  districtId: null,
  bedroomCount: 1,
  livingRoomCount: 1,
  bathroomCount: 1,
  orientation: '',
  floor: 1,
  totalFloor: 1,
  decoration: '',
  hasElevator: false,
  hasParking: false,
  houseType: 'APARTMENT',
  rentType: 'WHOLE',
  minLeaseTerm: 12,
  depositMonths: 1,
  contractTemplateId: null,
  coverImage: null
})

// 表单验证
const rules = reactive({
  title: [{ required: true, message: '请输入房源标题', trigger: 'blur' }],
  price: [{ required: true, message: '请输入租金', trigger: 'blur' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  description: [{ required: true, message: '请输入房源描述', trigger: 'blur' }],
  houseType: [{ required: true, message: '请选择房源类型', trigger: 'change' }],
  rentType: [{ required: true, message: '请选择出租类型', trigger: 'change' }]
})

// 获取区域数据
const fetchRegions = async () => {
  try {
    const response = await request.get('/region/provinces')
    if (response && response.code === 200) {
      provinceList.value = response.data
    } else {
      console.error('获取省份数据失败:', response)
    }
  } catch (error) {
    console.error('获取区域数据失败:', error)
  }
}

// 加载城市数据
const loadCities = async (provinceId) => {
  if (!provinceId) return
  
  try {
    const response = await request.get(`/region/cities/${provinceId}`)
    if (response && response.code === 200) {
      cityList.value = response.data
      
      // 更新省份名称
      const selectedProvince = provinceList.value.find(province => province.id === provinceId)
      if (selectedProvince) {
        form.province = selectedProvince.name
      }
    }
  } catch (error) {
    console.error('获取城市数据失败:', error)
  }
}

// 加载区域数据
const loadDistricts = async (cityId) => {
  if (!cityId) return
  
  try {
    const response = await request.get(`/region/districts/${cityId}`)
    if (response && response.code === 200) {
      districtList.value = response.data
      
      // 更新城市名称
      const selectedCity = cityList.value.find(city => city.id === cityId)
      if (selectedCity) {
        form.city = selectedCity.name
      }
    }
  } catch (error) {
    console.error('获取区域数据失败:', error)
  }
}

// 处理省份变更
const handleProvinceChange = (provinceId) => {
  console.log('省份变更:', provinceId, 'isInitialLoad:', isInitialLoad.value)
  
  // 只有在初始加载完成后才清空城市和区域数据
  if (!isInitialLoad.value) {
    form.cityId = null
    form.districtId = null
    form.city = ''
    form.district = ''
    cityList.value = []
    districtList.value = []
  }
  
  if (provinceId) {
    loadCities(provinceId)
  }
}

// 处理城市变更
const handleCityChange = (cityId) => {
  console.log('城市变更:', cityId, 'isInitialLoad:', isInitialLoad.value)
  
  // 只有在初始加载完成后才清空区域数据
  if (!isInitialLoad.value) {
    form.districtId = null
    form.district = ''
    districtList.value = []
  }
  
  if (cityId) {
    loadDistricts(cityId)
  }
}

// 处理区域变更
const handleDistrictChange = (districtId) => {
  if (districtId) {
    const selectedDistrict = districtList.value.find(district => district.id === districtId)
    if (selectedDistrict) {
      form.district = selectedDistrict.name
    }
  } else {
    form.district = ''
  }
}

// 强制刷新地区选择器(简化版)
const forceRefreshRegionSelectors = async () => {
  console.log('开始强制刷新地区选择器...')
  
  // 保存当前的ID值
  const savedProvinceId = form.provinceId
  const savedCityId = form.cityId
  const savedDistrictId = form.districtId
  
  try {
    // 清空所有选择器的值
    form.provinceId = null
    form.cityId = null
    form.districtId = null
    
    // 等待DOM更新
    await nextTick()
    
    // 重新设置值并触发加载
    if (savedProvinceId) {
      form.provinceId = savedProvinceId
      await nextTick()
      await loadCities(savedProvinceId)
      
      if (savedCityId) {
        form.cityId = savedCityId
        await nextTick()
        await loadDistricts(savedCityId)
        
        if (savedDistrictId) {
          form.districtId = savedDistrictId
          await nextTick()
        }
      }
    }
    
    console.log('地区选择器刷新完成', { 
      provinceId: form.provinceId, 
      cityId: form.cityId, 
      districtId: form.districtId,
      provinceList: provinceList.value.length,
      cityList: cityList.value.length,
      districtList: districtList.value.length
    })
    
    // 强制重新渲染选择器组件
    // 在顶层Vue组件中使用key属性，可以强制组件重新渲染
    areaSelectorsKey.value = Date.now()
  } catch (error) {
    console.error('刷新地区选择器时出错:', error)
  }
}

// 获取房源信息
const fetchHouseInfo = async () => {
  try {
    loading.value = true;
    const houseId = route.params.id;
    console.log('获取房源信息，ID:', houseId);
    const response = await request.get(`/house/info/${houseId}`);
    console.log('获取到的房源数据:', response);
    
    if (response.code === 200 && response.data) {
      const houseData = response.data;
      
      // 填充表单基础信息
      Object.assign(form, houseData);
      
      // 确保布尔值正确转换
      form.hasElevator = Boolean(form.hasElevator);
      form.hasParking = Boolean(form.hasParking);
      
      // 单独处理图片
      form.coverImage = houseData.coverImage || null;
      
      // 过滤掉封面图片，得到其他图片列表
      existingImages.value = (houseData.images || [])
          .filter(url => url && url !== houseData.coverImage);
          
      console.log('封面图片URL:', form.coverImage);
      console.log('其他现有图片URLs:', existingImages.value);
      
      // 验证图片是否存在 (封面和现有图片)
      const allImagesToValidate = [];
      if (form.coverImage) {
        allImagesToValidate.push(form.coverImage);
      }
      allImagesToValidate.push(...existingImages.value);
      
      if (allImagesToValidate.length > 0) {
        setTimeout(() => {
          validateSpecificImages(allImagesToValidate);
        }, 500);
      }
      
      // 初始化封面图片的显示
      if (form.coverImage) {
        coverFileList.value = [{
          name: form.coverImage.split('/').pop() || 'cover',
          url: getImageUrl(form.coverImage)
        }];
      }
      
      // 如果有合同模板ID，加载模板详情
      if (form.contractTemplateId) {
        setTimeout(() => {
          handleTemplateChange(form.contractTemplateId);
        }, 500);
      }
      
      // 加载区域数据等其他逻辑...
      await loadProvinces();
      if (form.provinceId > 0) {
        await loadCities(form.provinceId);
        if (form.cityId > 0) {
          await loadDistricts(form.cityId);
        }
      }
      
      // 标记初始化完成
      isInitialLoad.value = false;
      
    } else {
      console.error('获取房源信息失败:', response.message);
      ElMessage.error(`获取房源信息失败: ${response.message || '未知错误'}`);
      error.value = true;
    }
  } catch (error) {
    console.error('获取房源信息发生异常:', error);
    ElMessage.error('获取房源信息失败，请稍后重试');
    error.value = true;
  } finally {
    loading.value = false;
  }
}

// 验证指定的图片列表是否存在
const validateSpecificImages = async (urlsToValidate) => {
  console.log('开始验证指定图片是否存在...', urlsToValidate);
  if (!urlsToValidate || urlsToValidate.length === 0) {
    console.log('没有图片需要验证');
    return;
  }

  try {
    // 对每个URL做处理，使用文件名从本地检查
    const validationResults = await Promise.all(
      urlsToValidate.map(async (imageUrl) => {
        if (!imageUrl) return { url: imageUrl, exists: false };
        try {
          // 提取文件名
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          // 检查文件是否存在
          const checkUrl = `/file/check?fileName=${encodeURIComponent(fileName)}`;
          console.log('发送文件检查请求:', checkUrl);
          
          const response = await request.get(checkUrl);
          console.log('文件检查响应:', response);
          
          return { url: imageUrl, exists: response.code === 200 && response.data };
        } catch (error) {
          console.error('验证图片时出错:', imageUrl, error);
          return { url: imageUrl, exists: false };
        }
      })
    );
    
    console.log('图片验证结果:', validationResults);
    
    // 处理验证结果
    const invalidImages = validationResults.filter(r => !r.exists).map(r => r.url);
    if (invalidImages.length > 0) {
      console.warn('以下图片不存在，将从显示中移除:', invalidImages);
      ElMessage.warning(`${invalidImages.length}张图片无效或已被删除`);
      
      // 如果封面图片无效，清除它
      if (form.coverImage && invalidImages.includes(form.coverImage)) {
        console.log('封面图片无效，清除:', form.coverImage);
        form.coverImage = null;
      }
      
      // 从现有图片列表中移除无效图片
      existingImages.value = existingImages.value.filter(url => 
        !invalidImages.includes(url)
      );
      console.log('更新后的现有图片列表:', existingImages.value);
    }
  } catch (error) {
    console.error('图片验证过程中发生错误:', error);
    ElMessage.error('验证图片状态时出错');
  }
};

// 移除当前封面图片
const removeCoverImage = () => {
  if (form.coverImage) {
    // 不直接添加到imagesToDelete，因为封面变更由form.coverImage控制
    // 后端会根据最终的form.coverImage来更新is_cover状态
    console.log('移除封面图片显示，URL:', form.coverImage);
    form.coverImage = null; 
    // 清空封面文件上传组件的状态 (如果需要)
    coverFile.value = null;
  }
}

// 将现有图片设置为封面
const setExistingImageAsCover = (index) => {
  const imageUrl = existingImages.value[index];
  if (imageUrl) {
    // 先清空旧的封面（如果有旧的封面，将其添加到普通图片列表中）
    if (form.coverImage && !existingImages.value.includes(form.coverImage)) {
      existingImages.value.push(form.coverImage);
    }
    
    // 1. 将当前图片URL设置为新的封面URL
    form.coverImage = imageUrl;
    
    // 2. 从现有图片列表中移除该图片 (因为它现在是封面了)
    existingImages.value.splice(index, 1);
    
    // 3. 如果之前有封面文件待上传，清空它
    coverFile.value = null;
    
    // 4. 更新封面显示
    coverFileList.value = [{
      name: imageUrl.split('/').pop() || 'cover',
      url: getImageUrl(imageUrl)
    }];
    
    console.log('已将现有图片设为封面:', imageUrl);
    ElMessage.success('已设置为封面图片');
  }
}

// 移除现有非封面图片
const removeExistingImage = (index) => {
  const imageUrl = existingImages.value[index];
  if (imageUrl) {
    imagesToDelete.value.push(imageUrl);
    existingImages.value.splice(index, 1);
    console.log('已将现有图片加入删除列表:', imageUrl);
  }
}

// 处理封面图片变更
const handleCoverChange = (file, fileList) => {
  console.log("封面文件变化:", file, fileList);
  if (file.status === 'ready') {
    coverFile.value = file.raw;
    coverFileList.value = fileList;
  } else if (file.status === 'fail') {
    // 上传失败时 el-upload 会自动处理列表移除，但我们可能需要额外清理 coverFile
    coverFile.value = null;
  } else if (file.status === 'success'){
     // 成功逻辑在 handleCoverUploadSuccess 中处理
  }
}

// 处理封面图片移除
const handleCoverRemove = (file, fileList) => {
  console.log('移除封面上传文件:', file);
  form.coverImage = null; // 清空表单中的封面URL
  coverFile.value = null;
  coverFileList.value = [];
}

// 处理图片添加
const handleImagesChange = (file, fileList) => {
   console.log("其他图片文件变化:", file, fileList);
   if (file.status === 'ready') {
     // 这里可以更新 newImageFiles 或其他跟踪列表
     // 如果不需要立即跟踪原始文件，可以只依赖 on-success 回调
     // newImageFiles.value.push(file.raw);
   } 
   // 更新 otherImageFileList 以反映 UI 状态
   otherImageFileList.value = fileList;
}

// 处理图片移除
const handleImagesRemove = (file, fileList) => {
   console.log('移除其他上传文件:', file);
   otherImageFileList.value = fileList; // 更新显示列表
   // 从 newImageFiles 中移除对应的原始文件 (如果还在使用它)
   const index = newImageFiles.value.findIndex(f => f.uid === file.uid || (f.name === file.name && f.size === file.size));
   if (index !== -1) {
     newImageFiles.value.splice(index, 1);
     console.log('从待上传列表中移除文件');
   }
   // 如果使用 uploadedImageUrls，也从中移除
   // const urlIndex = uploadedImageUrls.value.findIndex(url => ...);
   // if (urlIndex !== -1) uploadedImageUrls.value.splice(urlIndex, 1);
}

// 处理图片URL
const getImageUrl = (url) => {
  if (!url) return '';
  
  console.log('原始图片URL:', url);
  
  // 如果已经是完整URL（以http或https开头），直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('使用原始完整URL:', url);
    return url;
  }
  
  try {
    // 处理相对路径情况
    let imageName = url;
    
    // 移除开头的斜杠
    if (url.startsWith('/')) {
      imageName = url.substring(1);
    }
    
    // 如果包含路径分隔符，提取文件名
    if (url.includes('/')) {
      // 提取最后一部分作为文件名
      const parts = url.split('/');
      imageName = parts[parts.length - 1];
    }
    
    // 构建访问URL
    const imageUrl = `/api/file/download/${imageName}`;
    console.log('处理后的图片URL:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('处理图片URL出错:', error, url);
    return url; // 出错时返回原始URL
  }
}

// 提交表单
const submitForm = async () => {
  try {
    formRef.value.validate(async (valid) => {
      if (!valid) {
        ElMessage.warning('请填写所有必填项');
        return;
      }
      
      loading.value = true;
      console.log('提交表单数据:', form);
      
      // 准备表单数据
      const formData = new FormData();
      
      // 添加基本信息
      const editDTO = {
        id: form.id,
        title: form.title,
        price: form.price,
        area: form.area,
        description: form.description,
        address: form.address,
        city: form.city,
        district: form.district,
        provinceId: form.provinceId,
        cityId: form.cityId,
        districtId: form.districtId,
        bedroomCount: form.bedroomCount,
        livingRoomCount: form.livingRoomCount,
        bathroomCount: form.bathroomCount,
        orientation: form.orientation,
        floor: form.floor,
        totalFloor: form.totalFloor,
        decoration: form.decoration,
        hasElevator: form.hasElevator,
        hasParking: form.hasParking,
        houseType: form.houseType,
        rentType: form.rentType,
        minLeaseTerm: form.minLeaseTerm,
        depositMonths: form.depositMonths,
        contractTemplateId: form.contractTemplateId,
        coverImage: form.coverImage,
        imagesToDelete: imagesToDelete.value
      };
      
      // 确保省市区ID为数字类型
      editDTO.provinceId = Number(editDTO.provinceId);
      editDTO.cityId = Number(editDTO.cityId);
      editDTO.districtId = Number(editDTO.districtId);
      
      // 打印准备提交的数据
      console.log('准备提交的数据:', JSON.stringify(editDTO, null, 2));
      
      formData.append('data', new Blob([JSON.stringify(editDTO)], { type: 'application/json' }));
      
      // 添加封面图片
      if (coverFile.value) {
        console.log('添加封面图片:', coverFile.value.name);
        formData.append('coverImage', coverFile.value);
      }
      
      // 添加新增图片
      console.log(`准备添加 ${newImageFiles.value.length} 张新图片到表单`);
      newImageFiles.value.forEach((file, index) => {
        if (file) {
          console.log(`添加图片 ${index + 1}:`, file.name);
          formData.append('images', file);
        }
      });
      
      // 发送请求
      const response = await request.post('/house/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response && response.code === 200) {
        ElMessage.success('房源信息已更新');
        router.push('/landlord/house/list');
      } else {
        ElMessage.error(response?.message || '更新房源失败');
      }
    });
  } catch (error) {
    console.error('提交表单出错:', error);
    ElMessage.error('提交失败，请检查网络连接并重试');
  } finally {
    loading.value = false;
  }
}

// 返回列表
const goBack = () => {
  // 检查是否有未保存的更改
  const hasChanges = coverFile.value || newImageFiles.value.length > 0 || imagesToDelete.value.length > 0;
  
  if (hasChanges) {
    ElMessageBox.confirm('您有未保存的更改，确定要返回吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      router.replace('/landlord/house/list');
    }).catch(() => {
      // 用户取消，不执行任何操作
    });
  } else {
    router.replace('/landlord/house/list');
  }
}

// 图片预览
const handlePreview = (file) => {
  previewImage.value = file.url || (file.raw && URL.createObjectURL(file.raw))
  previewVisible.value = true
}

// 图片加载错误处理函数
const handleImageError = (index) => {
  console.warn(`图片加载失败，索引: ${index}, URL: ${existingImages.value[index]}`);
  
  // 将错误图片标记为需要删除
  if (existingImages.value[index] && !imagesToDelete.value.includes(existingImages.value[index])) {
    console.log(`将失效图片添加到删除列表: ${existingImages.value[index]}`);
    imagesToDelete.value.push(existingImages.value[index]);
  }
}

// 初始化
onMounted(async () => {
  await fetchContractTemplates();
  await fetchHouseInfo();
})

// 处理图片上传成功
const handleUploadSuccess = (response, file, fileList) => {
  console.log('文件上传成功:', response, file);
  
  if (response.code === 0 && response.data) {
    // 添加到上传图片列表
    uploadedImages.value.push(response.data);
    console.log('更新后的已上传图片列表:', uploadedImages.value);
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(`上传失败: ${response.msg || '未知错误'}`);
  }
}

// 处理图片上传失败
const handleUploadError = (error, file, fileList) => {
  console.error('文件上传失败:', error, file);
  ElMessage.error('图片上传失败，请重试');
}

// 删除已上传图片
const removeImage = (index, imageType) => {
  try {
    if (imageType === 'existing') {
      // 从已有图片列表中删除
      const removedImage = existingImages.value.splice(index, 1)[0];
      console.log('已删除现有图片:', removedImage, '剩余图片:', existingImages.value);
    } else if (imageType === 'uploaded') {
      // 从新上传图片列表中删除
      const removedImage = uploadedImages.value.splice(index, 1)[0];
      console.log('已删除新上传图片:', removedImage, '剩余新上传图片:', uploadedImages.value);
    }
  } catch (error) {
    console.error('删除图片时出错:', error);
    ElMessage.error('删除图片失败');
  }
}

const uploadActionUrl = computed(() => '/api/file/upload');
const uploadHeaders = computed(() => ({
  token: localStorage.getItem('token') || ''
}));

// 封面上传成功处理
const handleCoverUploadSuccess = (response, file, fileList) => {
  console.log('封面上传成功:', response);
  if (response.code === 200 && response.data) {
    form.coverImage = response.data; // 更新表单中的封面URL
    coverFile.value = null; // 清除待上传文件
    coverFileList.value = [{ name: file.name, url: getImageUrl(response.data) }]; // 更新文件列表用于显示
    ElMessage.success('封面图片上传成功');
  } else {
    coverFileList.value = coverFileList.value.filter(f => f.uid !== file.uid);
    ElMessage.error(`封面上传失败: ${response.message || '未知错误'}`);
  }
}

// 其他图片上传成功处理
const handleOtherImagesUploadSuccess = (response, file, fileList) => {
  console.log('其他图片上传成功:', response);
  if (response.code === 200 && response.data) {
    // 注意：这里不直接修改existingImages，因为上传成功的是新图片
    // 提交时，后端会合并现有和新增的图片
    // 我们只需要更新上传列表用于显示
    otherImageFileList.value = fileList;
    
    // 添加到newImageFiles，如果还需要跟踪原始文件
    // 或者直接记录上传成功的URL，便于后续表单提交
    if (!newImageFiles.value.some(f => f.name === file.name && f.size === file.size)) {
      console.log('添加新上传的图片文件到列表:', file.name);
      file.uploadedUrl = response.data; // 保存上传后的URL到文件对象
      newImageFiles.value.push(file.raw || file);
    }
    
    ElMessage.success('图片上传成功');
  } else {
    // 从上传列表中移除失败的文件
    otherImageFileList.value = fileList.filter(f => f.uid !== file.uid);
    ElMessage.error(`图片上传失败: ${response.message || '未知错误'}`);
  }
}

// 文件上传前的校验
const beforeImageUpload = (file) => {
  const isLt2M = file.size / 1024 / 1024 < 2;
  const isImage = file.type.startsWith('image/');
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!');
    return false;
  }
  
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!');
    return false;
  }
  
  return true;
}

// 获取合同模板列表
const fetchContractTemplates = async () => {
  try {
    console.log('开始获取合同模板列表');
    const res = await getAllContractTemplates();
    if (res && res.code === 200 && res.data) {
      console.log('成功获取合同模板列表:', res.data);
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
</script>

<style scoped>
.house-edit {
  padding: 20px;
}

.edit-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-section-title {
  margin-top: 20px;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
  color: #409eff;
}

.facilities-container {
  display: flex;
  gap: 20px;
}

.upload-container {
  display: flex;
  align-items: center;
}

.current-cover {
  position: relative;
  margin-right: 20px;
}

.preview-image {
  width: 146px;
  height: 146px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #eee;
}

.cover-actions {
  position: absolute;
  bottom: 5px;
  left: 0;
  right: 0;
  text-align: center;
}

.house-images-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.existing-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-item {
  position: relative;
  margin-right: 8px;
  margin-bottom: 8px;
}

.image-actions {
  position: absolute;
  top: 5px;
  right: 5px;
}

.form-actions {
  margin-top: 30px;
  text-align: right;
}

.loading-container {
  padding: 20px;
}

.error-container {
  padding: 20px;
}

.error-actions {
  margin-top: 20px;
  text-align: center;
}

.new-images-info {
  margin-top: 10px;
  background-color: #f0f9eb;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e1f3d8;
  width: 100%;
}

.new-images-info p {
  margin: 0;
  color: #67c23a;
  font-size: 14px;
}

.image-error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #f56c6c;
  font-size: 14px;
}

.image-error .el-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.image-item-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 2px 5px;
  font-size: 12px;
  text-align: center;
}

.image-upload-status {
  margin-top: 10px;
}

.status-warning {
  color: #e6a23c;
  margin-left: 5px;
}

.status-success {
  color: #67c23a;
}

.new-images-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.preview-item {
  position: relative;
  margin-right: 8px;
  margin-bottom: 8px;
}

.image-list-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-item {
  position: relative;
  margin-right: 8px;
  margin-bottom: 8px;
}

.image-actions {
  position: absolute;
  top: 5px;
  right: 5px;
}

.template-preview {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f8f8f8;
}

.preview-label {
  font-weight: bold;
  margin-bottom: 10px;
  display: block;
}

.template-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  line-height: 1.4;
  font-size: 12px;
  color: #606266;
}

.template-content :deep(h1), .template-content :deep(h2) {
  color: #303133;
  margin-top: 8px;
  margin-bottom: 10px;
  font-size: 16px;
}

.template-content :deep(h2) {
  font-size: 14px;
}

.template-content :deep(p) {
  margin-bottom: 4px;
  line-height: 1.5;
}
</style> 