<template>
  <div class="json-validate-container">
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <span class="title">JSON 校验</span>
        <el-button type="primary" @click="validateJson">验证并美化</el-button>
        <el-button @click="clear">清空</el-button>
      </div>
    </el-card>

    <div class="validate-main">
      <el-card shadow="hover">
        <div class="editor-wrapper" :class="{ 'has-error': errorMsg }">
          <Codemirror v-model:value="code" :options="cmOptions" :height="700" />
        </div>
        
        <div v-if="errorMsg" class="error-panel">
          <el-alert
            :title="errorMsg"
            type="error"
            :closable="false"
            show-icon
          />
        </div>
        <div v-else-if="successMsg" class="success-panel">
          <el-alert
            title="JSON 格式合法"
            type="success"
            :closable="false"
            show-icon
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import Codemirror from "codemirror-editor-vue3";
import "codemirror/mode/javascript/javascript.js";

const code = ref('{\n  "error": "missing quotes"\n}');
const errorMsg = ref('');
const successMsg = ref(false);

const cmOptions = reactive({
  mode: "application/json",
  lineNumbers: true,
  theme: "default"
});

const validateJson = () => {
  errorMsg.value = '';
  successMsg.value = false;
  try {
    const parsed = JSON.parse(code.value);
    code.value = JSON.stringify(parsed, null, 4);
    successMsg.value = true;
    ElMessage.success('校验通过');
  } catch (e: any) {
    errorMsg.value = e.message;
    ElMessage.error('JSON 格式错误');
  }
};

const clear = () => {
  code.value = '';
  errorMsg.value = '';
  successMsg.value = false;
};
</script>

<style scoped>
.json-validate-container {
  padding: 20px;
}
.header-card {
  margin-bottom: 20px;
}
.error-panel, .success-panel {
  margin-top: 20px;
}
.has-error {
  border: 1px solid #F56C6C;
  border-radius: 4px;
}
</style>
