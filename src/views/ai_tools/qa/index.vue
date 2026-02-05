<template>
  <div class="qa-container">
    <el-card class="header-card" shadow="never">
      <div class="header-content">
        <div class="title-section">
          <el-icon class="qa-icon"><QuestionFilled /></el-icon>
          <span class="title">问题答疑 & 提问记录</span>
        </div>
        <el-button type="primary" @click="askVisible = true">
          <el-icon><EditPen /></el-icon> 我要提问
        </el-button>
      </div>
    </el-card>

    <div class="qa-list">
      <el-empty v-if="qaList.length === 0" description="暂无提问记录，快来发布第一个问题吧！" />
      
      <el-timeline v-else>
        <el-timeline-item
          v-for="(item, index) in qaList"
          :key="index"
          :timestamp="item.create_time"
          placement="top"
          :type="item.reply ? 'success' : 'primary'"
        >
          <el-card shadow="hover" class="qa-item-card">
            <div class="question-header">
              <span class="user-name">用户: {{ item.user }}</span>
              <el-tag :type="item.reply ? 'success' : 'info'" size="small">
                {{ item.reply ? '已回复' : '待处理' }}
              </el-tag>
            </div>
            <div class="question-body">
              <p class="question-text">{{ item.question }}</p>
            </div>
            
            <div v-if="item.reply" class="reply-section">
              <div class="reply-header">
                <el-icon><ChatDotRound /></el-icon>
                <span>专家回复：</span>
              </div>
              <p class="reply-text">{{ item.reply }}</p>
              <div class="reply-time">{{ item.reply_time }}</div>
            </div>
            
            <div v-else class="reply-action">
              <el-button type="primary" link @click="handleReply(item)">
                我来回复
              </el-button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 提问弹窗 -->
    <el-dialog v-model="askVisible" title="提出您的问题" width="500px">
      <el-form :model="askForm" label-width="80px">
        <el-form-item label="问题描述">
          <el-input
            v-model="askForm.question"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您遇到的问题..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="askVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion" :loading="submitting">提交问题</el-button>
      </template>
    </el-dialog>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复问题" width="500px">
      <div class="target-question">
        <strong>原问题：</strong>
        <p>{{ currentTarget?.question }}</p>
      </div>
      <el-form label-width="80px" style="margin-top: 20px;">
        <el-form-item label="您的回复">
          <el-input
            v-model="replyText"
            type="textarea"
            :rows="4"
            placeholder="输入您的专业解答..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReply" :loading="replying">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { QuestionFilled, EditPen, ChatDotRound } from '@element-plus/icons-vue';
import request from "@/utils/axios.ts";

const askVisible = ref(false);
const replyVisible = ref(false);
const submitting = ref(false);
const replying = ref(false);
const qaList = ref<any[]>([]);

const askForm = reactive({
  question: ''
});

const currentTarget = ref<any>(null);
const replyText = ref('');

const fetchQA = async () => {
  try {
    const res: any = await request.get('/api/ai/qa_list');
    if (res.code === 200) {
      qaList.value = res.data;
    }
  } catch (e) {
    // 降级使用本地存储或模拟
    const local = localStorage.getItem('tester_qa_list');
    if (local) qaList.value = JSON.parse(local);
  }
};

onMounted(() => {
  fetchQA();
});

const submitQuestion = async () => {
  if (!askForm.question.trim()) return ElMessage.warning('请输入问题');
  
  submitting.value = true;
  try {
    const res: any = await request.post('/api/ai/qa_add', {
      question: askForm.question
    });
    if (res.code === 200) {
      ElMessage.success('问题提交成功');
      askVisible.value = false;
      askForm.question = '';
      fetchQA();
    }
  } catch (e) {
    // 兜底本地逻辑
    const newItem = {
      id: Date.now(),
      user: '当前用户',
      question: askForm.question,
      create_time: new Date().toLocaleString(),
      reply: null
    };
    qaList.value.unshift(newItem);
    localStorage.setItem('tester_qa_list', JSON.stringify(qaList.value));
    ElMessage.success('问题已保存至本地会话');
    askVisible.value = false;
    askForm.question = '';
  } finally {
    submitting.value = false;
  }
};

const handleReply = (item: any) => {
  currentTarget.value = item;
  replyText.value = '';
  replyVisible.value = true;
};

const submitReply = async () => {
  if (!replyText.value.trim()) return ElMessage.warning('请输入回复内容');
  
  replying.value = true;
  try {
    const res: any = await request.post('/api/ai/qa_reply', {
      id: currentTarget.value.id,
      reply: replyText.value
    });
    if (res.code === 200) {
      ElMessage.success('回复成功');
      replyVisible.value = false;
      fetchQA();
    }
  } catch (e) {
    // 兜底本地逻辑
    const index = qaList.value.findIndex(i => i.id === currentTarget.value.id);
    if (index !== -1) {
      qaList.value[index].reply = replyText.value;
      qaList.value[index].reply_time = new Date().toLocaleString();
    }
    localStorage.setItem('tester_qa_list', JSON.stringify(qaList.value));
    ElMessage.success('回复已更新（本地）');
    replyVisible.value = false;
  } finally {
    replying.value = false;
  }
};
</script>

<style scoped>
.qa-container {
  padding: 20px;
  background-color: #f8fafc;
  min-height: calc(100vh - 84px);
}

.header-card {
  margin-bottom: 24px;
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

.qa-icon {
  font-size: 26px;
  color: #ff9900;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.qa-list {
  max-width: 900px;
  margin: 0 auto;
}

.qa-item-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

.user-name {
  font-weight: 600;
  color: #64748b;
  font-size: 13px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.question-text {
  font-size: 16px;
  color: #1e293b;
  line-height: 1.6;
  margin-bottom: 0;
}

.reply-section {
  margin-top: 16px;
  padding: 16px;
  background-color: #f0fdf4;
  border-radius: 8px;
  border-left: 4px solid #22c55e;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #15803d;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
}

.reply-text {
  font-size: 15px;
  color: #166534;
  line-height: 1.6;
  margin-bottom: 8px;
}

.reply-time {
  text-align: right;
  font-size: 12px;
  color: #86efac;
}

.reply-action {
  margin-top: 12px;
  text-align: right;
}

.target-question {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}
</style>
