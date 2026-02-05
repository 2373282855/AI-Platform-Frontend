<template>
  <div class="suite-container">
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索测试集名称"
          style="width: 300px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新建测试集
        </el-button>
      </div>
    </div>

    <!-- 测试集列表 -->
    <el-table
      :data="filteredSuiteList"
      border
      stripe
      v-loading="loading"
      style="width: 100%; margin-top: 15px"
      :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="测试集名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
      <el-table-column prop="case_count" label="用例数量" width="100" align="center">
        <template #default="{ row }">
          <el-tag type="primary" size="small">{{ row.case_count }} 个</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatTime(row.create_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleViewCases(row)">
            <el-icon><View /></el-icon>
            查看用例
          </el-button>
          <el-button type="success" size="small" link @click="handleRun(row)">
            <el-icon><VideoPlay /></el-icon>
            立即执行
          </el-button>
          <el-button type="warning" size="small" link @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" size="small" link @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑/新增弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editForm.id ? '编辑测试集' : '新建测试集'"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="editForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="测试集名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入测试集名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入测试集描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看用例弹窗 -->
    <el-dialog
      v-model="casesDialogVisible"
      :title="`${currentSuite?.name} - 用例列表`"
      width="800px"
      destroy-on-close
    >
      <el-table :data="suiteCases" border stripe max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="用例名称" min-width="200" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="casesDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 设备选择弹窗 -->
    <el-dialog
      v-model="deviceDialogVisible"
      title="选择执行设备"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="`即将执行测试集: ${currentSuite?.name} (共 ${currentSuite?.case_count} 个用例)`"
        type="info"
        :closable="false"
        style="margin-bottom: 15px"
      />
      <el-table
        :data="devices"
        v-loading="loadingDevices"
        highlight-current-row
        @row-click="handleSelectDevice"
        style="cursor: pointer"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column prop="serial" label="设备序列号" min-width="180" />
        <el-table-column prop="model" label="设备型号" min-width="150" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="devices.length === 0 && !loadingDevices" description="未检测到设备，请确保已连接并开启 USB 调试" />
      <template #footer>
        <el-button @click="deviceDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Search,
  Plus,
  View,
  VideoPlay,
  Edit,
  Delete
} from '@element-plus/icons-vue';
import {
  getSuiteList,
  saveSuite,
  deleteSuite,
  getSuiteCases,
  runSuite,
  getDevices
} from '@/api/intentra';

const loading = ref(false);
const searchKeyword = ref('');
const suiteList = ref([]);
const dialogVisible = ref(false);
const saving = ref(false);
const formRef = ref();

const editForm = reactive({
  id: null,
  name: '',
  description: '',
  case_ids: []
});

const rules = {
  name: [{ required: true, message: '请输入测试集名称', trigger: 'blur' }]
};

// 查看用例相关
const casesDialogVisible = ref(false);
const suiteCases = ref([]);
const currentSuite = ref<any>(null);

// 设备选择相关
const deviceDialogVisible = ref(false);
const devices = ref([]);
const loadingDevices = ref(false);

// 过滤后的列表
const filteredSuiteList = computed(() => {
  if (!searchKeyword.value) return suiteList.value;
  return suiteList.value.filter((suite: any) =>
    suite.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

onMounted(() => {
  loadSuiteList();
});

const loadSuiteList = async () => {
  loading.value = true;
  try {
    const res = await getSuiteList();
    suiteList.value = res.data;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  // 搜索由 computed 自动处理
};

const handleAdd = () => {
  Object.assign(editForm, {
    id: null,
    name: '',
    description: '',
    case_ids: []
  });
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  Object.assign(editForm, {
    id: row.id,
    name: row.name,
    description: row.description,
    case_ids: [] // 编辑时保持原有用例
  });
  dialogVisible.value = true;
};

const handleSave = async () => {
  await formRef.value.validate();
  saving.value = true;
  try {
    await saveSuite(editForm);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    loadSuiteList();
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定删除测试集"${row.name}"吗？删除后无法恢复！`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
    await deleteSuite(row.id);
    ElMessage.success('删除成功');
    loadSuiteList();
  } catch {}
};

const handleViewCases = async (row: any) => {
  currentSuite.value = row;
  try {
    const res = await getSuiteCases(row.id);
    suiteCases.value = res.data;
    casesDialogVisible.value = true;
  } catch (e: any) {
    ElMessage.error('加载用例失败');
  }
};

const handleRun = async (row: any) => {
  currentSuite.value = row;
  loadingDevices.value = true;
  deviceDialogVisible.value = true;
  try {
    const res = await getDevices();
    devices.value = res.data;
    if (devices.value.length === 0) {
      ElMessage.warning('未检测到设备，请确保已连接并开启 USB 调试');
    }
  } finally {
    loadingDevices.value = false;
  }
};

const handleSelectDevice = async (row: any) => {
  deviceDialogVisible.value = false;
  const loading = ElMessage({
    message: '正在提交执行任务...',
    type: 'info',
    duration: 0
  });
  try {
    await runSuite({
      suite_id: currentSuite.value.id,
      device_id: row.serial
    });
    loading.close();
    ElMessage.success(
      `测试集已提交执行（共 ${currentSuite.value.case_count} 个用例），请在"执行结果"页面查看进度`
    );
  } catch (e: any) {
    loading.close();
    ElMessage.error(e.message || '执行失败');
  }
};

const formatTime = (time: string) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};
</script>

<style scoped>
.suite-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  min-height: calc(100vh - 120px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}
</style>
