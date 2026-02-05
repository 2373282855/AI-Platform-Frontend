<template>
  <div class="app-container">
    <!-- 筛选栏 -->
    <el-card shadow="never" style="margin-bottom: 15px">
      <el-form :inline="true">
        <el-form-item label="执行状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="运行中" :value="0" />
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadResults">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 结果列表 -->
    <el-table :data="resultList" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="case_title" label="用例标题" min-width="200" />
      <el-table-column prop="device_id" label="设备序列号" width="180" />
      <el-table-column prop="device_name" label="设备型号" width="150" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 0" type="warning">运行中</el-tag>
          <el-tag v-else-if="row.status === 1" type="success">成功</el-tag>
          <el-tag v-else type="danger">失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="duration" label="耗时(秒)" width="100">
        <template #default="{ row }">
          {{ row.duration || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="start_time" label="开始时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.start_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleViewDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="limit"
      :total="total"
      layout="total, prev, pager, next, jumper"
      style="margin-top: 20px; justify-content: flex-end"
      @current-change="loadResults"
    />

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="执行详情" width="70%" :close-on-click-modal="false">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="用例标题">{{ detailData.case_title }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag v-if="detailData.status === 0" type="warning">运行中</el-tag>
          <el-tag v-else-if="detailData.status === 1" type="success">成功</el-tag>
          <el-tag v-else type="danger">失败</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设备序列号">{{ detailData.device_id }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ detailData.device_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatTime(detailData.start_time) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">
          {{ detailData.end_time ? formatTime(detailData.end_time) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.duration || '-' }} 秒</el-descriptions-item>
        <el-descriptions-item label="用例ID">{{ detailData.case_id }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div v-if="detailData.error_msg" style="margin-bottom: 20px">
        <h4 style="color: #f56c6c">错误信息：</h4>
        <el-input
          :model-value="detailData.error_msg"
          type="textarea"
          :rows="6"
          readonly
          style="font-family: 'Courier New', monospace"
        />
      </div>

      <div v-if="detailData.log_content">
        <h4>执行日志：</h4>
        <el-input
          :model-value="detailData.log_content"
          type="textarea"
          :rows="15"
          readonly
          style="font-family: 'Courier New', monospace; font-size: 12px"
        />
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { getResultList, getResultDetail } from '@/api/intentra';

const loading = ref(false);
const resultList = ref([]);
const page = ref(1);
const limit = ref(20);
const total = ref(0);

const queryParams = reactive({
  status: undefined
});

const detailVisible = ref(false);
const detailData = ref<any>(null);

onMounted(() => {
  loadResults();
  // 自动刷新运行中的任务
  setInterval(() => {
    if (resultList.value.some((item: any) => item.status === 0)) {
      loadResults();
    }
  }, 5000);
});

const loadResults = async () => {
  loading.value = true;
  try {
    const res = await getResultList({
      page: page.value,
      limit: limit.value,
      ...queryParams
    });
    resultList.value = res.data.list;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  queryParams.status = undefined;
  page.value = 1;
  loadResults();
};

const handleViewDetail = async (row: any) => {
  const res = await getResultDetail(row.id);
  detailData.value = res.data;
  detailVisible.value = true;
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};
</script>

<style scoped>
.app-container {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
}
</style>