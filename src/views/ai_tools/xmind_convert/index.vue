<template>
  <div class="xmind-container">
    <el-card class="top-nav-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <el-icon class="ai-icon"><Switch /></el-icon>
          <span class="title">XMind 转 Excel 用例</span>
        </div>
      </div>
    </el-card>

    <div class="main-content">
      <el-card class="upload-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>上传 XMind 文件</span>
          </div>
        </template>
        
        <div class="upload-area">
          <el-upload
            class="xmind-upload"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleFileChange"
            accept=".xmind"
            limit="1"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将 XMind 文件拖到此处，或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                仅支持 .xmind 文件，建议遵循 TestLink 或 ZenTao 导出的标准格式
              </div>
            </template>
          </el-upload>
        </div>

        <div class="action-section">
          <el-button 
            type="primary" 
            size="large" 
            :loading="converting" 
            :disabled="!selectedFile"
            @click="startConvert"
          >
            开始转换并下载 Excel
          </el-button>
        </div>
      </el-card>

      <el-card class="guide-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>💡 转换指南</span>
          </div>
        </template>
        <div class="guide-content">
          <p>1. <strong>文件名：</strong>建议使用英文或数字命名 XMind 文件。</p>
          <p>2. <strong>结构要求：</strong>中心主题为项目名，二级主题为模块名，三级主题为用例标题。</p>
          <p>3. <strong>属性支持：</strong>支持在主题中设置优先级（P1, P2...）和执行步骤（作为子节点）。</p>
          <p>4. <strong>工具参考：</strong>基于开源项目 <code>xmind2testcase</code> 实现。</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Switch, UploadFilled } from '@element-plus/icons-vue';
import axios from 'axios';

const selectedFile = ref<any>(null);
const converting = ref(false);

const handleFileChange = (file: any) => {
  selectedFile.value = file;
};

const startConvert = async () => {
  if (!selectedFile.value) return;

  converting.value = true;
  const formData = new FormData();
  formData.append('file', selectedFile.value.raw);

  try {
    // 使用原生 axios 处理文件下载
    const response = await axios.post(
      import.meta.env.VITE_WEB_BASE_API + '/api/ai/xmind_to_excel',
      formData,
      {
        responseType: 'blob', // 关键：指定响应类型为二进制流
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // 从响应头获取文件名或使用默认名
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'cases.xlsx';
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length > 1) {
        fileName = decodeURIComponent(fileNameMatch[1]);
      }
    }
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('导出成功！');
  } catch (e: any) {
    console.error(e);
    ElMessage.error('转换失败，请检查文件格式是否符合规范');
  } finally {
    converting.value = false;
  }
};
</script>

<style scoped>
.xmind-container {
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

.main-content {
  max-width: 800px;
  margin: 0 auto;
}

.upload-card {
  border-radius: 12px;
  margin-bottom: 20px;
}

.upload-area {
  padding: 20px 0;
}

.action-section {
  margin-top: 30px;
  display: flex;
  justify-content: center;
}

.guide-card {
  border-radius: 12px;
  background-color: #f1f5f9;
}

.guide-content {
  font-size: 14px;
  color: #475569;
  line-height: 1.8;
}

.guide-content p {
  margin-bottom: 10px;
}

.card-header {
  font-weight: 600;
  color: #1e293b;
}
</style>
