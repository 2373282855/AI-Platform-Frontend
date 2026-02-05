<template>
  <div class="upload-batch-container">
    <div class="upload-actions">
      <el-upload
        ref="uploadRef"
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :show-file-list="false"
        action="#"
        accept="*"
      >
        <template #trigger>
          <el-button type="primary" icon="Upload">选择文件(可多选)</el-button>
        </template>
        <el-button type="success" icon="FolderOpened" style="margin-left: 10px" @click="triggerFolderSelect">
          上传文件夹
        </el-button>
        <el-button type="danger" icon="Delete" style="margin-left: 10px" v-if="fileList.length > 0" @click="clearList">
          清空列表
        </el-button>
        <el-button type="warning" icon="VideoPlay" style="margin-left: 10px" :loading="uploading" v-if="fileList.length > 0" @click="submitUpload">
          开始批量上传 ({{ fileList.length }})
        </el-button>

        <input
          ref="folderInput"
          type="file"
          webkitdirectory
          directory
          style="display: none"
          @change="handleFolderChange"
        />
      </el-upload>
    </div>

    <!-- 待上传列表预览 -->
    <div v-if="fileList.length > 0" class="preview-list">
      <div v-for="(file, index) in fileList" :key="index" class="preview-item">
         <el-tag closable @close="removeFile(index)">
           {{ file.name }} ({{ (file.size / 1024 / 1024).toFixed(2) }}MB)
         </el-tag>
      </div>
    </div>

    <el-progress v-if="uploading" :percentage="progress" status="success" style="margin-top: 20px" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from "@/utils/axios.ts";

const props = defineProps<{
  action: string;
  accept?: string;
  data?: any;
}>();

const emit = defineEmits(['success']);

const folderInput = ref();
const fileList = ref<File[]>([]);
const uploading = ref(false);
const progress = ref(0);

const handleFileChange = (uploadFile: any) => {
  const rawFile = uploadFile.raw;
  if (rawFile) {
    fileList.value.push(rawFile);
  }
};

const triggerFolderSelect = () => {
  folderInput.value.click();
};

const handleFolderChange = (event: any) => {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    fileList.value.push(files[i]);
  }
  // 重置 input 以允许再次选择同一文件夹
  event.target.value = '';
};

const removeFile = (index: number) => {
  fileList.value.splice(index, 1);
};

const clearList = () => {
  fileList.value = [];
};

const submitUpload = async () => {
  if (fileList.value.length === 0) return;
  
  uploading.value = true;
  progress.value = 0;
  
  const total = fileList.value.length;
  let successCount = 0;
  
  for (let i = 0; i < total; i++) {
    const file = fileList.value[i];
    const formData = new FormData();
    formData.append('file', file);
    if (props.data) {
      Object.keys(props.data).forEach(key => {
        formData.append(key, props.data[key]);
      });
    }
    
    try {
      const res: any = await request.post(props.action, formData);
      if (res.code === 200) {
        successCount++;
      }
    } catch (e) {
      console.error(`上传失败: ${file.name}`, e);
    }
    progress.value = Math.floor(((i + 1) / total) * 100);
  }
  
  uploading.value = false;
  ElMessage.success(`上传完成！成功 ${successCount}/${total}`);
  if (successCount > 0) {
    emit('success');
    fileList.value = [];
  }
};

defineExpose({
  submitUpload,
  fileList
});
</script>

<style scoped>
.upload-batch-container {
  padding: 10px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  background: #f8fafc;
}
.preview-list {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: #fff;
  border-radius: 4px;
}
.preview-item {
  margin-bottom: 5px;
}
</style>
