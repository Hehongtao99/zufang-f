<template>
  <div class="contract-template-list">
    <h2>合同模板管理</h2>
    
    <div class="operations">
      <el-button type="primary" @click="openCreateDialog">新建模板</el-button>
    </div>
    
    <el-table :data="templateList" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="模板名称" />
      <el-table-column label="创建时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="scope">
          {{ formatDateTime(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button size="small" @click="previewTemplate(scope.row)">预览</el-button>
          <el-button size="small" type="primary" @click="editTemplate(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="confirmDeleteTemplate(scope.row.id)">删除</el-button>
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

    <!-- 创建/编辑模板弹窗 -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="isEdit ? '编辑合同模板' : '创建合同模板'" 
      width="80%"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="模板名称" required>
          <el-input v-model="formData.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板内容" required>
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="15"
            placeholder="请输入合同模板内容，可以使用变量{{变量名}}，例如：{{userName}}、{{landlordName}}、{{houseTitle}}等"
          />
        </el-form-item>
        <el-form-item label="变量说明">
          <p class="variable-tip">支持的变量：</p>
          <ul class="variable-list">
            <li><strong>{{userName}}</strong> - 租客姓名</li>
            <li><strong>{{landlordName}}</strong> - 房东姓名</li>
            <li><strong>{{houseTitle}}</strong> - 房源标题</li>
            <li><strong>{{houseAddress}}</strong> - 房源地址</li>
            <li><strong>{{startDate}}</strong> - 租期开始日期</li>
            <li><strong>{{endDate}}</strong> - 租期结束日期</li>
            <li><strong>{{rentAmount}}</strong> - 月租金</li>
            <li><strong>{{depositAmount}}</strong> - 押金</li>
          </ul>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTemplate">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预览模板弹窗 -->
    <el-dialog 
      v-model="previewDialogVisible" 
      title="模板预览"
      width="60%"
    >
      <div v-if="previewData" class="template-preview">
        <h3>{{ previewData.name }}</h3>
        <div class="template-preview-title">模板内容预览：</div>
        <div class="template-content">
          <div v-html="previewData.content"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  getContractTemplates, 
  getContractTemplate, 
  createContractTemplate, 
  updateContractTemplate, 
  deleteContractTemplate 
} from '@/api/contract';

// 状态变量
const loading = ref(false);
const templateList = ref([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const editDialogVisible = ref(false);
const previewDialogVisible = ref(false);
const isEdit = ref(false);
const formData = ref({
  id: null,
  name: '',
  content: ''
});
const previewData = ref({
  id: null,
  name: '',
  content: ''
});

// 初始化
onMounted(() => {
  fetchTemplateList();
});

// 获取模板列表
const fetchTemplateList = async () => {
  loading.value = true;
  try {
    const res = await getContractTemplates({
      page: currentPage.value,
      size: pageSize.value
    });
    templateList.value = res.data.records;
    total.value = res.data.total;
  } catch (error) {
    console.error('获取合同模板列表失败', error);
    ElMessage.error('获取合同模板列表失败');
  } finally {
    loading.value = false;
  }
};

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchTemplateList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchTemplateList();
};

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString();
};

// 打开创建对话框
const openCreateDialog = () => {
  isEdit.value = false;
  formData.value = {
    id: null,
    name: '',
    content: ''
  };
  editDialogVisible.value = true;
};

// 编辑模板
const editTemplate = async (template) => {
  try {
    const res = await getContractTemplate(template.id);
    isEdit.value = true;
    formData.value = { ...res.data };
    editDialogVisible.value = true;
  } catch (error) {
    console.error('获取模板详情失败', error);
    ElMessage.error('获取模板详情失败');
  }
};

// 预览模板
const previewTemplate = async (template) => {
  try {
    const res = await getContractTemplate(template.id);
    previewData.value = { ...res.data };
    // 替换变量占位符并保存模板内容
    let content = previewData.value.content;
    // 正则表达式匹配${...}形式的变量占位符
    content = content.replace(/\$\{([^}]+)\}/g, 'xxx');
    
    // 将替换后的内容存储到预览内容变量
    previewData.value.content = content;
    previewDialogVisible.value = true;
  } catch (error) {
    console.error('获取模板详情失败', error);
    ElMessage.error('获取模板详情失败');
  }
};

// 保存模板
const saveTemplate = async () => {
  if (!formData.value.name || !formData.value.content) {
    ElMessage.warning('请填写模板名称和内容');
    return;
  }

  try {
    if (isEdit.value) {
      await updateContractTemplate(formData.value.id, formData.value);
      ElMessage.success('更新模板成功');
    } else {
      await createContractTemplate(formData.value);
      ElMessage.success('创建模板成功');
    }
    editDialogVisible.value = false;
    fetchTemplateList();
  } catch (error) {
    console.error('保存模板失败', error);
    ElMessage.error('保存模板失败');
  }
};

// 确认删除模板
const confirmDeleteTemplate = (id) => {
  ElMessageBox.confirm('确定要删除该模板吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteTemplateById(id);
  }).catch(() => {});
};

// 删除模板
const deleteTemplateById = async (id) => {
  try {
    await deleteContractTemplate(id);
    ElMessage.success('删除模板成功');
    fetchTemplateList();
  } catch (error) {
    console.error('删除模板失败', error);
    ElMessage.error('删除模板失败');
  }
};
</script>

<style scoped>
.contract-template-list {
  padding: 20px;
}

.operations {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.template-preview {
  padding: 20px;
}

.template-preview-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  color: #606266;
}

.template-content {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fff;
  max-height: 400px;
  overflow-y: auto;
}

.template-content > div {
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

.template-content h1, 
.template-content h2, 
.template-content h3, 
.template-content h4 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.template-content p {
  margin-bottom: 1em;
}

.template-content ul, 
.template-content ol {
  padding-left: 20px;
  margin-bottom: 1em;
}

.template-content table {
  border-collapse: collapse;
  width: 100%;
}

.template-content th,
.template-content td {
  border: 1px solid #dcdfe6;
  padding: 8px;
  text-align: left;
}

.variable-tip {
  margin-bottom: 5px;
  font-weight: bold;
}

.variable-list {
  padding-left: 20px;
}

.variable-list li {
  margin-bottom: 5px;
}
</style> 