<template>
  <div class="contract-list">
    <h2>我的合同</h2>
    
    <div class="filter">
      <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
        <el-option label="待签署" value="PENDING" />
        <el-option label="已签署" value="SIGNED" />
        <el-option label="已终止" value="TERMINATED" />
      </el-select>
      <el-button type="primary" @click="fetchContractList">查询</el-button>
    </div>
    
    <el-table :data="contractList" border stripe v-loading="loading">
      <el-table-column prop="contractNo" label="合同编号" width="180" />
      <el-table-column prop="houseTitle" label="房源">
        <template #default="scope">
          {{ scope.row.houseTitle }}
          <span v-if="scope.row.houseDeleted" class="deleted-badge">(已删除)</span>
        </template>
      </el-table-column>
      <el-table-column label="房东" width="120">
        <template #default="scope">
          {{ scope.row.landlordName }}
        </template>
      </el-table-column>
      <el-table-column label="租期" width="240">
        <template #default="scope">
          {{ formatDate(scope.row.startDate) }} 至 {{ formatDate(scope.row.endDate) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status, scope.row.houseDeleted)">
            {{ getStatusText(scope.row.status, scope.row.houseDeleted) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <div v-if="scope.row.houseDeleted">
            <el-tag type="info" size="small">房源已删除</el-tag>
          </div>
          <div v-else>
            <el-button size="small" @click="viewContract(scope.row)">查看</el-button>
            <el-button 
              v-if="scope.row.status === 'PENDING'" 
              size="small" 
              type="primary" 
              @click="goToSignPage(scope.row)"
            >
              签署
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 查看合同弹窗 -->
    <el-dialog 
      v-model="contractVisible" 
      title="合同详情" 
      width="80%"
    >
      <template v-if="currentContract">
        <div class="contract-info">
          <div class="info-item">
            <span class="label">合同编号：</span>
            <span>{{ currentContract.contractNo }}</span>
          </div>
          <div class="info-item">
            <span class="label">房源：</span>
            <span>{{ currentContract.houseTitle }}</span>
          </div>
          <div class="info-item">
            <span class="label">房东：</span>
            <span>{{ currentContract.landlordName }}</span>
          </div>
          <div class="info-item">
            <span class="label">租期：</span>
            <span>{{ formatDate(currentContract.startDate) }} 至 {{ formatDate(currentContract.endDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态：</span>
            <el-tag :type="getStatusType(currentContract.status, currentContract.houseDeleted)">
              {{ getStatusText(currentContract.status, currentContract.houseDeleted) }}
            </el-tag>
            <el-tag v-if="currentContract.houseDeleted" type="info" style="margin-left: 10px;">房源已删除</el-tag>
          </div>
          <div class="info-item" v-if="currentContract.signDate">
            <span class="label">签署时间：</span>
            <span>{{ formatDateTime(currentContract.signDate) }}</span>
          </div>
        </div>

        <div class="contract-content">
          <div v-html="currentContract.filledContent"></div>
        </div>

        <div v-if="currentContract.status !== 'PENDING'" class="signatures">
          <div class="signature" v-if="currentContract.partyASignature">
            <p>甲方签名：</p>
            <img :src="currentContract.partyASignature" alt="甲方签名" />
          </div>
          <div class="signature" v-if="currentContract.partyBSignature">
            <p>乙方签名：</p>
            <img :src="currentContract.partyBSignature" alt="乙方签名" />
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getUserContracts, getUserContract } from '@/api/contract';

const router = useRouter();

// 状态变量
const loading = ref(false);
const contractList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const statusFilter = ref('');
const contractVisible = ref(false);
const currentContract = ref(null);

// 初始化
onMounted(() => {
  fetchContractList();
});

// 获取合同列表
const fetchContractList = async () => {
  loading.value = true;
  try {
    const res = await getUserContracts({
      page: currentPage.value,
      size: pageSize.value,
      status: statusFilter.value
    });
    if (res.code === 200) {
      contractList.value = res.data.records || [];
      total.value = res.data.total || 0;
    } else {
      ElMessage.error(res.message || '获取合同列表失败');
    }
  } catch (error) {
    console.error('获取合同列表失败', error);
    ElMessage.error('获取合同列表失败');
  } finally {
    loading.value = false;
  }
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchContractList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchContractList();
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

// 获取状态对应的样式
const getStatusType = (status, houseDeleted) => {
  // 如果房源已删除，返回灰色样式
  if (houseDeleted) {
    return 'info';
  }
  
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'SIGNED':
      return 'success';
    case 'TERMINATED':
      return 'danger';
    default:
      return 'info';
  }
};

// 获取状态对应的文本
const getStatusText = (status, houseDeleted) => {
  // 如果房源已删除，显示"已删除"
  if (houseDeleted) {
    return '已删除';
  }
  
  switch (status) {
    case 'PENDING':
      return '待签署';
    case 'SIGNED':
      return '已签署';
    case 'TERMINATED':
      return '已终止';
    default:
      return '状态' + status;
  }
};

// 查看合同详情
const viewContract = async (contract) => {
  try {
    const res = await getUserContract(contract.id);
    if (res.code === 200) {
      currentContract.value = res.data;
      contractVisible.value = true;
    } else {
      ElMessage.error(res.message || '获取合同详情失败');
    }
  } catch (error) {
    console.error('获取合同详情失败', error);
    ElMessage.error('获取合同详情失败');
  }
};

// 跳转到签署页面
const goToSignPage = (contract) => {
  // 通过查询参数传递订单ID
  router.push({
    name: 'UserContractSign',
    query: { orderId: contract.orderId }
  });
};
</script>

<style scoped>
.contract-list {
  padding: 20px;
}

.filter {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.contract-info {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
  margin-right: 10px;
}

.contract-content {
  border: 1px solid #eee;
  padding: 20px;
  background-color: #fff;
  max-height: 500px;
  overflow-y: auto;
}

.signatures {
  margin-top: 20px;
  display: flex;
  justify-content: space-around;
}

.signature {
  text-align: center;
}

.signature img {
  max-width: 200px;
  max-height: 100px;
  border: 1px solid #ddd;
  padding: 5px;
}

.deleted-badge {
  color: #f56c6c;
  margin-left: 5px;
  font-size: 12px;
}
</style> 