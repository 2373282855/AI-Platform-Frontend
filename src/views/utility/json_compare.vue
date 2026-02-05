<template>
  <div class="json-compare-container">
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <span class="title">JSON 对比</span>
        <el-button type="primary" @click="compareJson">开始对比</el-button>
        <el-button @click="clearAll">清空全部</el-button>
      </div>
    </el-card>

    <div class="compare-layout">
      <div class="json-panel">
        <el-card shadow="hover">
          <template #header>JSON A (原始)</template>
          <Codemirror v-model:value="jsonA" :options="cmOptions" :height="600" />
        </el-card>
      </div>
      <div class="json-panel">
        <el-card shadow="hover">
          <template #header>JSON B (目标)</template>
          <Codemirror v-model:value="jsonB" :options="cmOptions" :height="600" />
        </el-card>
      </div>
    </div>

    <el-dialog v-model="diffVisible" title="对比结果" width="80%">
      <div class="diff-result">
        <pre v-if="!diffFound" class="no-diff">两个 JSON 完全一致！</pre>
        <div v-else class="diff-list">
          <el-table :data="diffData" style="width: 100%">
            <el-table-column prop="path" label="路径" width="200" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTagType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="oldVal" label="JSON A" />
            <el-table-column prop="newVal" label="JSON B" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import Codemirror from "codemirror-editor-vue3";
import "codemirror/mode/javascript/javascript.js";

const jsonA = ref('{\n  "name": "L-Tester",\n  "version": "1.0"\n}');
const jsonB = ref('{\n  "name": "L-Tester",\n  "version": "1.1",\n  "newKey": "value"\n}');
const diffVisible = ref(false);
const diffFound = ref(false);
const diffData = ref<any[]>([]);

const cmOptions = reactive({
  mode: "application/json",
  lineNumbers: true,
  theme: "default"
});

const compareJson = () => {
  try {
    const objA = JSON.parse(jsonA.value);
    const objB = JSON.parse(jsonB.value);
    
    const diffs: any[] = [];
    findDiffs(objA, objB, '', diffs);
    
    // 检查新增的 key
    findNewKeys(objA, objB, '', diffs);

    diffData.value = diffs;
    diffFound.value = diffs.length > 0;
    diffVisible.value = true;
  } catch (e) {
    ElMessage.error('JSON 格式错误，请检查输入');
  }
};

const findDiffs = (a: any, b: any, path: string, diffs: any[]) => {
  for (const key in a) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in b)) {
      diffs.push({ path: currentPath, type: 'DELETED', oldVal: JSON.stringify(a[key]), newVal: '-' });
    } else if (typeof a[key] === 'object' && a[key] !== null && typeof b[key] === 'object' && b[key] !== null) {
      findDiffs(a[key], b[key], currentPath, diffs);
    } else if (a[key] !== b[key]) {
      diffs.push({ path: currentPath, type: 'CHANGED', oldVal: String(a[key]), newVal: String(b[key]) });
    }
  }
};

const findNewKeys = (a: any, b: any, path: string, diffs: any[]) => {
  for (const key in b) {
    const currentPath = path ? `${path}.${key}` : key;
    if (!(key in a)) {
      diffs.push({ path: currentPath, type: 'ADDED', oldVal: '-', newVal: JSON.stringify(b[key]) });
    } else if (typeof a[key] === 'object' && a[key] !== null && typeof b[key] === 'object' && b[key] !== null) {
      findNewKeys(a[key], b[key], currentPath, diffs);
    }
  }
};

const getTagType = (type: string) => {
  if (type === 'ADDED') return 'success';
  if (type === 'DELETED') return 'danger';
  return 'warning';
};

const clearAll = () => {
  jsonA.value = '{}';
  jsonB.value = '{}';
};
</script>

<style scoped>
.json-compare-container {
  padding: 20px;
}
.header-card {
  margin-bottom: 20px;
}
.compare-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.no-diff {
  text-align: center;
  font-size: 18px;
  color: #67C23A;
  padding: 40px;
}
</style>
