<template>
  <div class="ai-container">
    <el-card class="top-nav-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <el-icon class="ai-icon"><MagicStick /></el-icon>
          <span class="title">AI 生成脚本</span>
        </div>
        <div class="model-select-section">
          <span class="label">选择 AI 模型：</span>
          <el-select v-model="selectedModel" style="width: 220px">
            <el-option-group label="主流大模型">
              <el-option label="DeepSeek-V3" value="deepseek-v3" />
              <el-option label="Claude 3.5 Sonnet" value="claude-3-5" />
              <el-option label="GPT-4o" value="gpt-4o" />
            </el-option-group>
            <el-option-group label="国产提效模型">
              <el-option label="通义千问 (Qwen-Plus)" value="qwen-plus" />
              <el-option label="文心一言 (Ernie-4.0)" value="ernie-4" />
            </el-option-group>
            <el-option-group label="其他">
              <el-option label="Gemini 1.5 Pro" value="gemini-1-5" />
            </el-option-group>
          </el-select>
        </div>
      </div>
    </el-card>

    <div class="main-layout">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>功能需求描述</span>
              <el-button type="primary" link @click="clearInput">清空</el-button>
            </div>
          </template>
          <el-input
            v-model="prompt"
            type="textarea"
            :rows="12"
            placeholder="请输入您的功能描述、产品文档内容或者直接粘贴测试需求...
例如：
1. 实现一个图片批量上传的功能。
2. 支持拖拽上传和点击选择上传。
3. 上传过程中显示进度条。
4. 成功后返回图片URL。"
          />
          <div class="prompt-tips">
            <p>💡 提示：描述越详细，AI 生成的用例覆盖度越高。</p>
          </div>
          <div class="action-bar">
            <el-button 
              type="primary" 
              size="large" 
              class="generate-btn" 
              :loading="generating"
              @click="handleGenerate"
            >
              <el-icon><Cpu /></el-icon>
              立即 AI 生成脚本
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 右侧结果预览 -->
      <div class="result-panel" v-loading="generating">
        <el-card class="panel-card result-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>AI 生成结果</span>
              <div v-if="generatedContent">
                <el-button type="success" size="small" @click="handleImport">导入到用例库</el-button>
                <el-button type="info" size="small" link @click="copyResult">复制内容</el-button>
              </div>
            </div>
          </template>
          
          <div v-if="!generatedContent" class="empty-status">
            <el-empty description="在左侧输入需求并点击生成" />
          </div>
          
          <div v-else class="content-preview markdown-body">
            <el-scrollbar height="600px">
              <pre class="content-text">{{ generatedContent }}</pre>
            </el-scrollbar>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importVisible" title="导入到用例管理" width="400px">
      <el-form label-width="80px">
        <el-form-item label="所属模块">
          <el-tree-select
            v-model="importModuleId"
            :data="treeData"
            :props="{ label: 'label', children: 'children', value: 'id' }"
            placeholder="请选择导入模块"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="用例名称">
          <el-input v-model="importTitle" placeholder="默认为需求首行内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { MagicStick, Cpu } from '@element-plus/icons-vue';
import { getTree, saveCase } from '@/api/intentra';
import request from "@/utils/axios.ts";

const selectedModel = ref('deepseek-v3');
const prompt = ref('');
const generating = ref(false);
const generatedContent = ref('');

const importVisible = ref(false);
const importModuleId = ref<number | null>(null);
const importTitle = ref('');
const treeData = ref([]);

onMounted(async () => {
  const res = await getTree();
  treeData.value = res.data;
});

const clearInput = () => {
  prompt.value = '';
};

const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      ElMessage.success('已复制到剪贴板');
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      ElMessage.success('已复制到剪贴板');
    }
  } catch (err) {
    ElMessage.error('复制失败');
  }
};

const handleGenerate = async () => {
  if (!prompt.value.trim()) {
    return ElMessage.warning('请输入功能需求描述');
  }
  
  generating.value = true;
  generatedContent.value = '';
  
  try {
    // 调用真实对接后端
    const res: any = await request.post("/api/ai/ai_script", {
        type: selectedModel.value.includes('deepseek') ? 'deepseek' : 'qwen',
        text: prompt.value
    });
    
    if (res.code === 200) {
        // 如果返回的是 JSON 字符串，尝试解析其中的 markdown
        let content = res.data;
        if (typeof content === 'string' && content.startsWith('[')) {
            // 如果返回的是用例列表格式，转为可阅读文本
            const cases = JSON.parse(content);
            generatedContent.value = cases.map((c: any) => `### ${c.name}\n${c.step.join('\n')}\n预期：${c.expected}`).join('\n\n');
        } else {
            generatedContent.value = content;
        }
        ElMessage.success('AI 脚本生成完毕！');
    } else {
        ElMessage.error('生成失败: ' + (res.msg || '未知错误'));
    }
  } catch (e: any) {
    ElMessage.error('服务异常，请检查后端状态');
  } finally {
    generating.value = false;
  }
};

const copyResult = () => {
  copyToClipboard(generatedContent.value);
};

const handleImport = () => {
  importTitle.value = prompt.value.split('\n')[0].substring(0, 20) || 'AI 生成用例';
  importVisible.value = true;
};

const confirmImport = async () => {
  if (!importModuleId.value) return ElMessage.warning('请选择模块');
  
  try {
    await saveCase({
      module_id: importModuleId.value,
      title: importTitle.value,
      content: generatedContent.value,
      status: 1
    });
    ElMessage.success('已成功导入到用例管理');
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
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.model-select-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  font-size: 14px;
  color: #64748b;
}

.main-layout {
  display: grid;
  grid-template-columns: 450px 1fr;
  gap: 20px;
}

.panel-card {
  border-radius: 12px;
  height: min-content;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.prompt-tips {
  margin-top: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.action-bar {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.generate-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  border: none;
  transition: transform 0.2s;
}

.generate-btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.result-card {
  min-height: 700px;
}

.empty-status {
  padding: 100px 0;
}

.content-text {
  padding: 15px;
  border-radius: 8px;
  background: #f8fafc;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  margin: 0;
}
</style>
