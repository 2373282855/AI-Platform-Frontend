<template>
  <div class="intentra-container">
    <el-container style="height: 100%">
      <!-- 左侧目录树 -->
      <el-aside width="280px" class="tree-aside">
      <div class="tree-header">
        <span class="tree-title">功能模块</span>
        <el-button type="primary" size="small" link @click="handleAddRootModule">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
        <el-scrollbar height="calc(100vh - 200px)">
          <el-tree
            :data="treeData"
            :props="{ children: 'children', label: 'label' }"
            node-key="id"
            default-expand-all
            highlight-current
            @node-click="handleNodeClick"
            @node-contextmenu="handleNodeRightClick"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <el-icon v-if="data.level === 1"><Folder /></el-icon>
                <el-icon v-else-if="data.level === 2"><FolderOpened /></el-icon>
                <el-icon v-else><Document /></el-icon>
                <span style="margin-left: 8px">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-scrollbar>
      </el-aside>

      <!-- 右侧内容 -->
      <el-main class="main-content">
        <!-- 顶部操作栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用例名称"
              style="width: 300px"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 150px; margin-left: 10px" @change="loadCases">
              <el-option label="全部" value="" />
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </div>
          <div class="toolbar-right">
            <el-button type="primary" @click="handleAdd" :disabled="!currentNode || currentNode.level < 3">
              <el-icon><Plus /></el-icon>
              新增用例
            </el-button>
          </div>
        </div>

        <!-- 用例列表 -->
        <el-table
          :data="caseList"
          border
          stripe
          v-loading="loading"
          style="width: 100%; margin-top: 15px"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="title" label="用例名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="创建时间" width="180" align="center">
            <template #default="{ row }">
              {{ formatTime(row.create_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="update_time" label="更新时间" width="180" align="center">
            <template #default="{ row }">
              {{ formatTime(row.update_time) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="success" size="small" link @click="handleRun(row)">
                <el-icon><VideoPlay /></el-icon>
                立即运行
              </el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="limit"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadCases"
            @current-change="loadCases"
          />
        </div>
      </el-main>
    </el-container>

    <!-- 编辑/新增弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editForm.id ? '编辑用例' : '新增用例'"
      width="75%"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="editForm" label-width="100px" :rules="rules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用例名称" prop="title">
              <el-input v-model="editForm.title" placeholder="请输入用例名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="editForm.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用例步骤" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="20"
            placeholder="请输入 Intentra 用例步骤内容..."
            style="font-family: 'Monaco', 'Menlo', 'Consolas', monospace; font-size: 13px; line-height: 1.6"
          />
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            <el-icon><InfoFilled /></el-icon>
            提示：每行一个操作步骤，支持自然语言描述
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 设备选择弹窗 -->
    <el-dialog v-model="deviceDialogVisible" title="选择执行设备" width="600px" :close-on-click-modal="false">
      <el-alert
        title="请选择要执行自动化的设备"
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
    <!-- 模块管理弹窗 -->
<el-dialog
  v-model="moduleDialogVisible"
  :title="moduleForm.id ? '编辑模块' : '新增模块'"
  width="400px"
>
  <el-form :model="moduleForm" label-width="80px">
    <el-form-item label="模块名称">
      <el-input v-model="moduleForm.name" placeholder="请输入模块名称" />
    </el-form-item>
  </el-form>
  <template #footer>
    <el-button @click="moduleDialogVisible = false">取消</el-button>
    <el-button type="primary" @click="handleSaveModule">保存</el-button>
  </template>
</el-dialog>

<!-- 右键菜单 -->
<ul
  v-show="contextMenuVisible"
  :style="{ left: contextMenuLeft + 'px', top: contextMenuTop + 'px' }"
  class="context-menu"
>
  <li @click="handleAddChild" v-if="rightClickNode && rightClickNode.level < 3">
    <el-icon><Plus /></el-icon>
    添加子模块
  </li>
  <li @click="handleEditModule">
    <el-icon><Edit /></el-icon>
    编辑
  </li>
  <li @click="handleDeleteModule" style="color: #f56c6c">
    <el-icon><Delete /></el-icon>
    删除
  </li>
</ul>
  </div>
</template>

<script setup lang="ts">
import { saveModule, deleteModule } from '@/api/intentra';
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Folder,
  FolderOpened,
  Document,
  Search,
  Plus,
  Edit,
  VideoPlay,
  Delete,
  InfoFilled
} from '@element-plus/icons-vue';
import { getTree, getCaseList, saveCase, deleteCase, getDevices, runCase } from '@/api/intentra';

const treeData = ref([]);
const currentNode = ref<any>(null);
const caseList = ref([]);
const loading = ref(false);
const page = ref(1);
const limit = ref(20);
const total = ref(0);
const searchKeyword = ref('');
const statusFilter = ref('');

// 右键菜单相关
const contextMenuVisible = ref(false);
const contextMenuLeft = ref(0);
const contextMenuTop = ref(0);
const rightClickNode = ref<any>(null);

// 模块管理
const moduleDialogVisible = ref(false);
const moduleForm = reactive({
  id: null,
  name: '',
  parent_id: 0,
  level: 1
});

const dialogVisible = ref(false);
const saving = ref(false);
const formRef = ref();
const editForm = reactive({
  id: null,
  module_id: 0,
  title: '',
  content: '',
  status: 1
});

const rules = {
  title: [{ required: true, message: '请输入用例名称', trigger: 'blur' }],
  content: [{ required: true, message: '请输入用例步骤', trigger: 'blur' }]
};

const deviceDialogVisible = ref(false);
const devices = ref([]);
const loadingDevices = ref(false);
const currentRunCase = ref<any>(null);

// 初始化（只保留一个 onMounted）
onMounted(() => {
  loadTree();
  document.addEventListener('click', () => {
    contextMenuVisible.value = false;
  });
});

const loadTree = async () => {
  const res = await getTree();
  treeData.value = res.data;
};

const handleNodeClick = (data: any) => {
  currentNode.value = data;
  if (data.level === 3) {
    page.value = 1;
    loadCases();
  }
};

// 添加根模块
const handleAddRootModule = () => {
  Object.assign(moduleForm, {
    id: null,
    name: '',
    parent_id: 0,
    level: 1
  });
  moduleDialogVisible.value = true;
};

const loadCases = async () => {
  if (!currentNode.value || currentNode.value.level < 3) return;
  loading.value = true;
  try {
    const res = await getCaseList({
      module_id: currentNode.value.id,
      page: page.value,
      limit: limit.value,
      keyword: searchKeyword.value,
      status: statusFilter.value
    });
    caseList.value = res.data.list;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  loadCases();
};

const handleAdd = () => {
  Object.assign(editForm, {
    id: null,
    module_id: currentNode.value.id,
    title: '',
    content: '',
    status: 1
  });
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  Object.assign(editForm, {
    id: row.id,
    module_id: row.module_id,
    title: row.title,
    content: row.content,
    status: row.status
  });
  dialogVisible.value = true;
};

const handleSave = async () => {
  await formRef.value.validate();
  saving.value = true;
  try {
    await saveCase(editForm);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    loadCases();
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该用例吗？删除后无法恢复！', '删除确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
    await deleteCase(row.id);
    ElMessage.success('删除成功');
    loadCases();
  } catch {}
};

const handleRun = async (row: any) => {
  currentRunCase.value = row;
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
    await runCase({
      case_id: currentRunCase.value.id,
      device_id: row.serial
    });
    loading.close();
    ElMessage.success('任务已提交执行，请在"执行结果"页面查看进度');
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

// 右键点击树节点
const handleNodeRightClick = (event: MouseEvent, data: any) => {
  event.preventDefault();
  rightClickNode.value = data;
  contextMenuLeft.value = event.clientX;
  contextMenuTop.value = event.clientY;
  contextMenuVisible.value = true;
};

// 添加子模块
const handleAddChild = () => {
  Object.assign(moduleForm, {
    id: null,
    name: '',
    parent_id: rightClickNode.value.id,
    level: rightClickNode.value.level + 1
  });
  moduleDialogVisible.value = true;
  contextMenuVisible.value = false;
};

// 编辑模块
const handleEditModule = () => {
  Object.assign(moduleForm, {
    id: rightClickNode.value.id,
    name: rightClickNode.value.label,
    parent_id: rightClickNode.value.parent_id || 0,
    level: rightClickNode.value.level
  });
  moduleDialogVisible.value = true;
  contextMenuVisible.value = false;
};

// 保存模块
const handleSaveModule = async () => {
  if (!moduleForm.name) {
    return ElMessage.warning('请输入模块名称');
  }
  try {
    await saveModule(moduleForm);
    ElMessage.success('保存成功');
    moduleDialogVisible.value = false;
    loadTree();
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败');
  }
};

// 删除模块
const handleDeleteModule = async () => {
  try {
    await ElMessageBox.confirm('确定删除该模块吗？', '删除确认', {
      type: 'warning'
    });
    await deleteModule(rightClickNode.value.id);
    ElMessage.success('删除成功');
    loadTree();
  } catch {}
  contextMenuVisible.value = false;
};
</script>

<style scoped>
.intentra-container {
  height: calc(100vh - 120px);
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.tree-aside {
  background: #fafafa;
  border-right: 1px solid #e4e7ed;
  padding: 15px;
}

.tree-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.tree-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.main-content {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  margin: 0;
  list-style: none;
  z-index: 9999;
  min-width: 140px;
}

.context-menu li {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
}

.context-menu li:hover {
  background: #f5f7fa;
}

.context-menu li .el-icon {
  margin-right: 8px;
}
</style>