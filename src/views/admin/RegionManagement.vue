<template>
  <div class="region-management">
    <el-card class="region-card">
      <template #header>
        <div class="card-header">
          <h2>地区管理</h2>
        </div>
      </template>

      <div class="region-tree-container">
        <div class="region-tree-panel">
          <div class="tree-header">
            <h3>地区层级</h3>
            <el-button type="primary" size="small" @click="showAddProvinceDialog">添加省份</el-button>
          </div>
          <el-tree
            ref="treeRef"
            :data="regionTreeData"
            :props="{children: 'children', label: 'name'}"
            node-key="nodeKey"
            :default-expanded-keys="expandedKeys"
            :current-node-key="selectedNodeKey"
            @node-click="handleNodeClick"
            @node-expand="handleNodeExpand"
            @node-collapse="handleNodeCollapse"
            :expand-on-click-node="false"
            @node-contextmenu="handleNodeContextmenu"
            class="region-tree"
          >
            <template #default="{ node, data }">
              <span class="tree-node-label" 
                :class="{'node-selected': data.nodeKey === selectedNodeKey}"
                @dblclick="handleNodeDbClick(node, data, $event)">
                <span>{{ node.label }}</span>
                <span class="node-actions" v-if="node.level <= 3">
                  <el-button v-if="node.level === 1" type="primary" size="small" circle @click.stop="showAddCityDialog(data)">
                    <el-icon><plus /></el-icon>
                  </el-button>
                  <el-button v-if="node.level === 2" type="primary" size="small" circle @click.stop="showAddDistrictDialog(data)">
                    <el-icon><plus /></el-icon>
                  </el-button>
                  <el-button type="warning" size="small" circle @click.stop="editRegionNode(node, data)">
                    <el-icon><edit /></el-icon>
                  </el-button>
                  <el-button type="danger" size="small" circle @click.stop="confirmDeleteRegionNode(node, data)">
                    <el-icon><delete /></el-icon>
                  </el-button>
                </span>
              </span>
            </template>
          </el-tree>
        </div>

        <div class="region-details-panel">
          <div class="details-header">
            <h3>{{ getSelectedNodeTitle() }}</h3>
          </div>
          <div class="details-content" v-loading="loading.details">
            <div v-if="!selectedNode" class="no-selection-tip">
              <el-empty description="请从左侧选择一个地区" />
            </div>
            <div v-else class="node-details">
              <h4>基本信息</h4>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="名称">{{ selectedNode.name }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatTime(selectedNode.createTime) }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ formatTime(selectedNode.updateTime) }}</el-descriptions-item>
                <el-descriptions-item v-if="selectedNode.level >= 2" label="所属省份">{{ selectedNode.provinceName }}</el-descriptions-item>
                <el-descriptions-item v-if="selectedNode.level === 3" label="所属城市">{{ selectedNode.cityName }}</el-descriptions-item>
              </el-descriptions>

              <div class="details-actions">
                <el-button type="primary" @click="editRegionNode(null, selectedNode)">编辑</el-button>
                <el-button type="danger" @click="confirmDeleteRegionNode(null, selectedNode)">删除</el-button>
                <el-button v-if="selectedNode.level === 1" type="success" @click="showAddCityDialog(selectedNode)">添加城市</el-button>
                <el-button v-if="selectedNode.level === 2" type="success" @click="showAddDistrictDialog(selectedNode)">添加区域</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 省份对话框 -->
    <el-dialog
      :title="currentForm.id ? '编辑省份' : '添加省份'"
      v-model="dialogVisible.province"
      width="500px"
    >
      <el-form :model="currentForm" :rules="formRules.province" ref="provinceFormRef" label-width="100px">
        <el-form-item label="省份名称" prop="name">
          <el-input v-model="currentForm.name" placeholder="请输入省份名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible.province = false">取消</el-button>
          <el-button type="primary" @click="submitProvinceForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 城市对话框 -->
    <el-dialog
      :title="currentForm.id ? '编辑城市' : '添加城市'"
      v-model="dialogVisible.city"
      width="500px"
    >
      <el-form :model="currentForm" :rules="formRules.city" ref="cityFormRef" label-width="100px">
        <el-form-item label="城市名称" prop="name">
          <el-input v-model="currentForm.name" placeholder="请输入城市名称" />
        </el-form-item>
        <el-form-item label="所属省份" prop="provinceId">
          <el-select v-model="currentForm.provinceId" placeholder="请选择省份" style="width: 100%" disabled>
            <el-option
              v-for="province in provinces"
              :key="province.id"
              :label="province.name"
              :value="province.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible.city = false">取消</el-button>
          <el-button type="primary" @click="submitCityForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 区域对话框 -->
    <el-dialog
      :title="currentForm.id ? '编辑区域' : '添加区域'"
      v-model="dialogVisible.district"
      width="500px"
    >
      <el-form :model="currentForm" :rules="formRules.district" ref="districtFormRef" label-width="100px">
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="currentForm.name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="所属省份" prop="provinceId">
          <el-select v-model="currentForm.provinceId" placeholder="请选择省份" style="width: 100%" disabled>
            <el-option
              v-for="province in provinces"
              :key="province.id"
              :label="province.name"
              :value="province.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属城市" prop="cityId">
          <el-select v-model="currentForm.cityId" placeholder="请选择城市" style="width: 100%" disabled>
            <el-option
              v-for="city in cities"
              :key="city.id"
              :label="city.name"
              :value="city.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible.district = false">取消</el-button>
          <el-button type="primary" @click="submitDistrictForm">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, nextTick, watch, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';

// 省份列表数据
const provinces = ref([]);
const cities = ref([]);
const districts = ref([]);
const selectedNode = ref(null);
const selectedNodeId = ref(null); 
const selectedNodeKey = ref(null); // 使用自定义的nodeKey进行节点选中
const treeRef = ref(null); // 树组件引用
const expandedKeys = ref([]); // 存储已展开的节点keys
const loading = reactive({
  province: false,
  city: false,
  district: false,
  details: false
});

const dialogVisible = reactive({
  province: false,
  city: false,
  district: false
});

// 表单数据
const currentForm = ref({
  id: null,
  name: '',
  provinceId: null,
  cityId: null,
  level: 1
});

// 表单校验规则
const formRules = {
  province: {
    name: [
      { required: true, message: '请输入省份名称', trigger: 'blur' }
    ]
  },
  city: {
    name: [
      { required: true, message: '请输入城市名称', trigger: 'blur' }
    ],
    provinceId: [
      { required: true, message: '请选择所属省份', trigger: 'change' }
    ]
  },
  district: {
    name: [
      { required: true, message: '请输入区域名称', trigger: 'blur' }
    ],
    provinceId: [
      { required: true, message: '请选择所属省份', trigger: 'change' }
    ],
    cityId: [
      { required: true, message: '请选择所属城市', trigger: 'change' }
    ]
  }
};

// 表单引用
const provinceFormRef = ref(null);
const cityFormRef = ref(null);
const districtFormRef = ref(null);

// 获取节点的唯一标识
const getNodeKey = (data) => {
  if (data.level === 1) {
    return `province_${data.id}`;
  } else if (data.level === 2) {
    return `city_${data.id}`;
  } else if (data.level === 3) {
    return `district_${data.id}`;
  }
  return `node_${data.id}`;
};

// 构建树形数据
const regionTreeData = computed(() => {
  const treeData = [];
  
  provinces.value.forEach(province => {
    const provinceNode = {
      ...province,
      level: 1,
      nodeKey: `province_${province.id}`,
      children: []
    };
    
    // 添加该省份下的城市
    const provinceCities = cities.value.filter(city => city.provinceId === province.id);
    provinceCities.forEach(city => {
      const cityNode = {
        ...city,
        level: 2,
        nodeKey: `city_${city.id}`,
        provinceName: province.name,
        children: []
      };
      
      // 添加该城市下的区域
      const cityDistricts = districts.value.filter(district => district.cityId === city.id);
      cityDistricts.forEach(district => {
        const districtNode = {
          ...district,
          level: 3,
          nodeKey: `district_${district.id}`,
          provinceName: province.name,
          cityName: city.name,
          children: [] // 确保每个节点都有children数组，即使是空的
        };
        cityNode.children.push(districtNode);
      });
      
      provinceNode.children.push(cityNode);
    });
    
    treeData.push(provinceNode);
  });
  
  // 调试日志：检查是否存在ID重复的节点
  const nodeIds = new Set();
  const nodeKeys = new Set();
  const checkNodeIds = (nodes) => {
    nodes.forEach(node => {
      if (nodeIds.has(node.id)) {
        console.warn(`发现相同ID的节点 (正常情况): ${node.id}, 名称: ${node.name}, 但nodeKey不同: ${node.nodeKey}`);
      } else {
        nodeIds.add(node.id);
      }
      
      if (nodeKeys.has(node.nodeKey)) {
        console.error(`严重错误: 发现重复的节点Key: ${node.nodeKey}, 名称: ${node.name}`);
      } else {
        nodeKeys.add(node.nodeKey);
      }
      
      if (node.children && node.children.length > 0) {
        checkNodeIds(node.children);
      }
    });
  };
  
  checkNodeIds(treeData);
  console.log('树形数据构建完成', treeData);
  
  return treeData;
});

// 点击树节点
const handleNodeClick = (data, node) => {
  console.log('Node clicked:', data.id, data.name, data.nodeKey);
  selectedNode.value = data;
  selectedNodeId.value = data.id;
  selectedNodeKey.value = data.nodeKey;
  
  // 清除任何可能的文本选择
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
  
  // 确保树组件正确设置当前节点
  nextTick(() => {
    if (treeRef.value) {
      treeRef.value.setCurrentKey(data.nodeKey);
    }
  });
};

// 节点双击处理
const handleNodeDbClick = (node, data, event) => {
  console.log('Node double clicked:', data.id, data.name, data.nodeKey);
  
  // 阻止事件冒泡，防止触发其他事件处理
  event.stopPropagation();
  // 阻止默认行为，防止文本被选中
  event.preventDefault();
  
  // 清除任何可能的文本选择
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
  
  // 选中该节点，确保详情面板显示正确的信息
  selectedNode.value = data;
  selectedNodeId.value = data.id;
  selectedNodeKey.value = data.nodeKey;
  
  // 确保树组件正确设置当前节点
  nextTick(() => {
    if (treeRef.value) {
      treeRef.value.setCurrentKey(data.nodeKey);
    }
  });
  
  // 双击时切换展开/折叠状态
  if (node.expanded) {
    // 当前是展开状态，双击后折叠
    node.collapse();
  } else {
    // 当前是折叠状态，双击后展开
    node.expand();
  }
};

// 处理右键点击事件
const handleNodeContextmenu = (event, data, node) => {
  // 防止默认的右键菜单
  event.preventDefault();
  // 可以在这里添加自定义右键菜单逻辑，如果需要的话
  console.log('Right-click on node:', data.name);
};

// 节点展开处理
const handleNodeExpand = (data, node) => {
  // Add the node's key to expandedKeys if not already present
  if (!expandedKeys.value.includes(data.nodeKey)) {
    expandedKeys.value.push(data.nodeKey);
  }
  console.log('Node expanded, updated keys:', expandedKeys.value);
};

// 节点折叠处理
const handleNodeCollapse = (data) => {
  // Remove the node's key from expandedKeys
  expandedKeys.value = expandedKeys.value.filter(key => key !== data.nodeKey);
  console.log('Node collapsed, updated keys:', expandedKeys.value);
};

// 获取选中节点标题
const getSelectedNodeTitle = () => {
  if (!selectedNode.value) return '地区详情';
  
  if (selectedNode.value.level === 1) {
    return `省份详情: ${selectedNode.value.name}`;
  } else if (selectedNode.value.level === 2) {
    return `城市详情: ${selectedNode.value.name}`;
  } else if (selectedNode.value.level === 3) {
    return `区域详情: ${selectedNode.value.name}`;
  }
  
  return '地区详情';
};

// 格式化时间
const formatTime = (time) => {
  if (!time) return '未设置';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 加载省份列表
const loadProvinces = async (savedExpandedKeys = null) => {
  try {
    // 如果没有传入保存的展开状态，则保存当前的展开状态
    const currentExpandedKeys = savedExpandedKeys || [...expandedKeys.value];
    
    loading.province = true;
    const response = await request({
      url: '/region/provinces',
      method: 'get'
    });
    if (response.code === 200) {
      provinces.value = response.data;
      await loadAllCities(currentExpandedKeys);
    } else {
      ElMessage.error(response.message || '获取省份列表失败');
    }
  } catch (error) {
    console.error('获取省份列表失败:', error);
    ElMessage.error('获取省份列表失败');
  } finally {
    loading.province = false;
  }
};

// 加载所有城市
const loadAllCities = async (savedExpandedKeys = null) => {
  try {
    // 如果没有传入保存的展开状态，则保存当前的展开状态
    const currentExpandedKeys = savedExpandedKeys || [...expandedKeys.value];
    
    loading.city = true;
    const allCities = [];
    for (const province of provinces.value) {
      const response = await request({
        url: `/region/cities/${province.id}`,
        method: 'get'
      });
      if (response.code === 200) {
        allCities.push(...response.data);
      }
    }
    cities.value = allCities;
    await loadAllDistricts(currentExpandedKeys);
  } catch (error) {
    console.error('获取所有城市失败:', error);
    ElMessage.error('获取城市数据失败');
  } finally {
    loading.city = false;
  }
};

// 加载所有区域
const loadAllDistricts = async (savedExpandedKeys = null) => {
  try {
    // 如果没有传入保存的展开状态，则保存当前的展开状态
    const currentExpandedKeys = savedExpandedKeys || [...expandedKeys.value];
    
    loading.district = true;
    const allDistricts = [];
    for (const city of cities.value) {
      const response = await request({
        url: `/region/districts/${city.id}`,
        method: 'get'
      });
      if (response.code === 200) {
        allDistricts.push(...response.data);
      }
    }
    districts.value = allDistricts;
    
    // 在加载完成后保证全局展开状态一致性
    if (currentExpandedKeys && currentExpandedKeys.length > 0) {
      console.log('恢复保存的展开状态:', currentExpandedKeys);
      
      // 检查并添加所有省份节点的展开状态
      provinces.value.forEach(province => {
        const provinceKey = `province_${province.id}`;
        if (!currentExpandedKeys.includes(provinceKey)) {
          currentExpandedKeys.push(provinceKey);
        }
      });
      
      // 检查并添加所有城市节点的展开状态
      cities.value.forEach(city => {
        const cityKey = `city_${city.id}`;
        if (!currentExpandedKeys.includes(cityKey)) {
          currentExpandedKeys.push(cityKey);
        }
      });
      
      // 更新响应式变量
      expandedKeys.value = [...currentExpandedKeys];
      
      // 使用nextTick确保DOM已更新
      nextTick(() => {
        // 确保树组件已更新后手动设置展开状态
        if (treeRef.value) {
          console.log('手动设置树的展开状态');
          setTimeout(() => {
            // 统一设置所有展开的节点
            treeRef.value.setExpandedKeys(expandedKeys.value);
            
            // 额外确保每个节点都被正确展开
            expandedKeys.value.forEach(key => {
              try {
                const node = treeRef.value.getNode(key);
                if (node && !node.expanded) {
                  node.expand();
                }
              } catch (e) {
                console.warn('展开节点失败:', key, e);
              }
            });
          }, 100);
        }
      });
    }
  } catch (error) {
    console.error('获取所有区域失败:', error);
    ElMessage.error('获取区域数据失败');
  } finally {
    loading.district = false;
  }
};

// 显示添加省份对话框
const showAddProvinceDialog = () => {
  currentForm.value = {
    id: null,
    name: '',
    level: 1
  };
  dialogVisible.province = true;
};

// 显示添加城市对话框
const showAddCityDialog = (province) => {
  currentForm.value = {
    id: null,
    name: '',
    provinceId: province.id,
    level: 2
  };
  dialogVisible.city = true;
};

// 显示添加区域对话框
const showAddDistrictDialog = (city) => {
  currentForm.value = {
    id: null,
    name: '',
    provinceId: city.provinceId,
    cityId: city.id,
    level: 3
  };
  dialogVisible.district = true;
};

// 编辑地区节点
const editRegionNode = (node, data) => {
  if (data.level === 1) {
    currentForm.value = {
      id: data.id,
      name: data.name,
      level: 1
    };
    dialogVisible.province = true;
  } else if (data.level === 2) {
    currentForm.value = {
      id: data.id,
      name: data.name,
      provinceId: data.provinceId,
      level: 2
    };
    dialogVisible.city = true;
  } else if (data.level === 3) {
    currentForm.value = {
      id: data.id,
      name: data.name,
      provinceId: data.provinceId,
      cityId: data.cityId,
      level: 3
    };
    dialogVisible.district = true;
  }
};

// 确认删除地区节点
const confirmDeleteRegionNode = (node, data) => {
  let message = '';
  let confirmAction = null;
  
  if (data.level === 1) {
    message = `确定要删除省份 "${data.name}" 吗？该操作将同时删除其下所有城市和区域！`;
    confirmAction = () => deleteProvince(data.id);
  } else if (data.level === 2) {
    message = `确定要删除城市 "${data.name}" 吗？该操作将同时删除其下所有区域！`;
    confirmAction = () => deleteCity(data.id);
  } else if (data.level === 3) {
    message = `确定要删除区域 "${data.name}" 吗？`;
    confirmAction = () => deleteDistrict(data.id);
  }
  
  ElMessageBox.confirm(message, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (confirmAction) confirmAction();
  }).catch(() => {});
};

// 提交省份表单
const submitProvinceForm = async () => {
  if (!provinceFormRef.value) return;
  
  await provinceFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 保存当前展开的节点keys
        const currentExpandedKeys = [...expandedKeys.value];
        console.log('操作省份前的展开状态:', currentExpandedKeys);
        
        const isEdit = !!currentForm.value.id;
        const url = isEdit ? `/region/province/${currentForm.value.id}` : '/region/province';
        const method = isEdit ? 'put' : 'post';
        
        // Keep code generation logic if backend requires it or handles defaults
        const provinceCode = currentForm.value.name.length > 3 
          ? currentForm.value.name.substring(0, 3) 
          : currentForm.value.name;
        
        const response = await request({
          url,
          method,
          data: {
            name: currentForm.value.name,
            id: currentForm.value.id,
            code: provinceCode + Date.now() % 10000 
          }
        });
        
        if (response.code === 200) {
          ElMessage.success(isEdit ? '省份更新成功' : '省份添加成功');
          dialogVisible.province = false;
          
          // 添加后立即保存响应数据中的ID
          let newProvinceId = null;
          if (!isEdit && response.data) {
            newProvinceId = response.data;
          }
          
          // 暂存展开状态，防止数据加载过程中丢失
          const savedExpandedKeys = [...currentExpandedKeys];
          
          // 保留编辑前的节点选中状态
          const previousSelectedNodeKey = selectedNodeKey.value;
          const previousSelectedNodeId = selectedNodeId.value;
          
          await loadProvinces(savedExpandedKeys);
          
          // 如果是编辑，保持原来选中的节点
          if (isEdit) {
            setTimeout(() => {
              nextTick(() => {
                // 如果节点仍然存在，则选中它
                const editedNode = provinces.value.find(p => p.id === currentForm.value.id);
                if (editedNode) {
                  selectedNode.value = {...editedNode, level: 1, nodeKey: `province_${currentForm.value.id}`};
                  selectedNodeId.value = currentForm.value.id;
                  selectedNodeKey.value = `province_${currentForm.value.id}`;
                  
                  if (treeRef.value) {
                    treeRef.value.setCurrentKey(`province_${currentForm.value.id}`);
                  }
                }
              });
            }, 100);
          } 
          // 如果是新增，选中新添加的节点
          else if (newProvinceId) {
            setTimeout(() => {
              nextTick(() => {
                const newNode = provinces.value.find(p => p.id === newProvinceId);
                if (newNode) {
                  selectedNode.value = {...newNode, level: 1, nodeKey: `province_${newProvinceId}`};
                  selectedNodeId.value = newProvinceId;
                  selectedNodeKey.value = `province_${newProvinceId}`;
                  
                  if (treeRef.value) {
                    treeRef.value.setCurrentKey(`province_${newProvinceId}`);
                  }
                }
              });
            }, 100);
          }
        } else {
          ElMessage.error(response.message || (isEdit ? '更新省份失败' : '添加省份失败'));
        }
      } catch (error) {
        console.error(currentForm.value.id ? '更新省份出错:' : '添加省份出错:', error);
        ElMessage.error(currentForm.value.id ? '更新省份失败' : '添加省份失败');
      }
    }
  });
};

// 提交城市表单
const submitCityForm = async () => {
  if (!cityFormRef.value) return;
  
  await cityFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 保存当前展开的节点keys
        const currentExpandedKeys = [...expandedKeys.value];
        console.log('操作城市前的展开状态:', currentExpandedKeys);
        
        const isEdit = !!currentForm.value.id;
        const url = isEdit ? `/region/city/${currentForm.value.id}` : '/region/city';
        const method = isEdit ? 'put' : 'post';
        
        const response = await request({
          url,
          method,
          data: {
            name: currentForm.value.name,
            provinceId: currentForm.value.provinceId,
            id: currentForm.value.id
          }
        });
        
        if (response.code === 200) {
          ElMessage.success(isEdit ? '城市更新成功' : '城市添加成功');
          dialogVisible.city = false;
          
          // 添加后立即保存响应数据中的ID
          let newCityId = null;
          if (!isEdit && response.data) {
            newCityId = response.data;
          }
          
          // 无论是编辑还是新增，都确保省份节点展开
          const provinceKey = `province_${currentForm.value.provinceId}`;
          if (!currentExpandedKeys.includes(provinceKey)) {
            currentExpandedKeys.push(provinceKey);
          }
          
          // 暂存展开状态，防止数据加载过程中丢失
          const savedExpandedKeys = [...currentExpandedKeys];
          
          await loadAllCities(savedExpandedKeys);
          
          // 如果是编辑，保持原来选中的节点
          if (isEdit) {
            setTimeout(() => {
              nextTick(() => {
                // 如果节点仍然存在，则选中它
                const editedNode = cities.value.find(c => c.id === currentForm.value.id);
                if (editedNode) {
                  const province = provinces.value.find(p => p.id === currentForm.value.provinceId);
                  selectedNode.value = {
                    ...editedNode, 
                    level: 2,
                    nodeKey: `city_${currentForm.value.id}`,
                    provinceName: province ? province.name : ''
                  };
                  selectedNodeId.value = currentForm.value.id;
                  selectedNodeKey.value = `city_${currentForm.value.id}`;
                  
                  if (treeRef.value) {
                    treeRef.value.setCurrentKey(`city_${currentForm.value.id}`);
                  }
                }
              });
            }, 100);
          }
          // 如果是新增，选中新添加的节点
          else if (newCityId) {
            setTimeout(() => {
              nextTick(() => {
                const newNode = cities.value.find(c => c.id === newCityId);
                if (newNode) {
                  const province = provinces.value.find(p => p.id === currentForm.value.provinceId);
                  selectedNode.value = {
                    ...newNode, 
                    level: 2,
                    nodeKey: `city_${newCityId}`,
                    provinceName: province ? province.name : ''
                  };
                  selectedNodeId.value = newCityId;
                  selectedNodeKey.value = `city_${newCityId}`;
                  
                  if (treeRef.value) {
                    treeRef.value.setCurrentKey(`city_${newCityId}`);
                  }
                }
              });
            }, 100);
          }
        } else {
          ElMessage.error(response.message || (isEdit ? '更新城市失败' : '添加城市失败'));
        }
      } catch (error) {
        console.error(currentForm.value.id ? '更新城市出错:' : '添加城市出错:', error);
        ElMessage.error(currentForm.value.id ? '更新城市失败' : '添加城市失败');
      }
    }
  });
};

// 提交区域表单
const submitDistrictForm = async () => {
  if (!districtFormRef.value) return;
  
  await districtFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 保存当前展开的节点keys
        const currentExpandedKeys = [...expandedKeys.value];
        console.log('操作区域前的展开状态:', currentExpandedKeys);
        
        const isEdit = !!currentForm.value.id;
        const url = isEdit ? `/region/district/${currentForm.value.id}` : '/region/district';
        const method = isEdit ? 'put' : 'post';
        
        const response = await request({
          url,
          method,
          data: {
            name: currentForm.value.name,
            provinceId: currentForm.value.provinceId,
            cityId: currentForm.value.cityId,
            id: currentForm.value.id
          }
        });
        
        if (response.code === 200) {
          ElMessage.success(isEdit ? '区域更新成功' : '区域添加成功');
          dialogVisible.district = false;
          
          // 添加后立即保存响应数据中的ID
          let newDistrictId = null;
          if (!isEdit && response.data) {
            newDistrictId = response.data;
          }
          
          // 无论是编辑还是新增，都确保省份和城市节点展开
          const provinceKey = `province_${currentForm.value.provinceId}`;
          if (!currentExpandedKeys.includes(provinceKey)) {
            currentExpandedKeys.push(provinceKey);
          }
          
          const cityKey = `city_${currentForm.value.cityId}`;
          if (!currentExpandedKeys.includes(cityKey)) {
            currentExpandedKeys.push(cityKey);
          }
          
          // 暂存展开状态，防止数据加载过程中丢失
          const savedExpandedKeys = [...currentExpandedKeys];
          console.log('保存的展开状态:', savedExpandedKeys);
          
          // 定义刷新后的选中节点ID变量
          let targetNodeId = isEdit ? currentForm.value.id : (newDistrictId || null);
          let targetNodeKey = isEdit ? `district_${currentForm.value.id}` : (newDistrictId ? `district_${newDistrictId}` : null);
          
          // 保存之前的展开状态到本地存储，以确保在异步操作后能恢复
          localStorage.setItem('region_expanded_keys', JSON.stringify(savedExpandedKeys));
          localStorage.setItem('region_selected_node_key', targetNodeKey);
          
          // 加载数据
          await loadAllDistricts(savedExpandedKeys);
          
          // 重新应用展开状态和选中项
          setTimeout(() => {
            // 获取本地存储的展开状态
            try {
              const storedKeys = localStorage.getItem('region_expanded_keys');
              if (storedKeys) {
                const parsedKeys = JSON.parse(storedKeys);
                if (parsedKeys.length > 0 && !deepEqual(expandedKeys.value, parsedKeys)) {
                  console.log('从存储恢复展开状态:', parsedKeys);
                  expandedKeys.value = parsedKeys;
                  
                  // 手动应用展开
                  if (treeRef.value) {
                    parsedKeys.forEach(key => {
                      try {
                        treeRef.value.setExpandedKeys([key]);
                      } catch (e) {
                        console.warn('展开节点失败:', key, e);
                      }
                    });
                  }
                }
              }
              
              // 恢复选中项
              const storedSelectedKey = localStorage.getItem('region_selected_node_key');
              if (storedSelectedKey && targetNodeKey === storedSelectedKey) {
                // 处理选中的节点
                if (targetNodeId) {
                  if (isEdit) {
                    const editedNode = districts.value.find(d => d.id === targetNodeId);
                    if (editedNode) {
                      const province = provinces.value.find(p => p.id === currentForm.value.provinceId);
                      const city = cities.value.find(c => c.id === currentForm.value.cityId);
                      selectedNode.value = {
                        ...editedNode, 
                        level: 3,
                        nodeKey: targetNodeKey,
                        provinceName: province ? province.name : '',
                        cityName: city ? city.name : ''
                      };
                      selectedNodeId.value = targetNodeId;
                      selectedNodeKey.value = targetNodeKey;
                      
                      if (treeRef.value) {
                        treeRef.value.setCurrentKey(targetNodeKey);
                      }
                    }
                  } else if (newDistrictId) {
                    const newNode = districts.value.find(d => d.id === newDistrictId);
                    if (newNode) {
                      const province = provinces.value.find(p => p.id === currentForm.value.provinceId);
                      const city = cities.value.find(c => c.id === currentForm.value.cityId);
                      selectedNode.value = {
                        ...newNode, 
                        level: 3,
                        nodeKey: targetNodeKey,
                        provinceName: province ? province.name : '',
                        cityName: city ? city.name : ''
                      };
                      selectedNodeId.value = targetNodeId;
                      selectedNodeKey.value = targetNodeKey;
                      
                      if (treeRef.value) {
                        treeRef.value.setCurrentKey(targetNodeKey);
                      }
                    }
                  }
                }
              }
            } catch (e) {
              console.error('恢复展开状态出错:', e);
            }
            
            // 清理本地存储
            localStorage.removeItem('region_expanded_keys');
            localStorage.removeItem('region_selected_node_key');
          }, 100);
        } else {
          ElMessage.error(response.message || (isEdit ? '更新区域失败' : '添加区域失败'));
        }
      } catch (error) {
        console.error(currentForm.value.id ? '更新区域出错:' : '添加区域出错:', error);
        ElMessage.error(currentForm.value.id ? '更新区域失败' : '添加区域失败');
      }
    }
  });
};

// 添加辅助函数，深度比较两个数组是否相等
const deepEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  const sortedArr1 = [...arr1].sort();
  const sortedArr2 = [...arr2].sort();
  return sortedArr1.every((item, index) => item === sortedArr2[index]);
};

// 强制应用展开状态
const applyExpandedState = () => {
  console.log('强制应用展开状态', expandedKeys.value);
  if (treeRef.value) {
    // 确保所有省份和城市节点都被展开
    const allKeysToExpand = [...expandedKeys.value];
    
    // 添加所有省份节点
    provinces.value.forEach(province => {
      const provinceKey = `province_${province.id}`;
      if (!allKeysToExpand.includes(provinceKey)) {
        allKeysToExpand.push(provinceKey);
      }
    });
    
    // 添加所有城市节点
    cities.value.forEach(city => {
      const cityKey = `city_${city.id}`;
      if (!allKeysToExpand.includes(cityKey)) {
        allKeysToExpand.push(cityKey);
      }
    });
    
    // 更新响应式变量
    if (!deepEqual(expandedKeys.value, allKeysToExpand)) {
      expandedKeys.value = [...allKeysToExpand];
    }
    
    setTimeout(() => {
      // 统一设置所有节点的展开状态
      treeRef.value.setExpandedKeys(allKeysToExpand);
      
      // 额外确保每个节点都被正确展开
      allKeysToExpand.forEach(key => {
        try {
          const node = treeRef.value.getNode(key);
          if (node && !node.expanded) {
            node.expand();
          }
        } catch (e) {
          console.warn('展开节点失败:', key, e);
        }
      });
      
      // 强制树组件更新
      if (treeRef.value.$forceUpdate) {
        treeRef.value.$forceUpdate();
      }
    }, 200);
  }
};

// 辅助函数，根据nodeKey查找节点
const findNodeByKey = (nodes, key) => {
  if (!nodes || nodes.length === 0) return null;
  
  for (const node of nodes) {
    if (node.nodeKey === key) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeByKey(node.children, key);
      if (found) return found;
    }
  }
  return null;
};

// 创建一个hack函数，在树重新渲染时调用
const hackExpandAfterUpdate = () => {
  console.log('执行展开状态hack');
  // 使用递归函数保证即使树组件尚未完全渲染也能正确应用展开状态
  const checkAndApply = (attempts = 0) => {
    if (attempts > 10) return; // 最多尝试10次
    
    if (treeRef.value && treeRef.value.store) {
      applyExpandedState();
    } else {
      setTimeout(() => checkAndApply(attempts + 1), 100);
    }
  };
  
  checkAndApply();
};

// 在组件挂载后设置一个全局定时器来检查展开状态
let stateCheckInterval = null;

onMounted(() => {
  // 在组件挂载后加载数据
  loadProvinces();
  
  // 每300ms检查一次展开状态，更频繁地确保展开状态的稳定性
  stateCheckInterval = setInterval(() => {
    if (treeRef.value && regionTreeData.value.length > 0) {
      // 自动展开所有省份和城市节点
      const shouldBeExpanded = [];
      
      // 添加所有省份节点
      provinces.value.forEach(province => {
        shouldBeExpanded.push(`province_${province.id}`);
      });
      
      // 添加所有城市节点
      cities.value.forEach(city => {
        shouldBeExpanded.push(`city_${city.id}`);
      });
      
      // 合并当前已展开的节点，确保不会丢失
      shouldBeExpanded.push(...expandedKeys.value.filter(key => !shouldBeExpanded.includes(key)));
      
      // 检查是否所有应该展开的节点都已展开
      let allExpanded = true;
      let anyChanged = false;
      
      // 更新expandedKeys，确保包含所有应该展开的节点
      if (!deepEqual(expandedKeys.value, shouldBeExpanded)) {
        expandedKeys.value = [...shouldBeExpanded];
        anyChanged = true;
      }
      
      for (const key of shouldBeExpanded) {
        try {
          const node = treeRef.value.getNode(key);
          if (node && !node.expanded) {
            allExpanded = false;
            // 尝试展开节点
            node.expand();
            anyChanged = true;
          }
        } catch (e) {
          // 忽略错误
        }
      }
      
      // 如果有任何变化，强制更新树
      if (anyChanged) {
        treeRef.value.setExpandedKeys(shouldBeExpanded);
        if (treeRef.value.$forceUpdate) {
          treeRef.value.$forceUpdate();
        }
      }
      
      if (allExpanded && !anyChanged) {
        // 如果所有节点都已展开且没有变化，则可以停止检查
        if (stateCheckInterval) {
          console.log('所有节点已正确展开，停止检查');
          clearInterval(stateCheckInterval);
          stateCheckInterval = null;
        }
      }
    }
  }, 300);
  
  // 添加window resize事件监听
  window.addEventListener('resize', hackExpandAfterUpdate);
});

// 在组件卸载前清理
onBeforeUnmount(() => {
  // 清理定时器
  if (stateCheckInterval) {
    clearInterval(stateCheckInterval);
    stateCheckInterval = null;
  }
  
  // 移除事件监听
  window.removeEventListener('resize', hackExpandAfterUpdate);
  
  // 清理本地存储
  localStorage.removeItem('region_expanded_keys');
  localStorage.removeItem('region_selected_node_key');
  
  // 清除所有监听器
  if (watchProvinces) watchProvinces();
  if (watchTreeData) watchTreeData();
});

// 删除省份
const deleteProvince = async (id) => {
  try {
    // 保存当前展开的节点keys
    const currentExpandedKeys = [...expandedKeys.value];
    const nodeKey = `province_${id}`;
    
    const response = await request({
      url: `/region/province/${id}`,
      method: 'delete'
    });
    
    if (response.code === 200) {
      ElMessage.success('省份删除成功');
      if (selectedNode.value && selectedNode.value.id === id && selectedNode.value.level === 1) {
         selectedNode.value = null;
         selectedNodeId.value = null;
         selectedNodeKey.value = null;
      }
      
      // 移除被删除的省份及其城市和区域的key
      const filteredKeys = currentExpandedKeys.filter(key => 
        !key.startsWith(`province_${id}`) && 
        !key.includes(`city_`) || !cities.value.find(c => c.provinceId === id && key === `city_${c.id}`) &&
        !key.includes(`district_`) || !districts.value.find(d => provinces.value.find(p => p.id === id) && cities.value.find(c => c.provinceId === id && c.id === d.cityId) && key === `district_${d.id}`)
      );
      
      // 确保包含所有其他省份节点
      provinces.value.filter(p => p.id !== id).forEach(province => {
        const provinceKey = `province_${province.id}`;
        if (!filteredKeys.includes(provinceKey)) {
          filteredKeys.push(provinceKey);
        }
      });
      
      // 确保包含所有其他城市节点
      cities.value.filter(c => c.provinceId !== id).forEach(city => {
        const cityKey = `city_${city.id}`;
        if (!filteredKeys.includes(cityKey)) {
          filteredKeys.push(cityKey);
        }
      });
      
      // 保存到本地存储
      localStorage.setItem('region_expanded_keys', JSON.stringify(filteredKeys));
      
      await loadProvinces(filteredKeys);
      
      // 强制应用展开状态
      setTimeout(() => {
        applyExpandedState();
      }, 200);
    } else {
      ElMessage.error(response.message || '删除省份失败');
    }
  } catch (error) {
    console.error('删除省份出错:', error);
    ElMessage.error('删除省份失败');
  }
};

// 删除城市
const deleteCity = async (id) => {
  try {
    // 保存当前展开的节点keys
    const currentExpandedKeys = [...expandedKeys.value];
    const nodeKey = `city_${id}`;
    
    // 查找要删除的城市
    const cityToDelete = cities.value.find(c => c.id === id);
    
    const response = await request({
      url: `/region/city/${id}`,
      method: 'delete'
    });
    
    if (response.code === 200) {
      ElMessage.success('城市删除成功');
      if (selectedNode.value && selectedNode.value.id === id && selectedNode.value.level === 2) {
         selectedNode.value = null;
         selectedNodeId.value = null;
         selectedNodeKey.value = null;
      }
      
      // 移除被删除的城市及其区域的key
      const filteredKeys = currentExpandedKeys.filter(key => 
        !key.startsWith(`city_${id}`) && 
        !key.includes(`district_`) || !districts.value.find(d => d.cityId === id && key === `district_${d.id}`)
      );
      
      // 确保包含所有省份节点
      provinces.value.forEach(province => {
        const provinceKey = `province_${province.id}`;
        if (!filteredKeys.includes(provinceKey)) {
          filteredKeys.push(provinceKey);
        }
      });
      
      // 确保包含所有其他城市节点
      cities.value.filter(c => c.id !== id).forEach(city => {
        const cityKey = `city_${city.id}`;
        if (!filteredKeys.includes(cityKey)) {
          filteredKeys.push(cityKey);
        }
      });
      
      // 保存到本地存储
      localStorage.setItem('region_expanded_keys', JSON.stringify(filteredKeys));
      
      await loadAllCities(filteredKeys);
      
      // 强制应用展开状态
      setTimeout(() => {
        applyExpandedState();
      }, 200);
    } else {
      ElMessage.error(response.message || '删除城市失败');
    }
  } catch (error) {
    console.error('删除城市出错:', error);
    ElMessage.error('删除城市失败');
  }
};

// 删除区域
const deleteDistrict = async (id) => {
  try {
    // 保存当前展开的节点keys
    const currentExpandedKeys = [...expandedKeys.value];
    const nodeKey = `district_${id}`;
    
    // 找到要删除的区域数据
    const districtToDelete = districts.value.find(d => d.id === id);
    
    const response = await request({
      url: `/region/district/${id}`,
      method: 'delete'
    });
    
    if (response.code === 200) {
      ElMessage.success('区域删除成功');
      if (selectedNode.value && selectedNode.value.id === id && selectedNode.value.level === 3) {
         selectedNode.value = null;
         selectedNodeId.value = null;
         selectedNodeKey.value = null;
      }
      
      // 从展开的keys中仅移除被删除的区域key
      const filteredKeys = currentExpandedKeys.filter(key => key !== nodeKey);
      
      // 确保包含所有省份和城市节点
      provinces.value.forEach(province => {
        const provinceKey = `province_${province.id}`;
        if (!filteredKeys.includes(provinceKey)) {
          filteredKeys.push(provinceKey);
        }
      });
      
      cities.value.forEach(city => {
        const cityKey = `city_${city.id}`;
        if (!filteredKeys.includes(cityKey)) {
          filteredKeys.push(cityKey);
        }
      });
      
      // 保存到本地存储
      localStorage.setItem('region_expanded_keys', JSON.stringify(filteredKeys));
      
      await loadAllDistricts(filteredKeys);
      
      // 强制应用展开状态
      setTimeout(() => {
        applyExpandedState();
      }, 200);
    } else {
      ElMessage.error(response.message || '删除区域失败');
    }
  } catch (error) {
    console.error('删除区域出错:', error);
    ElMessage.error('删除区域失败');
  }
};

// 监听树相关变化
const watchProvinces = watch(() => provinces.value, (newVal, oldVal) => {
  if (newVal && newVal.length > 0) {
    console.log('省份数据变化，保持现有展开状态');
  }
});

const watchTreeData = watch(() => regionTreeData.value, (newVal, oldVal) => {
  if (newVal && newVal.length > 0) {
    console.log('树数据加载完成，当前展开状态:', expandedKeys.value);
    
    // 确保DOM更新后设置选中和展开状态
    nextTick(() => {
      // 尝试应用展开状态
      applyExpandedState();
      
      // 如果有选中的节点，设置当前选中
      if (selectedNodeKey.value) {
        if (treeRef.value) {
          console.log('设置当前选中节点:', selectedNodeKey.value);
          treeRef.value.setCurrentKey(selectedNodeKey.value);
        }
      }
    });
  }
});
</script>

<style scoped>
.region-management {
  padding: 20px;
}

.region-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.region-tree-container {
  display: flex;
  gap: 20px;
  height: 600px;
}

.region-tree-panel {
  width: 300px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tree-header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.region-tree {
  padding: 10px;
  flex: 1;
  overflow: auto;
}

.tree-node-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  user-select: none; /* 禁止用户选择文本 */
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE/Edge */
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node-label:hover .node-actions {
  opacity: 1;
}

.region-details-panel {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.details-header {
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.details-content {
  padding: 16px;
  flex: 1;
  overflow: auto;
}

.no-selection-tip {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.node-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.details-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.node-selected {
  color: #409eff;
  font-weight: bold;
}
</style> 