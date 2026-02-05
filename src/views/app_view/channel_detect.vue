<template>
  <div class="channel-detect-container">
    <el-card class="header-card" shadow="never">
      <template #header>
        <div class="header-content">
          <span class="title">Android 渠道检测</span>
          <el-tag type="info">支持读取 APK 渠道信息</el-tag>
        </div>
      </template>

      <div class="upload-section">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".apk"
          limit="1"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将 APK 文件拖到此处，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              目前支持 V2/V3 签名渠道识别（Walle/VasDolly 等常见方案）
            </div>
          </template>
        </el-upload>
      </div>

      <div v-if="detecting" class="detecting-status">
        <el-progress type="circle" :percentage="progress" />
        <p>正在分析渠道信息...</p>
      </div>

      <el-descriptions v-if="result" title="检测结果" :column="1" border class="result-desc">
        <el-descriptions-item label="文件名">{{ result.filename }}</el-descriptions-item>
        <el-descriptions-item label="渠道号 (Channel)">
          <el-tag size="large" type="success">{{ result.channel }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="签名版本">{{ result.sign_version }}</el-descriptions-item>
        <el-descriptions-item label="包名">{{ result.package_name }}</el-descriptions-item>
        <el-descriptions-item label="附加信息">{{ result.extra || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="guide-card" header="使用帮助">
      <div class="help-text">
        <p>1. 上传需要检测渠道的 Android APK 文件。</p>
        <p>2. 系统将自动扫描 APK 的签名块（Signature Block）获取 V2/V3 嵌入的渠道信息。</p>
        <p>3. <strong>注意：</strong>如果使用的是老旧的 V1 签名（META-INF 注入），请联系开发部升级检测模块。</p>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';

const detecting = ref(false);
const progress = ref(0);
const result = ref<any>(null);

const handleFileChange = (file: any) => {
  detecting.value = true;
  result.value = null;
  progress.value = 0;

  // 模拟检测过程
  let timer = setInterval(() => {
    progress.value += 10;
    if (progress.value >= 100) {
      clearInterval(timer);
      detecting.value = false;
      result.value = {
        filename: file.name,
        channel: "GooglePlay_1001",
        sign_version: "V2 + V3",
        package_name: "com.tester.demo",
        extra: "Walle channel info detected"
      };
      ElMessage.success('检测完成');
    }
  }, 200);
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
