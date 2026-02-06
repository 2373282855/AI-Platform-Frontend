<template>
  <div class="channel-detect-container">
    <el-card class="header-card" shadow="never">
      <template #header>
        <div class="header-content">
          <span class="title">Android 渠道检测 (AAB/APK)</span>
          <el-tag type="info">支持读取 AAB/APK 渠道信息</el-tag>
        </div>
      </template>

      <div class="upload-section">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".aab,.apk"
          limit="1"
          :show-file-list="false"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将 AAB/APK 文件拖到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 Android App Bundle (.aab) 及常规 APK 文件的渠道信息检测
            </div>
          </template>
        </el-upload>
      </div>

      <div v-if="detecting" class="detecting-status">
        <el-progress type="circle" :percentage="progress" />
        <p>正在分析包体结构与渠道配置...</p>
      </div>

      <el-descriptions v-if="result" title="检测结果" :column="1" border class="result-desc">
        <el-descriptions-item label="文件名">{{ result.filename }}</el-descriptions-item>
        <el-descriptions-item label="包名">{{ result.package_name }}</el-descriptions-item>
        <el-descriptions-item label="版本名">{{ result.version_name }}</el-descriptions-item>
        <el-descriptions-item label="版本号 (VersionCode)">{{ result.version_code }}</el-descriptions-item>
        <el-descriptions-item label="友盟渠道名">{{ result.umeng_channel }}</el-descriptions-item>
        <el-descriptions-item label="美图渠道名">{{ result.meitu_channel }}</el-descriptions-item>
        <el-descriptions-item label="AppsFlyer 预装渠道名">{{ result.appsflyer_preinstall }}</el-descriptions-item>
        <el-descriptions-item label="AppsFlyer Out-of-Store 渠道名">{{ result.appsflyer_oos }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="guide-card" header="使用帮助">
      <div class="help-text">
        <p>1. <strong>AAB (.aab)</strong>: 系统将解析 `AndroidManifest.xml` 中的 Meta-data 或 BundleConfig 以获取渠道标识。</p>
        <p>2. <strong>APK (.apk)</strong>: 支持 V2/V3 签名块读取及 Meta-data 读取。</p>
        <p>3. 请确保上传的文件未加密或损坏。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import axios from 'axios';

const detecting = ref(false);
const progress = ref(0);
const result = ref<any>(null);

const handleFileChange = async (uploadFile: any) => {
  const file = uploadFile.raw;
  if (!file) return;
  
  const isAAB = file.name.endsWith('.aab');
  const isAPK = file.name.endsWith('.apk');
  
  if (!isAAB && !isAPK) {
      ElMessage.error('仅支持 .aab 或 .apk 文件');
      return;
  }

  detecting.value = true;
  result.value = null;
  progress.value = 0;
  
  // Fake progress animation
  let timer = setInterval(() => {
     if (progress.value < 90) progress.value += 5;
  }, 100);

  try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use configured axios instance in real app, here assuming generic axios or import request
      // Assuming context has '/api' proxy setup
      const res = await axios.post('/api/app_detect/channel_detect', formData, {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
      });
      
      clearInterval(timer);
      progress.value = 100;
      detecting.value = false;
      
      if (res.data && res.data.code === 200) {
          result.value = res.data.data;
          // Handle "tool not found" mock data case gracefully
          if (result.value.error) {
               ElMessage.warning(result.value.error + ": " + result.value.note);
          } else {
               ElMessage.success('检测完成');
          }
      } else {
          ElMessage.error(res.data.msg || '检测失败');
      }

  } catch (error) {
      clearInterval(timer);
      detecting.value = false;
      console.error(error);
      ElMessage.error('网络请求失败');
  }
};
</script>

<style scoped>
.channel-detect-container {
  padding: 20px;
}
.header-card {
  margin-bottom: 20px;
}
.upload-section {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}
.detecting-status {
  text-align: center;
  padding: 20px;
}
.result-desc {
  margin-top: 30px;
}
.guide-card {
  background-color: #f8fafc;
}
.help-text {
  font-size: 14px;
  color: #64748b;
  line-height: 2;
}
</style>
