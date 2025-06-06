<template>
  <el-drawer
    v-model="visible"
    :title="isEditing ? '编辑问题' : '添加问题'"
    size="40%"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    direction="rtl"
    class="question-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <h3>{{ isEditing ? '编辑问题' : '添加问题' }}</h3>
      </div>
    </template>
    <div class="drawer-content">
      <el-card class="question-card">
        <el-form :model="currentQuestion" label-width="100px" class="question-form">
          <el-form-item label="问题" class="form-item">
            <el-input
              v-model="currentQuestion.question"
              placeholder="请输入问题"
              type="textarea"
              :rows="3"
              resize="none"
            />
          </el-form-item>
          <el-form-item label="结果" class="form-item">
            <el-input
              v-model="currentQuestion.result"
              placeholder="点击生成可自动填充"
              :disabled="loading"
              type="textarea"
              :rows="3"
              resize="none"
            />
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="结果类型" class="form-item">
                <el-input
                  v-model="currentQuestion.result_type"
                  placeholder="点击生成可自动填充"
                  :disabled="loading"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="消耗时间" class="form-item">
                <el-input
                  v-model="currentQuestion.time"
                  placeholder="点击生成可自动填充"
                  :disabled="loading"
                >
                  <template #append>秒</template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="所属问题库" required class="form-item">
            <el-select
              v-model="currentQuestion.bank_id"
              placeholder="请选择问题库"
              style="width: 100%"
            >
              <el-option
                v-for="bank in questionBanks"
                :key="bank.id"
                :label="bank.name"
                :value="bank.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <template #footer>
      <div class="drawer-footer">
        <el-button
          :loading="loading"
          type="success"
          @click="getAnswer(currentQuestion.question)"
          class="custom-button"
        >
          <el-icon class="el-icon--left"><Promotion /></el-icon>
          {{ loading ? '正在生成...' : '生成' }}
        </el-button>
        <el-button @click="closeDialog" class="custom-button">
          <el-icon class="el-icon--left"><Close /></el-icon>
          取 消
        </el-button>
        <el-button type="primary" @click="saveQuestion" class="custom-button">
          <el-icon class="el-icon--left"><Check /></el-icon>
          确 定
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { addTemplateQuestionApi, updateTemplateQuestionApi } from '@/api/templateQuestion';
import { getReplyContent, getReplyType, getTime } from '@/utils/resultParser';
import { useDirectApi } from '@/api/microService';
import { useQuestionBanksApi } from '@/api/questionBanks';
import type { QuestionBank } from '@/types';
import { Close, Check, Promotion } from '@element-plus/icons-vue';

const props = defineProps({
  visible: Boolean,
  editing: Boolean,
  questionData: Object,
});

const emit = defineEmits(['update:visible', 'question-saved']);

const isEditing = ref(props.editing);
const currentQuestion = ref({
  question: '',
  result: '',
  result_type: '',
  time: 0,
  bank_id: 0,
});
const loading = ref(false);
const questionBanks = ref<QuestionBank[]>([]);

// 根据bank_id获取问题库名称的计算属性
const getBankName = (bankId: number) => {
  const bank = questionBanks.value.find(bank => bank.id === bankId);
  return bank ? bank.name : '';
};

const getQuestionBanks = async () => {
  try {
    const response = await useQuestionBanksApi();
    questionBanks.value = response.data;
    
    // 如果当前没有选择问题库，设置默认值
    if (!currentQuestion.value.bank_id || currentQuestion.value.bank_id === 0) {
      if (questionBanks.value.length > 0) {
        currentQuestion.value.bank_id = questionBanks.value[0].id;
      }
    }
  } catch (error) {
    console.error('获取问题库列表失败:', error);
    ElMessage.error('获取问题库列表失败');
  }
};

onMounted(() => {
  getQuestionBanks();
});

const getAnswer = async (question: string) => {
  loading.value = true;
  try {
    const response = await useDirectApi(question, 0);
    currentQuestion.value.result = getReplyContent(response);
    currentQuestion.value.result_type = getReplyType(response);
    currentQuestion.value.time = getTime(response);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.editing,
  (newVal) => {
    isEditing.value = newVal;
  }
);

const saveQuestion = async () => {
  if (!currentQuestion.value.question) {
    ElMessage.error('请输入问题');
    return;
  }

  try {
    if (isEditing.value) {
      await updateTemplateQuestionApi(currentQuestion.value.id, currentQuestion.value);
      ElMessage.success('编辑成功');
    } else {
      const response = await addTemplateQuestionApi(currentQuestion.value);
      currentQuestion.value.id = response.data.id;
      ElMessage.success('添加成功');
    }
    emit('question-saved', currentQuestion.value);
    closeDialog();
  } catch (error) {
    ElMessage.error(isEditing.value ? '编辑失败' : '添加失败');
    console.error(error);
  }
};

const closeDialog = () => {
  emit('update:visible', false);
  // 重置表单时，如果有可用的问题库，设置为第一个问题库
  const defaultBankId = questionBanks.value.length > 0 ? questionBanks.value[0].id : 0;
  currentQuestion.value = {
    question: '',
    result: '',
    result_type: '',
    time: 0,
    bank_id: defaultBankId,
  };
};
</script>

<style scoped>
.question-drawer :deep(.el-drawer) {
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
}

.question-drawer :deep(.el-drawer__header) {
  margin: 0;
  padding: 0;
  border-bottom: none;
}

.drawer-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 0;
}

.drawer-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.drawer-content {
  padding: 24px;
  height: calc(100% - 120px);
  overflow-y: auto;
}

.question-card {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.question-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.question-form {
  margin: 0 auto;
}

.form-item {
  margin-bottom: 24px;
}

.question-form {
  margin: 0 auto;
}

.form-item {
  margin-bottom: 24px;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  text-align: right;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
}

.custom-button {
  padding: 8px 20px;
  border-radius: 4px;
  transition: all 0.3s;
}

.custom-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
  