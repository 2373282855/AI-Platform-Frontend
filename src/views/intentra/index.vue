<template>
  <div class="app-container">
    <el-container style="height: calc(100vh - 120px)">
      <!-- 左侧目录树 -->
      <el-aside width="240px" style="background-color: #fcfcfc; border-right: 1px solid #eee; padding: 10px">
        <div class="tree-header">
            <span>功能模块</span>
            <!-- 预留这一步：增加节点的按钮，先不做复杂交互 -->
            <el-button type="primary" link size="small" @click="ElMessage.info('暂未开放新增目录')">+</el-button>
        </div>
        <el-tree
          :data="treeData"
          :props="defaultProps"
          default-expand-all
          highlight-current
          @node-click="handleNodeClick"
        />
      </el-aside>

      <!-- 右侧内容区 -->
      <el-main style="padding: 20px">
        <!-- 如果没选中节点，或者是目录节点 -->
        <div v-if="!currentNode || currentNode.level < 3" class="empty-tip">
          <el-empty description="请选择左侧的具体【类型】节点 (如: 压测)" />
        </div>

        <!-- 选中了具体类型节点，显示用例列表 -->
        <div v-else class="case-area">
          <h3>{{ currentNode.label }} - 用例列表</h3>
          
          <!-- 用例列表 -->
          <el-table :data="caseList" style="width: 100%; margin-bottom: 20px" border>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="title" label="用例标题" />
            <el-table-column prop="update_time" label="更新时间" width="180">
                <template #default="scope">
                    {{ new Date(scope.row.update_time).toLocaleString() }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
                <el-button size="small" type="success" :loading="running[scope.row.id]" @click="handleRun(scope.row)">执行</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-button type="primary" style="width: 100%" @click="openEdit(null)">+ 新增用例</el-button>

          <!-- 编辑/新增用例的弹窗 -->
          <el-dialog
            v-model="dialogVisible"
            :title="editForm.id ? '编辑用例' : '新增用例'"
            width="60%"
          >
            <el-form :model="editForm" label-width="80px">
              <el-form-item label="标题">
                <el-input v-model="editForm.title" placeholder="如：拼贴保存压测" />
              </el-form-item>
              <el-form-item label="用例步骤">
                <el-input
                  v-model="editForm.content"
                  type="textarea"
                  :rows="15"
                  placeholder="在此输入 intentra case 文本..."
                  style="font-family: monospace;"
                />
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
              </span>
            </template>
          </el-dialog>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getTree, getCaseList, saveCase, runCase } from '@/api/intentra';

// --- 数据定义 ---
const treeData = ref([]);
const currentNode = ref<any>(null);
const caseList = ref([]);
const dialogVisible = ref(false);
const saving = ref(false);
const running = reactive<Record<number, boolean>>({}); // 记录每个任务的执行状态

const defaultProps = {
  children: 'children',
  label: 'label',
};

const editForm = reactive({
  id: null,
  module_id: 0,
  title: '',
  content: ''
});

// --- 初始化 ---
onMounted(async () => {
    refreshTree();
});

const refreshTree = async () => {
    const res = await getTree();
    // 如果后端还没数据，给个假数据方便调试
    if (!res.data || res.data.length === 0) {
        // [调试用] 构造一个假树，如果后端表是空的
        treeData.value = [
            {
                id: 1, label: '修图', level: 1, children: [
                    { id: 2, label: '配方', level: 2, children: [
                        { id: 3, label: '压测', level: 3 },
                        { id: 4, label: '回归', level: 3 }
                    ]}
                ]
            }
        ];
    } else {
        treeData.value = res.data;
    }
};

// --- 事件处理 ---
const handleNodeClick = async (data: any) => {
    currentNode.value = data;
    // 只有点击了第3级节点（类型），才加载列表
    if (data.level === 3) {
        loadCases(data.id);
    }
};

const loadCases = async (moduleId: number) => {
    const res = await getCaseList(moduleId);
    caseList.value = res.data;
};

// 打开编辑窗口
const openEdit = (row: any) => {
    if (row) {
        editForm.id = row.id;
        editForm.title = row.title;
        editForm.content = row.content;
    } else {
        editForm.id = null;
        editForm.title = '';
        editForm.content = '';
    }
    editForm.module_id = currentNode.value.id; // 关联到当前选中的目录
    dialogVisible.value = true;
};

// 保存
const handleSave = async () => {
    if (!editForm.title || !editForm.content) {
        return ElMessage.warning("标题和内容不能为空");
    }
    saving.value = true;
    try {
        await saveCase(editForm);
        ElMessage.success("保存成功");
        dialogVisible.value = false;
        loadCases(currentNode.value.id); // 刷新列表
    } finally {
        saving.value = false;
    }
};

// 执行
const handleRun = async (row: any) => {
    running[row.id] = true;
    try {
        const res = await runCase({ case_id: row.id, device_id: "" });
        ElMessage.success("指令已下发: " + res.data.cmd);
    } catch(e) {
        // 错误处理通常在 request.ts 里统一做了，这里也可以补一个
    } finally {
        running[row.id] = false;
    }
};
</script>

<style scoped>
.app-container {
    background: #fff;
    margin: 10px;
    border-radius: 4px;
}
.tree-header {
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 10px;
    font-weight: bold;
    color: #606266;
}
.empty-tip {
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
}
</style>