<template>
  <div class="house-search">
    <el-card class="search-card">
      <template #header>
        <div class="card-header">
          <h2>房源查询</h2>
        </div>
      </template>
      
      <el-form :model="searchForm" label-width="80px" class="search-form" @submit.prevent="searchHouses">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="关键词">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="标题或地址关键词"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="地区选择">
              <el-select 
                v-model="searchForm.provinceId" 
                placeholder="选择省份"
                clearable
                @change="handleProvinceChange"
                style="width: 100%;"
              >
                <el-option 
                  v-for="item in provinceList" 
                  :key="item.id" 
                  :label="item.name" 
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="城市">
              <el-select 
                v-model="searchForm.cityId" 
                placeholder="选择城市"
                clearable
                @change="handleCityChange"
                :disabled="!searchForm.provinceId"
                style="width: 100%;"
              >
                <el-option 
                  v-for="item in cityList" 
                  :key="item.id" 
                  :label="item.name" 
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="区域">
              <el-select 
                v-model="searchForm.districtId" 
                placeholder="选择区域"
                clearable
                @change="handleDistrictChange"
                :disabled="!searchForm.cityId"
                style="width: 100%;"
              >
                <el-option 
                  v-for="item in districtList" 
                  :key="item.id" 
                  :label="item.name" 
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="房型">
              <el-select 
                v-model="searchForm.bedroomCount" 
                placeholder="选择卧室数量"
                clearable
                style="width: 100%;"
              >
                <el-option label="一室" :value="1" />
                <el-option label="两室" :value="2" />
                <el-option label="三室" :value="3" />
                <el-option label="四室" :value="4" />
                <el-option label="五室及以上" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="价格区间">
              <el-row :gutter="5">
                <el-col :span="11">
                  <el-input-number 
                    v-model="searchForm.minPrice" 
                    :min="0" 
                    :step="100"
                    :precision="0"
                    controls-position="right"
                    placeholder="最低价"
                    style="width: 100%;"
                  />
                </el-col>
                <el-col :span="2" style="text-align: center;">-</el-col>
                <el-col :span="11">
                  <el-input-number 
                    v-model="searchForm.maxPrice" 
                    :min="0" 
                    :step="100"
                    :precision="0"
                    controls-position="right"
                    placeholder="最高价"
                    style="width: 100%;"
                  />
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="面积区间">
              <el-row :gutter="5">
                <el-col :span="11">
                  <el-input-number 
                    v-model="searchForm.minArea" 
                    :min="0" 
                    :step="10"
                    :precision="0"
                    controls-position="right"
                    placeholder="最小"
                    style="width: 100%;"
                  />
                </el-col>
                <el-col :span="2" style="text-align: center;">-</el-col>
                <el-col :span="11">
                  <el-input-number 
                    v-model="searchForm.maxArea" 
                    :min="0" 
                    :step="10"
                    :precision="0"
                    controls-position="right"
                    placeholder="最大"
                    style="width: 100%;"
                  />
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="房源类型">
              <el-select 
                v-model="searchForm.houseType" 
                placeholder="选择房源类型"
                clearable
                style="width: 100%;"
              >
                <el-option label="公寓" value="APARTMENT" />
                <el-option label="别墅" value="HOUSE" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="出租类型">
              <el-select 
                v-model="searchForm.rentType" 
                placeholder="选择出租类型"
                clearable
                style="width: 100%;"
              >
                <el-option label="整租" value="WHOLE" />
                <el-option label="合租" value="SHARED" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="配套设施">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-checkbox v-model="searchForm.hasElevator">电梯</el-checkbox>
                </el-col>
                <el-col :span="12">
                  <el-checkbox v-model="searchForm.hasParking">停车位</el-checkbox>
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
          
          <el-col :span="6">
            <el-form-item label="排序">
              <el-select 
                v-model="searchForm.sortType" 
                placeholder="选择排序方式"
                style="width: 100%;"
              >
                <el-option label="默认排序" value="" />
                <el-option label="价格从低到高" value="price_asc" />
                <el-option label="价格从高到低" value="price_desc" />
                <el-option label="面积从小到大" value="area_asc" />
                <el-option label="面积从大到小" value="area_desc" />
                <el-option label="最新发布" value="createTime_desc" />
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12" style="text-align: right;">
            <el-button type="primary" @click="searchHouses">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
    
    <el-card class="result-card">
      <template #header>
        <div class="card-header">
          <h2>房源列表</h2>
          <div class="total-display">
            找到 <span class="result-count">{{ total }}</span> 套房源
          </div>
        </div>
      </template>
      
      <el-alert
        v-if="error"
        title="获取数据失败"
        type="error"
        description="连接服务器时发生错误，请稍后再试"
        show-icon
        :closable="false"
      />
      
      <div v-if="loading && currentPage === 1" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="houseList.length === 0" class="empty-container">
        <el-empty description="暂无符合条件的房源" />
      </div>
      
      <div v-else class="house-list">
        <el-row :gutter="20">
          <el-col 
            v-for="house in houseList" 
            :key="house.id" 
            :xs="24" 
            :sm="12" 
            :md="8" 
            :lg="6" 
            class="house-item-col"
          >
            <el-card 
              class="house-item" 
              :body-style="{ padding: '0px' }"
              shadow="hover"
              @click="viewHouseDetail(house.id)"
            >
              <div class="house-img">
                <el-image 
                  :src="house.coverImage" 
                  fit="cover"
                  lazy
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><picture-failed /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="house-price">¥{{ house.price }}/月</div>
              </div>
              <div class="house-info">
                <h3 class="house-title">{{ house.title }}</h3>
                <div class="house-attrs">
                  <span>{{ house.area }}㎡</span>
                  <span>{{ house.bedroomCount }}室{{ house.livingRoomCount }}厅</span>
                  <span>{{ house.rentType === 'WHOLE' ? '整租' : '合租' }}</span>
                </div>
                <div class="house-location">
                  <el-icon><location /></el-icon>
                  <span>{{ house.province }}{{ house.city }}{{ house.district }}</span>
                </div>
                <div class="house-tags">
                  <el-tag v-if="house.hasElevator" size="small">电梯</el-tag>
                  <el-tag v-if="house.hasParking" size="small">停车位</el-tag>
                  <el-tag 
                    v-if="house.decoration" 
                    size="small"
                    type="success"
                  >
                    {{ house.decoration }}
                  </el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <div v-if="loading && currentPage > 1" class="loading-more">
          <div v-loading="true" element-loading-text="加载更多..."></div>
        </div>
        
        <div v-else-if="currentPage * pageSize >= total" class="end-text">
          <p>- 已经到底啦 -</p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import { PictureRounded as PictureFailed } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const error = ref(false)
const houseList = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 省市区数据
const provinceList = ref([]);
const cityList = ref([]);
const districtList = ref([]);

// 搜索表单
const searchForm = reactive({
  keyword: '',
  provinceId: null,  // 省份ID
  province: '',      // 省份名称（用于传递给后端）
  cityId: null,      // 城市ID
  districtId: null,  // 区域ID
  city: '',          // 城市名称（用于传递给后端）
  district: '',      // 区域名称（用于传递给后端）
  minPrice: null,
  maxPrice: null,
  minArea: null,
  maxArea: null,
  bedroomCount: null,
  houseType: '',
  rentType: '',
  hasElevator: false,
  hasParking: false,
  sortType: ''
})

// 加载省份数据
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

// 加载城市数据
const loadCities = async (provinceId) => {
  if (!provinceId) {
    cityList.value = [];
    districtList.value = [];
    searchForm.cityId = null;
    searchForm.districtId = null;
    searchForm.city = ''; 
    searchForm.district = '';
    return;
  }
  try {
    const response = await request.get(`/region/cities/${provinceId}`);
    if (response.code === 200) {
      cityList.value = response.data;
      // 更新省份名称
      const selectedProvince = provinceList.value.find(p => p.id === provinceId);
      if (selectedProvince) searchForm.province = selectedProvince.name;
    } else {
      ElMessage.error(response.message || '获取城市失败');
      cityList.value = [];
      districtList.value = [];
    }
  } catch (err) {
    console.error('获取城市失败:', err);
    ElMessage.error('获取城市数据失败');
    cityList.value = [];
    districtList.value = [];
  }
};

// 加载区域数据
const loadDistricts = async (cityId) => {
  if (!cityId) {
    districtList.value = [];
    searchForm.districtId = null;
    searchForm.district = '';
    return;
  }
  try {
    const response = await request.get(`/region/districts/${cityId}`);
    if (response.code === 200) {
      districtList.value = response.data;
      // 更新城市名称
      const selectedCity = cityList.value.find(c => c.id === cityId);
      if (selectedCity) searchForm.city = selectedCity.name;
    } else {
      ElMessage.error(response.message || '获取区域失败');
      districtList.value = [];
    }
  } catch (err) {
    console.error('获取区域失败:', err);
    ElMessage.error('获取区域数据失败');
    districtList.value = [];
  }
};

// 处理省份变更
const handleProvinceChange = (provinceId) => {
  searchForm.cityId = null;
  searchForm.districtId = null;
  searchForm.city = '';
  searchForm.district = '';
  loadCities(provinceId);
};

// 处理城市变更
const handleCityChange = (cityId) => {
  searchForm.districtId = null;
  searchForm.district = '';
  loadDistricts(cityId);
};

// 处理区域变更
const handleDistrictChange = (districtId) => {
  if (districtId) {
    const selectedDistrict = districtList.value.find(d => d.id === districtId);
    if (selectedDistrict) {
      searchForm.district = selectedDistrict.name;
    }
  } else {
    searchForm.district = '';
  }
};

// 搜索房源
const searchHouses = async () => {
  currentPage.value = 1 // 重置为第一页
  fetchHouseList()
}

// 重置搜索条件
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    if (typeof searchForm[key] === 'boolean') {
      searchForm[key] = false
    } else {
      searchForm[key] = null
    }
  })
  searchForm.keyword = ''
  searchForm.provinceId = null
  searchForm.province = ''
  searchForm.cityId = null
  searchForm.districtId = null
  searchForm.city = ''
  searchForm.district = ''
  searchForm.houseType = ''
  searchForm.rentType = ''
  searchForm.sortType = ''
  
  currentPage.value = 1
  fetchHouseList()
}

// 获取房源列表
const fetchHouseList = async () => {
  loading.value = true
  error.value = false
  
  try {
    // 构建查询参数
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      status: 3 // 只查询已上架的房源 - 数字状态为3或字符串状态为ONLINE
    }
    
    // 添加筛选条件
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.province) params.province = searchForm.province
    if (searchForm.city) params.city = searchForm.city
    if (searchForm.district) params.district = searchForm.district
    if (searchForm.minPrice) params.minPrice = searchForm.minPrice
    if (searchForm.maxPrice) params.maxPrice = searchForm.maxPrice
    if (searchForm.minArea) params.minArea = searchForm.minArea
    if (searchForm.maxArea) params.maxArea = searchForm.maxArea
    if (searchForm.bedroomCount) params.bedroomCount = searchForm.bedroomCount
    if (searchForm.houseType) params.houseType = searchForm.houseType
    if (searchForm.rentType) params.rentType = searchForm.rentType
    if (searchForm.hasElevator) params.hasElevator = searchForm.hasElevator
    if (searchForm.hasParking) params.hasParking = searchForm.hasParking
    
    // 处理排序
    if (searchForm.sortType) {
      const [field, order] = searchForm.sortType.split('_')
      params.sortField = field
      params.sortOrder = order
    }
    
    // 加入优先加载标志，表示优先加载第一页数据
    if (currentPage.value === 1) {
      params.priorityLoad = true
    }
    
    const response = await request.get('/houses/search', { params })
    
    if (response && response.code === 200) {
      houseList.value = response.data.records || []
      
      // 处理图片URL
      houseList.value.forEach(house => {
        if (house.coverImage && !house.coverImage.startsWith('http')) {
          if (!house.coverImage.startsWith('/')) {
            house.coverImage = '/' + house.coverImage
          }
          house.coverImage = `/api${house.coverImage}`
        }
      })
      
      total.value = response.data.total || 0
      console.log('获取到房源列表:', houseList.value)
    } else {
      error.value = true
      ElMessage.error(response?.message || '获取数据失败')
    }
  } catch (err) {
    console.error('搜索房源失败:', err)
    error.value = true
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 添加懒加载方法，当用户滚动到接近底部时加载下一页
const loadNextPage = () => {
  if (currentPage.value * pageSize.value < total.value && !loading.value) {
    currentPage.value += 1
    fetchHouseList()
  }
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchHouseList()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchHouseList()
}

// 查看房源详情
const viewHouseDetail = (id) => {
  router.push(`/user/house/detail/${id}`)
}

onMounted(() => {
  // 加载省份数据
  loadProvinces();
  
  // 初始化搜索
  fetchHouseList();
  
  // 添加滚动监听器，实现滚动懒加载
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  // 组件卸载时移除滚动监听器
  window.removeEventListener('scroll', handleScroll)
})

// 滚动处理函数
const handleScroll = () => {
  // 检查是否滚动到页面底部附近
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight
  const clientHeight = document.documentElement.clientHeight || window.innerHeight
  
  // 当滚动到距离底部100px时，加载下一页数据
  if (scrollHeight - scrollTop - clientHeight < 100) {
    loadNextPage()
  }
}
</script>

<style scoped>
.house-search {
  padding: 20px;
}

.search-card,
.result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-display {
  color: #606266;
  font-size: 14px;
}

.result-count {
  color: #409EFF;
  font-weight: bold;
  font-size: 16px;
}

.house-list {
  margin-top: 20px;
}

.house-item-col {
  margin-bottom: 20px;
}

.house-item {
  cursor: pointer;
  transition: transform 0.3s;
  height: 100%;
}

.house-item:hover {
  transform: translateY(-5px);
}

.house-img {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.house-img .el-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
}

.image-error .el-icon {
  font-size: 40px;
  color: #c0c4cc;
}

.house-price {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 5px 10px;
  font-size: 16px;
  font-weight: bold;
}

.house-info {
  padding: 12px;
}

.house-title {
  margin: 0 0 8px;
  font-size: 16px;
  height: 44px;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.house-attrs {
  display: flex;
  margin-bottom: 8px;
  color: #606266;
  font-size: 14px;
}

.house-attrs span {
  margin-right: 10px;
}

.house-location {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #909399;
  font-size: 12px;
}

.house-location .el-icon {
  margin-right: 4px;
}

.house-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.empty-result {
  margin: 50px 0;
}

.pagination-container {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

/* 添加懒加载相关样式 */
.loading-container {
  padding: 20px 0;
}

.loading-more {
  text-align: center;
  margin-top: 20px;
  padding: 10px 0;
}

.end-text {
  text-align: center;
  color: #909399;
  margin-top: 20px;
  padding: 10px 0;
}

.empty-container {
  padding: 40px 0;
}
</style> 