<template>
  <div class="home-page">
    <!-- 首页大banner -->
    <div class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">寻找您理想的居住空间</h1>
          <p class="hero-subtitle">数千套优质房源，为您打造温馨舒适的家</p>
          
          <!-- 搜索框 -->
          <div class="search-box">
            <el-form :inline="true" :model="searchForm" class="search-form" @submit.prevent="handleSearch">
              <el-form-item>
                <el-input 
                  v-model="searchForm.keyword" 
                  placeholder="输入关键词搜索"
                  prefix-icon="Search"
                  clearable
                  size="large"
                />
              </el-form-item>
              <el-form-item>
                <el-select 
                  v-model="searchForm.provinceId" 
                  placeholder="选择省份"
                  clearable
                  size="large"
                  @change="handleProvinceChange"
                >
                  <el-option 
                    v-for="item in provinceList" 
                    :key="item.id" 
                    :label="item.name" 
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-select 
                  v-model="searchForm.cityId" 
                  placeholder="选择城市"
                  clearable
                  size="large"
                  @change="handleCityChange"
                  :disabled="!searchForm.provinceId"
                >
                  <el-option 
                    v-for="item in cityList" 
                    :key="item.id" 
                    :label="item.name" 
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-select 
                  v-model="searchForm.districtId" 
                  placeholder="选择区域"
                  clearable
                  size="large"
                  @change="handleDistrictChange"
                  :disabled="!searchForm.cityId"
                >
                  <el-option 
                    v-for="item in districtList" 
                    :key="item.id" 
                    :label="item.name" 
                    :value="item.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-select 
                  v-model="searchForm.rentType" 
                  placeholder="租房类型"
                  clearable
                  size="large"
                >
                  <el-option label="整租" value="WHOLE" />
                  <el-option label="合租" value="SHARED" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button 
                  type="primary" 
                  size="large" 
                  @click="handleSearch"
                >
                  <el-icon><search /></el-icon>
                  搜索房源
                </el-button>
              </el-form-item>
              <el-form-item>
                <el-button 
                  size="large" 
                  @click="resetSearchForm"
                >
                  重置
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 服务特点介绍 -->
    <div class="features-section">
      <div class="container">
        <div class="section-header">
          <h2>为什么选择我们</h2>
          <p>提供全方位的租房服务，让您的租房体验更加便捷</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-item">
            <el-icon><user-filled /></el-icon>
            <h3>真实房源</h3>
            <p>100%真实房源，所见即所得</p>
          </div>
          <div class="feature-item">
            <el-icon><camera /></el-icon>
            <p>VR看房</p>
            <p>足不出户，线上VR看房</p>
          </div>
          <div class="feature-item">
            <el-icon><check /></el-icon>
            <h3>品质保障</h3>
            <p>专业审核，品质保障</p>
          </div>
          <div class="feature-item">
            <el-icon><service /></el-icon>
            <h3>专业服务</h3>
            <p>7×24小时专业客服</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 搜索结果区域 -->
    <div class="search-results-section" v-if="isSearching">
      <div class="container">
        <div class="section-header">
          <h2>搜索结果</h2>
          <el-button type="link" @click="clearSearch">清空搜索</el-button>
        </div>
        
        <div v-loading="searchLoading">
          <div v-if="searchResults.length === 0 && !searchLoading" class="empty-data">
            <el-empty description="未找到符合条件的房源" />
          </div>
          
          <el-row v-else :gutter="20">
            <el-col 
              v-for="house in searchResults" 
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
                </div>
              </el-card>
            </el-col>
          </el-row>
          
          <!-- 搜索结果分页 -->
          <div class="pagination" v-if="searchTotal > searchPageSize">
            <el-pagination
              v-model:current-page="searchCurrentPage"
              v-model:page-size="searchPageSize"
              :page-sizes="[8, 12, 16]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="searchTotal"
              @size-change="handleSearchSizeChange"
              @current-change="handleSearchCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 推荐房源 -->
    <div class="recommend-section" v-if="!isSearching">
      <div class="container">
        <div class="section-header">
          <h2>精选推荐</h2>
          <el-link type="primary" :underline="false" @click="goToHouseList">查看更多 <el-icon><right /></el-icon></el-link>
        </div>
        
        <div v-loading="loading">
          <div v-if="recommendHouses.length === 0 && !loading" class="empty-data">
            <el-empty description="暂无推荐房源" />
          </div>
          
          <el-row v-else :gutter="20">
            <el-col 
              v-for="house in recommendHouses" 
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
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Location, UserFilled, Camera, Check, Service, Right, PictureRounded as PictureFailed } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { searchHouses } from '@/api/house'

const router = useRouter()
const loading = ref(false)
const error = ref(false)
const recommendHouses = ref([])

// 省市区数据
const provinceList = ref([])
const cityList = ref([])
const districtList = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  provinceId: null,
  province: '',
  cityId: null,
  districtId: null,
  city: '',
  district: '',
  rentType: ''
})

// 新增搜索结果相关状态
const isSearching = ref(false)
const searchResults = ref([])
const searchLoading = ref(false)
const searchTotal = ref(0)
const searchCurrentPage = ref(1)
const searchPageSize = ref(8)

// 加载省份数据
const loadProvinces = async () => {
  try {
    const response = await request.get('/region/provinces')
    if (response && response.code === 200) {
      provinceList.value = response.data || []
    } else {
      console.error('获取省份数据失败:', response.message)
    }
  } catch (err) {
    console.error('获取省份数据异常:', err)
  }
}

// 加载城市数据
const loadCities = async (provinceId) => {
  if (!provinceId) {
    cityList.value = []
    districtList.value = []
    searchForm.cityId = null
    searchForm.districtId = null
    searchForm.city = ''
    searchForm.district = ''
    return
  }
  
  try {
    const response = await request.get(`/region/cities/${provinceId}`)
    if (response && response.code === 200) {
      cityList.value = response.data || []
      
      // 更新省份名称
      const selectedProvince = provinceList.value.find(p => p.id === provinceId)
      if (selectedProvince) {
        searchForm.province = selectedProvince.name
      }
    } else {
      console.error('获取城市数据失败:', response.message)
      cityList.value = []
    }
  } catch (err) {
    console.error('获取城市数据异常:', err)
    cityList.value = []
  }
}

// 加载区域数据
const loadDistricts = async (cityId) => {
  if (!cityId) {
    districtList.value = []
    searchForm.districtId = null
    searchForm.district = ''
    return
  }
  
  try {
    const response = await request.get(`/region/districts/${cityId}`)
    if (response && response.code === 200) {
      districtList.value = response.data || []
      
      // 更新城市名称
      const selectedCity = cityList.value.find(c => c.id === cityId)
      if (selectedCity) {
        searchForm.city = selectedCity.name
      }
    } else {
      console.error('获取区域数据失败:', response.message)
      districtList.value = []
    }
  } catch (err) {
    console.error('获取区域数据异常:', err)
    districtList.value = []
  }
}

// 处理省份变更
const handleProvinceChange = (provinceId) => {
  searchForm.cityId = null
  searchForm.districtId = null
  searchForm.city = ''
  searchForm.district = ''
  loadCities(provinceId)
}

// 处理城市变更
const handleCityChange = (cityId) => {
  searchForm.districtId = null
  searchForm.district = ''
  loadDistricts(cityId)
}

// 处理区域变更
const handleDistrictChange = (districtId) => {
  if (districtId) {
    const selectedDistrict = districtList.value.find(d => d.id === districtId)
    if (selectedDistrict) {
      searchForm.district = selectedDistrict.name
    }
  } else {
    searchForm.district = ''
  }
}

// 获取推荐房源
const fetchRecommendHouses = async () => {
  loading.value = true
  
  try {
    const response = await request.get('/houses/recommend', {
      params: {
        limit: 8
      }
    })
    
    if (response && response.code === 200) {
      recommendHouses.value = response.data || []
      
      // 处理图片和URL
      recommendHouses.value.forEach(house => {
        // 确保coverImage是完整URL
        if (house.coverImage && !house.coverImage.startsWith('http')) {
          if (!house.coverImage.startsWith('/')) {
            house.coverImage = '/' + house.coverImage
          }
          house.coverImage = `/api${house.coverImage}`
        }
        
        // 处理images
        if (house.images && house.images.length > 0) {
          if (typeof house.images[0] === 'object') {
            house.images = house.images.map(img => {
              let url = img.url
              if (!url.startsWith('http')) {
                if (!url.startsWith('/')) {
                  url = '/' + url
                }
                url = `/api${url}`
              }
              return url
            })
          }
        }
      })
      
      console.log('获取到推荐房源:', recommendHouses.value)
    } else {
      error.value = true
      ElMessage.error(response?.message || '获取推荐房源失败')
    }
  } catch (err) {
    console.error('获取推荐房源失败:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// 获取搜索结果
const fetchSearchResults = async () => {
  searchLoading.value = true
  searchResults.value = []
  
  const params = {
    pageNum: searchCurrentPage.value,
    pageSize: searchPageSize.value,
    keyword: searchForm.keyword || null,
    province: searchForm.province || null,
    city: searchForm.city || null,
    district: searchForm.district || null,
    rentType: searchForm.rentType || null,
    status: 'APPROVED'
  }
  
  Object.keys(params).forEach(key => {
    if (params[key] === null || params[key] === '') {
      delete params[key]
    }
  })

  try {
    // 使用专门的API方法
    const response = await searchHouses(params)
    
    if (response && response.code === 200) {
      searchResults.value = response.data.records || []
      searchTotal.value = response.data.total || 0
      
      searchResults.value.forEach(house => {
        if (house.coverImage && !house.coverImage.startsWith('http')) {
          if (!house.coverImage.startsWith('/')) {
            house.coverImage = '/' + house.coverImage
          }
          house.coverImage = `/api${house.coverImage}`
        }
      })
      
    } else {
      ElMessage.error(response?.message || '搜索房源失败')
    }
  } catch (err) {
    console.error('搜索房源失败:', err)
    ElMessage.error('搜索房源时发生错误')
  } finally {
    searchLoading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  isSearching.value = true
  searchCurrentPage.value = 1
  fetchSearchResults()
}

// 处理搜索分页
const handleSearchSizeChange = (val) => {
  searchPageSize.value = val
  fetchSearchResults()
}

const handleSearchCurrentChange = (val) => {
  searchCurrentPage.value = val
  fetchSearchResults()
}

// 清空搜索
const clearSearch = () => {
  isSearching.value = false
  searchResults.value = []
  searchTotal.value = 0
  searchCurrentPage.value = 1
}

// 重置搜索表单
const resetSearchForm = () => {
  searchForm.keyword = ''
  searchForm.provinceId = null
  searchForm.province = ''
  searchForm.cityId = null
  searchForm.city = ''
  searchForm.districtId = null
  searchForm.district = ''
  searchForm.rentType = ''
  cityList.value = [] // 清空城市列表
  districtList.value = [] // 清空区域列表
  
  // 如果当前正在显示搜索结果，也清空结果返回推荐页
  if (isSearching.value) {
    clearSearch()
  }
}

// 跳转到房源列表页
const goToHouseList = () => {
  router.push('/user/house/list')
}

// 查看房源详情
const viewHouseDetail = (id) => {
  router.push({
    name: 'UserHouseDetail',
    params: { id }
  })
}

onMounted(() => {
  loadProvinces()
  fetchRecommendHouses()
})
</script>

<style scoped>
.home-page {
  background-color: #f5f7fa;
}

/* 首页大banner */
.hero-section {
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80');
  background-size: cover;
  background-position: center;
  height: 500px;
  display: flex;
  align-items: center;
  color: white;
}

.hero-content {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 42px;
  font-weight: bold;
  margin: 0 0 15px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 18px;
  margin-bottom: 40px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.search-box {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-form {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.search-form .el-form-item {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* 调整下拉框宽度 */
.search-form .el-select {
  width: 160px; /* 或根据需要调整宽度 */
}

/* 服务特点介绍 */
.features-section {
  padding: 60px 0;
  background-color: white;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-header h2 {
  font-size: 28px;
  margin: 0 0 10px;
  position: relative;
  display: inline-block;
}

.section-header h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background-color: #409EFF;
}

.section-header p {
  color: #606266;
  font-size: 16px;
  margin: 10px 0 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.feature-item {
  text-align: center;
  padding: 30px 20px;
  border-radius: 8px;
  background-color: #f8f9fb;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.feature-item .el-icon {
  font-size: 40px;
  color: #409EFF;
  margin-bottom: 15px;
}

.feature-item h3 {
  font-size: 18px;
  margin: 0 0 10px;
}

.feature-item p {
  color: #606266;
  margin: 0;
}

/* 推荐房源 */
.recommend-section {
  padding: 60px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.house-item-col {
  margin-bottom: 30px;
}

.house-item {
  cursor: pointer;
  transition: transform 0.3s;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.house-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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
  border-top-left-radius: 4px;
}

.house-info {
  padding: 15px;
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
  color: #909399;
  font-size: 12px;
}

.house-location .el-icon {
  margin-right: 4px;
}

.empty-data {
  padding: 30px 0;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .hero-title {
    font-size: 32px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
}

/* 新增搜索结果区域样式 */
.search-results-section {
  padding: 40px 0;
}

.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}
</style> 