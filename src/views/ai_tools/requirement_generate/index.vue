<template>
  <div class="ai-container">
    <el-card class="top-nav-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <el-icon class="ai-icon"><Notebook /></el-icon>
          <span class="title">AI 需求生成用例</span>
        </div>
        <div class="header-actions">
          <el-button type="info" @click="viewHistory">
            <el-icon><Timer /></el-icon>
            生成历史结果
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="main-layout">
      <!-- 左侧配置与输入 -->
      <el-col :span="8">
        <el-card class="config-card" shadow="hover">
          <el-form label-position="top">
            <el-form-item label="选择 AI 模型">
              <el-radio-group v-model="form.type">
                <el-radio label="deepseek">deepseek</el-radio>
                <el-radio label="qwen">通义千问</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="用例类型">
              <el-radio-group v-model="form.case_type">
                <el-radio label="functional">功能测试用例</el-radio>
                <el-radio label="interface">接口测试用例</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="请输入需求内容">
              <div style="margin-bottom: 10px;">
                <el-upload
                  class="upload-demo"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleFileUpload"
                  accept=".txt,.docx"
                >
                  <el-button type="success" size="small">
                    <el-icon><Upload /></el-icon>
                    导入文档 (txt/docx)
                  </el-button>
                </el-upload>
              </div>
              <el-input
                v-model="form.text"
                type="textarea"
                :rows="15"
                placeholder="在此处输入详细的需求描述..."
              />
            </el-form-item>

            <div class="submit-section">
              <el-button 
                type="primary" 
                size="large" 
                class="submit-btn" 
                :loading="generating"
                @click="handleSubmit"
              >
                提交 AI 内容
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧结果展示 -->
      <el-col :span="16">
        <el-card class="result-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>生成结果预览</span>
              <div v-if="results.length > 0">
                <el-button type="success" size="small" @click="handleImportAll">一键导入用例库</el-button>
              </div>
            </div>
          </template>

          <el-table 
            v-if="results.length > 0" 
            :data="results" 
            border 
            stripe 
            style="width: 100%"
            height="650"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getCategoryTag(row.type)" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="input" label="输入数据" min-width="150">
                <template #default="{ row }">
                   <div v-for="(item, idx) in row.input" :key="idx">{{ item }}</div>
                </template>
            </el-table-column>
            <el-table-column prop="step" label="操作步骤" min-width="200">
              <template #default="{ row }">
                <div class="step-list">
                  <div v-for="(s, idx) in row.step" :key="idx" class="step-item">
                    {{ idx + 1 }}. {{ s }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="expected" label="预期结果" min-width="150" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleImportSingle(row)">导入</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-else description="等待提交需求进行生成" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importVisible" title="导入到项目" width="450px">
      <el-form label-width="100px">
        <el-form-item label="目标模块">
          <el-tree-select
            v-model="importModuleId"
            :data="treeData"
            :props="{ label: 'label', children: 'children', value: 'id' }"
            placeholder="请选择导入的模块"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 历史记录弹窗 -->
    <el-dialog v-model="historyVisible" title="历史生成结果" width="80%">
      <el-table :data="historyData" border v-loading="loadingHistory">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column property="text" label="需求内容" show-overflow-tooltip />
        <el-table-column property="create_time" label="生成时间" width="180" />
        <el-table-column property="user" label="操作人" width="100" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="viewHistoryDetail(row)">查看结果</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Notebook, Timer, Upload } from '@element-plus/icons-vue';
import { getTree, saveCase } from '@/api/intentra';
import request from "@/utils/axios.ts";

const form = reactive({
  type: 'deepseek',
  case_type: 'functional',
  text: ''
});

const generating = ref(false);
const results = ref<any[]>([]);
const historyVisible = ref(false);
const historyData = ref<any[]>([]);
const loadingHistory = ref(false);

const importVisible = ref(false);
const importModuleId = ref<number | null>(null);
const currentImportItem = ref<any>(null);
const treeData = ref([]);

onMounted(async () => {
  const res = await getTree();
  treeData.value = res.data;
});

const getCategoryTag = (cat: string) => {
  if (cat?.includes('正常')) return 'success';
  if (cat?.includes('异常')) return 'danger';
  if (cat?.includes('边界')) return 'warning';
  if (cat?.includes('安全')) return 'info';
  return '';
};

const handleSubmit = async () => {
  if (!form.text.trim()) return ElMessage.warning('请输入需求内容');
  
  generating.value = true;
  try {
    // 调用本地后端 API (待实现)
    const res = await request.post("/api/ai/ai_case", {
        type: form.type,
        text: form.text
    });
    
    if (res.code === 200) {
        results.value = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        // 添加到本地会话历史记录
        historyData.value.unshift({
            text: form.text,
            create_time: new Date().toLocaleString(),
            user: '当前用户',
            result: JSON.stringify(results.value)
        });
        ElMessage.success('生成完毕！');
    } else {
        ElMessage.error(res.msg || '生成失败');
    }
  } catch (e: any) {
    ElMessage.error('服务异常');
    // 降级为模拟数据以便查看效果
    results.value = [
      {
        name: '模拟用例 - 登录测试',
        type: '正常流测试',
        input: ['手机号: 13800000000', '验证码: 123456'],
        step: ['输入手机号', '点击获取验证码', '输入验证码', '点击登录'],
        expected: '登录成功'
      }
    ];
  } finally {
    generating.value = false;
  }
};

const viewHistory = async () => {
  historyVisible.value = true;
  // 不再拉取参考站点的全局历史，仅展示当前会话产生的新增记录
  // loadingHistory.value = true;
  // try {
  //   const res = await request.post("/api/ai/ai_result", {
  //       type: form.type,
  //       currentPage: 1,
  //       pageSize: 50
  //   });
  //   historyData.value = res.data.content || [];
  // } catch (e) {
  //   ElMessage.error('加载历史记录失败');
  // } finally {
  //   loadingHistory.value = false;
  // }
};

const handleFileUpload = async (file: any) => {
  const rawFile = file.raw;
  if (!rawFile) return;

  const formData = new FormData();
  formData.append('file', rawFile);

  try {
    const res: any = await request.upload("/api/ai/parse_doc", formData);
    if (res.code === 200) {
      form.text = res.data;
      ElMessage.success('文档内容已导入');
    } else {
      ElMessage.error(res.message || '文档解析失败');
    }
  } catch (e: any) {
    ElMessage.error('服务连接异常，无法解析文档');
  }
};

const viewHistoryDetail = (row: any) => {
  try {
    results.value = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;
    historyVisible.value = false;
  } catch (e) {
    ElMessage.error('解析结果失败');
  }
};

const handleImportSingle = (row: any) => {
  currentImportItem.value = row;
  importVisible.value = true;
};

const handleImportAll = () => {
  currentImportItem.value = null;
  importVisible.value = true;
};

const confirmImport = async () => {
  if (!importModuleId.value) return ElMessage.warning('请选择目标模块');
  
  try {
    const itemsToImport = currentImportItem.value ? [currentImportItem.value] : results.value;
    
    for (const item of itemsToImport) {
      await saveCase({
        module_id: importModuleId.value,
        title: item.name,
        content: `【测试类型】\n${item.type}\n\n【输入数据】\n${item.input?.join('\n') || '-'}\n\n【测试步骤】\n${item.step?.join('\n') || '-'}\n\n【预期结果】\n${item.expected}`,
        status: 1
      });
    }
    
    ElMessage.success(`导入成功，共导入 ${itemsToImport.length} 条用例`);
    importVisible.value = false;
  } catch (e: any) {
    ElMessage.error('导入失败');
  }
};
</script>

<style scoped>
.ai-container {
  padding: 16px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
}

.top-nav-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-icon {
  font-size: 24px;
  color: #409eff;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.config-card {
  border-radius: 12px;
}

.submit-section {
  margin-top: 30px;
}

.submit-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
  border: none;
  font-weight: 600;
}

.result-card {
  border-radius: 12px;
  min-height: 750px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.step-item {
  margin-bottom: 4px;
}

.main-layout {
  height: calc(100vh - 200px);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
}
</style>
