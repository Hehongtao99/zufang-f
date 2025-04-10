<template>
  <div class="admin-house-edit">
    <el-card class="edit-card">
      <template #header>
        <div class="card-header">
          <h2>管理员编辑房源</h2>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else-if="error" class="error-container">
        <el-alert
          title="获取房源信息失败"
          type="error"
          description="获取房源信息时发生错误，请稍后再试"
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
        <!-- 状态信息 -->
        <h3 class="form-section-title">状态信息</h3>
        <el-form-item label="房源状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已上架" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
            <el-option label="已下架" value="OFFLINE" />
            <el-option label="已出租" value="RENTED" disabled />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="form.status === 'REJECTED'" label="拒绝原因" prop="rejectReason">
          <el-input v-model="form.rejectReason" type="textarea" rows="2" placeholder="请输入拒绝原因" />
        </el-form-item>

        <!-- 房东信息 -->
        <h3 class="form-section-title">房东信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="房东ID">
              <el-input v-model="form.ownerId" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房东姓名">
              <el-input v-model="ownerName" disabled />
            </el-form-item>
          </el-col>
        </el-row>

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
            <el-form-item label="地区选择" required>
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-form-item label-width="0" prop="provinceId">
                    <el-select 
                      v-model="form.provinceId" 
                      placeholder="请选择省份" 
                      @change="handleProvinceChange" 
                      style="width: 100%"
                      clearable
                      :popper-class="'region-select-dropdown'"
                    >
                      <el-option 
                        v-for="province in provinceList" 
                        :key="province.id" 
                        :label="province.name" 
                        :value="province.id" 
                      />
                    </el-select>
                    <div v-if="form.province" class="selected-region">当前选择: {{ form.province }}</div>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label-width="0" prop="cityId">
                    <el-select 
                      v-model="form.cityId" 
                      placeholder="请选择城市" 
                      @change="handleCityChange" 
                      :disabled="!form.provinceId" 
                      style="width: 100%"
                      clearable
                      :popper-class="'region-select-dropdown'"
                    >
                      <el-option 
                        v-for="city in cityList" 
                        :key="city.id" 
                        :label="city.name" 
                        :value="city.id" 
                      />
                    </el-select>
                    <div v-if="form.city" class="selected-region">当前选择: {{ form.city }}</div>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label-width="0" prop="districtId">
                    <el-select 
                      v-model="form.districtId" 
                      placeholder="请选择区域" 
                      @change="handleDistrictChange" 
                      :disabled="!form.cityId" 
                      style="width: 100%"
                      clearable
                      :popper-class="'region-select-dropdown'"
                    >
                      <el-option 
                        v-for="district in districtList" 
                        :key="district.id" 
                        :label="district.name" 
                        :value="district.id" 
                      />
                    </el-select>
                    <div v-if="form.district" class="selected-region">当前选择: {{ form.district }}</div>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>

        <!-- 房源描述 -->
        <h3 class="form-section-title">房源描述</h3>
        <el-form-item label="房源描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="4" placeholder="请输入房源描述信息" />
        </el-form-item>

        <!-- 房源图片 -->
        <h3 class="form-section-title">房源图片</h3>
        <el-form-item label="封面图片" prop="coverImage">
          <div class="upload-container">
            <div v-if="form.coverImage" class="current-cover">
              <el-image :src="getImageUrl(form.coverImage)" class="preview-image" fit="cover" />
              <div class="cover-actions">
                <el-button type="danger" size="small" @click="removeCoverImage">移除</el-button>
              </div>
            </div>
            <el-upload
              v-else
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :limit="1"
              :on-change="handleCoverChange"
              :on-remove="handleCoverRemove"
            >
              <el-icon><Plus /></el-icon>
              <div class="el-upload__text">点击上传封面图</div>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="房源图片" prop="images">
          <div class="house-images-container">
            <div v-if="existingImages.length > 0" class="existing-images">
              <div v-for="(image, index) in existingImages" :key="index" class="image-item">
                <el-image :src="getImageUrl(image)" class="preview-image" fit="cover" />
                <div class="image-actions">
                  <el-button type="danger" size="small" icon="Delete" circle @click="removeExistingImage(index)" />
                </div>
              </div>
            </div>
            
            <el-upload
              action="#"
              list-type="picture-card"
              :auto-upload="false"
              :on-change="handleImagesChange"
              :on-remove="handleImagesRemove"
              multiple
            >
              <el-icon><Plus /></el-icon>
              <div class="el-upload__text">点击上传图片</div>
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
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const houseId = computed(() => route.params.id)

// 状态控制
const loading = ref(true)
const error = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const ownerName = ref('')

// 表单数据
const form = reactive({
  id: null,
  title: '',
  price: null,
  area: null,
  description: '',
  address: '',
  province: '',
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
  coverImage: null,
  minLeaseTerm: 1,
  depositMonths: 1,
  contractTemplateId: null,
  status: 'PENDING',
  rejectReason: '',
  ownerId: null
})

// 表单验证
const rules = reactive({
  title: [{ required: true, message: '请输入房源标题', trigger: 'blur' }],
  price: [{ required: true, message: '请输入租金', trigger: 'blur' }],
  area: [{ required: true, message: '请输入面积', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  description: [{ required: true, message: '请输入房源描述', trigger: 'blur' }],
  houseType: [{ required: true, message: '请选择房源类型', trigger: 'change' }],
  rentType: [{ required: true, message: '请选择出租类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择房源状态', trigger: 'change' }],
  rejectReason: [{ 
    required: true, 
    message: '请输入拒绝原因', 
    trigger: 'blur',
    validator: (rule, value, callback) => {
      if (form.status === 'REJECTED' && !value) {
        callback(new Error('拒绝时必须提供拒绝原因'))
      } else {
        callback()
      }
    }
  }]
})

// 图片处理
const coverFile = ref(null)
const newImageFiles = ref([])
const existingImages = ref([]) // 已有的图片
const imagesToDelete = ref([]) // 需要删除的图片

// 地址选择相关
const regionOptions = ref([]) // 级联选择器选项
const regionValue = ref([])   // 级联选择器绑定值

// 省市区列表
const provinceList = ref([])
const cityList = ref([])
const districtList = ref([])

// 获取房源信息
const fetchHouseInfo = async () => {
  loading.value = true
  error.value = false
  
  try {
    const response = await request.get(`/houses/${houseId.value}`)
    
    if (response && response.code === 200) {
      const houseData = response.data
      
      // 填充表单数据
      form.id = houseData.id
      form.title = houseData.title
      form.price = houseData.price
      form.area = houseData.area
      form.description = houseData.description
      form.address = houseData.address
      form.province = houseData.province // 设置省份名称
      form.city = houseData.city
      form.district = houseData.district
      form.provinceId = houseData.provinceId
      form.cityId = houseData.cityId
      form.districtId = houseData.districtId
      form.bedroomCount = houseData.bedroomCount
      form.livingRoomCount = houseData.livingRoomCount
      form.bathroomCount = houseData.bathroomCount
      form.orientation = houseData.orientation
      form.floor = houseData.floor
      form.totalFloor = houseData.totalFloor
      form.decoration = houseData.decoration
      form.hasElevator = houseData.hasElevator
      form.hasParking = houseData.hasParking
      form.houseType = houseData.houseType
      form.rentType = houseData.rentType
      form.minLeaseTerm = houseData.minLeaseTerm
      form.depositMonths = houseData.depositMonths
      form.contractTemplateId = houseData.contractTemplateId
      form.coverImage = houseData.coverImage
      form.status = houseData.status
      form.rejectReason = houseData.rejectReason || ''
      form.ownerId = houseData.ownerId
      
      // 设置房东姓名
      ownerName.value = houseData.ownerName || '未知'
      
      // 如果没有省份名称但有省份ID，尝试查找省份名称
      if (!form.province && form.provinceId) {
        console.log('尝试查找省份名称');
        // 在数据加载完成后设置
      }
      
      // 初始化区域选择
      initRegionValue()
      
      // 获取房源图片
      fetchHouseImages()

      // 打印当前的地址信息，方便调试  
      console.log('房源加载完成，当前地址信息:', {
        province: form.province,
        city: form.city,
        district: form.district,
        provinceId: form.provinceId,
        cityId: form.cityId,
        districtId: form.districtId
      })
    } else {
      error.value = true
      ElMessage.error(response?.message || '获取房源信息失败')
    }
  } catch (err) {
    console.error('获取房源信息失败:', err)
    error.value = true
    ElMessage.error('获取房源信息失败')
  } finally {
    loading.value = false
  }
}

// 获取地区数据 - 改为分级获取
const loadProvinces = async () => {
  try {
    const response = await request.get('/region/provinces');
    if (response.code === 200) {
      provinceList.value = response.data;
    } else {
      ElMessage.error(response.message || '获取省份失败');
    }
  } catch (err) {
    console.error('获取省份失败:', err);
    ElMessage.error('获取省份数据失败');
  }
};

const loadCities = async (provinceId) => {
  if (!provinceId) {
    cityList.value = [];
    districtList.value = [];
    form.cityId = null;
    form.districtId = null;
    form.city = ''; // 清空城市名称
    form.district = ''; // 清空区域名称
    return;
  }
  try {
    const response = await request.get(`/region/cities/${provinceId}`);
    if (response.code === 200) {
      cityList.value = response.data;
      // 更新省份名称
      const selectedProvince = provinceList.value.find(p => p.id === provinceId);
      if (selectedProvince) form.province = selectedProvince.name;
      
      // 如果之前有城市ID，但不匹配新列表，则清空
      if (form.cityId && !cityList.value.some(c => c.id === form.cityId)) {
         form.cityId = null;
         form.districtId = null;
         form.city = '';
         form.district = '';
      }
      
    } else {
      ElMessage.error(response.message || '获取城市失败');
      cityList.value = []; // 清空列表
      districtList.value = [];
    }
  } catch (err) {
    console.error('获取城市失败:', err);
    ElMessage.error('获取城市数据失败');
    cityList.value = [];
    districtList.value = [];
  }
};

const loadDistricts = async (cityId) => {
  if (!cityId) {
    districtList.value = [];
    form.districtId = null;
    form.district = ''; // 清空区域名称
    return;
  }
  try {
    const response = await request.get(`/region/districts/${cityId}`);
    if (response.code === 200) {
      districtList.value = response.data;
      // 更新城市名称
      const selectedCity = cityList.value.find(c => c.id === cityId);
      if (selectedCity) form.city = selectedCity.name;
      
      // 如果之前有区域ID，但不匹配新列表，则清空
      if (form.districtId && !districtList.value.some(d => d.id === form.districtId)) {
         form.districtId = null;
         form.district = '';
      }
      
    } else {
      ElMessage.error(response.message || '获取区域失败');
      districtList.value = []; // 清空列表
    }
  } catch (err) {
    console.error('获取区域失败:', err);
    ElMessage.error('获取区域数据失败');
    districtList.value = [];
  }
};

// 处理省市区选择变化
const handleProvinceChange = (provinceId) => {
  form.cityId = null;
  form.districtId = null;
  form.city = '';
  form.district = '';
  
  // 更新省份名称
  if (provinceId) {
    const selectedProvince = provinceList.value.find(p => p.id === provinceId);
    if (selectedProvince) {
      form.province = selectedProvince.name;
    }
  } else {
    form.province = '';
  }
  
  loadCities(provinceId);
};

const handleCityChange = (cityId) => {
  form.districtId = null;
  form.district = '';
  
  // 更新城市名称
  if (cityId) {
    const selectedCity = cityList.value.find(c => c.id === cityId);
    if (selectedCity) {
      form.city = selectedCity.name;
    }
  } else {
    form.city = '';
  }
  
  loadDistricts(cityId);
};

const handleDistrictChange = (districtId) => {
  // 更新区域名称
  if (districtId) {
    const selectedDistrict = districtList.value.find(d => d.id === districtId);
    if (selectedDistrict) {
      form.district = selectedDistrict.name;
    }
    
    // 显示选择后的完整地址在控制台，方便调试
    console.log('选择完成，当前地址:', {
      province: form.province,
      city: form.city,
      district: form.district,
      provinceId: form.provinceId,
      cityId: form.cityId,
      districtId: form.districtId
    });
  } else {
    form.district = '';
  }
};

// 初始化区域选择
const initRegionValue = async () => {
  try {
    console.log('开始初始化区域选择...');
    // 加载省份数据
    await loadProvinces();
    
    // 如果有省份ID
    if (form.provinceId) {
      console.log('加载省份城市数据:', form.provinceId);
      await loadCities(form.provinceId);
      
      // 如果有城市ID
      if (form.cityId) {
        console.log('加载城市区域数据:', form.cityId);
        await loadDistricts(form.cityId);
      }
    }
    console.log('区域选择初始化完成:', {
      provinceId: form.provinceId,
      cityId: form.cityId,
      districtId: form.districtId,
      provincesCount: provinceList.value.length,
      citiesCount: cityList.value.length,
      districtsCount: districtList.value.length
    });
  } catch (error) {
    console.error('初始化区域选择出错:', error);
    ElMessage.warning('初始化地区数据失败');
  }
}

// 初始化加载
onMounted(async () => {
  await loadProvinces(); // 先加载省份
  await fetchHouseInfo(); // 再加载房屋信息，确保省市区ID可以正确匹配
})

// 获取房源图片
const fetchHouseImages = async () => {
  try {
    const response = await request.get(`/admin/houses/${houseId.value}/images`)
    
    if (response && response.code === 200) {
      existingImages.value = response.data || []
    } else {
      ElMessage.warning('获取房源图片失败')
    }
  } catch (err) {
    console.error('获取房源图片失败:', err)
    ElMessage.warning('获取房源图片失败')
  }
}

// 处理封面图片变更
const handleCoverChange = (file) => {
  coverFile.value = file.raw
}

// 处理封面图片移除
const handleCoverRemove = () => {
  coverFile.value = null
}

// 移除当前封面图片
const removeCoverImage = () => {
  form.coverImage = null
}

// 处理图片添加
const handleImagesChange = (file) => {
  newImageFiles.value.push(file.raw)
}

// 处理图片移除
const handleImagesRemove = (file) => {
  const index = newImageFiles.value.findIndex(f => f === file.raw)
  if (index !== -1) {
    newImageFiles.value.splice(index, 1)
  }
}

// 移除已有图片
const removeExistingImage = (index) => {
  const imageUrl = existingImages.value[index]
  imagesToDelete.value.push(imageUrl)
  existingImages.value.splice(index, 1)
}

// 处理图片URL
const getImageUrl = (url) => {
  if (!url) return ''
  
  // 如果已经是完整URL（以http或https开头），则直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // 确保URL以/开头
  if (!url.startsWith('/')) {
    url = '/' + url
  }
  
  // 如果URL以/api开头，则移除/api前缀
  if (url.startsWith('/api/')) {
    url = url.substring(4)
  }
  
  // 如果是相对路径，加上API前缀
  return `/api${url}`
}

// 提交表单
const submitForm = async () => {
  formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.warning('请填写所有必填项')
      return
    }
    
    submitting.value = true
    
    try {
      // 准备表单数据
      const formData = new FormData()
      
      // 添加基本信息
      const editDTO = {
        id: form.id,
        title: form.title,
        price: form.price,
        area: form.area,
        description: form.description,
        address: form.address,
        district: form.district,
        provinceId: form.provinceId,
        cityId: form.cityId,
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
        imagesToDelete: imagesToDelete.value,
        status: form.status,
        rejectReason: form.status === 'REJECTED' ? form.rejectReason : ''
      }
      
      formData.append('data', new Blob([JSON.stringify(editDTO)], { type: 'application/json' }))
      
      // 添加封面图片
      if (coverFile.value) {
        formData.append('coverImage', coverFile.value)
      }
      
      // 添加新增图片
      newImageFiles.value.forEach(file => {
        formData.append('images', file)
      })
      
      // 发送请求
      const response = await request.post('/admin/houses/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response && response.code === 200) {
        ElMessage.success('房源信息已更新')
        // 使用 replace 而不是 push，避免浏览器历史堆栈问题
        router.replace('/admin/house').catch(err => {
          console.error('导航失败:', err)
          // 如果导航失败，尝试重新加载页面
          window.location.href = '/admin/house'
        })
      } else {
        ElMessage.error(response?.message || '更新房源失败')
      }
    } catch (err) {
      console.error('提交表单失败:', err)
      ElMessage.error('提交失败，请稍后再试')
    } finally {
      submitting.value = false
    }
  })
}

// 返回列表
const goBack = () => {
  router.push('/admin/house')
}
</script>

<style scoped>
.admin-house-edit {
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

.selected-region {
  margin-top: 5px;
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
}
</style>

<style>
/* 地区选择下拉框样式 */
.region-select-dropdown {
  min-width: 200px !important;
  max-height: 300px !important;
}

.region-select-dropdown .el-select-dropdown__list {
  padding: 8px 0;
}

.region-select-dropdown .el-select-dropdown__item {
  padding: 8px 16px;
  font-size: 14px;
  line-height: 1.5;
}

.region-select-dropdown .el-select-dropdown__item.selected {
  font-weight: bold;
  color: #409eff;
}

.region-select-dropdown .el-select-dropdown__item:hover {
  background-color: #f5f7fa;
}
</style> 