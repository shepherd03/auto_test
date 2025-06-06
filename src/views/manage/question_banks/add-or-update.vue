<template>
  <el-drawer
    v-model="visible"
    :title="currentForm.id ? '编辑问题库' : '新增问题库'"
    size="35%"
    :close-on-click-modal="false"
    :destroy-on-close="true"
    direction="rtl"
    class="question-bank-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <h3>{{ currentForm.id ? '编辑问题库' : '新增问题库' }}</h3>
      </div>
    </template>
    <div class="drawer-content">
      <el-card class="question-bank-card">
        <el-form :model="currentForm" :rules="rules" ref="questionBankForm" label-width="120px" class="bank-form">
          <el-form-item label="题库名称" prop="name" class="form-item">
            <el-input v-model="currentForm.name" placeholder="请输入题库名称" />
          </el-form-item>
          <el-form-item label="描述" prop="description" class="form-item">
            <el-input
              type="textarea"
              v-model="currentForm.description"
              :rows="4"
              resize="none"
              placeholder="请输入题库描述"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog" class="custom-button">
          <el-icon class="el-icon--left"><Close /></el-icon>
          取消
        </el-button>
        <el-button type="primary" @click="saveQuestionBank" class="custom-button">
          <el-icon class="el-icon--left"><Check /></el-icon>
          保存
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { ElMessage } from 'element-plus';
import { addQuestionBanksApi, updateQuestionBanksApi } from '@/api/questionBanks';
import { type QuestionBank } from '@/types';
import { Close, Check } from '@element-plus/icons-vue';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  questionData: {
    type: Object as () => QuestionBank,
    default: () => ({ id: 0, name: '', description: '' })
  }
});

const emit = defineEmits(['update:visible', 'question-saved']);

const currentForm = ref<QuestionBank>({ id: 0, name: '', description: '' });
const rules = ref({
  name: [{ required: true, message: '请输入题库名称', trigger: 'blur' }],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { max: 255, message: 'description不能超过255', trigger: 'blur' },
  ],
});

// 监听questionData的变化
if (props.questionData) {
  currentForm.value = { ...props.questionData };
}

// 保存题库
const saveQuestionBank = async () => {
  try {
    if (currentForm.value.id) {
      await updateQuestionBanksApi(currentForm.value);
      ElMessage.success('更新成功');
    } else {
      await addQuestionBanksApi(currentForm.value);
      ElMessage.success('创建成功');
    }
    emit('question-saved');
    closeDialog();
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

// 关闭弹窗
const closeDialog = () => {
  emit('update:visible', false);
  currentForm.value = { id: 0, name: '', description: '' };
};
</script>

<style scoped>
.question-bank-drawer :deep(.el-drawer) {
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
}

.question-bank-drawer :deep(.el-drawer__header) {
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

.question-bank-card {
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.question-bank-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.bank-form {
  margin: 0 auto;
}

.form-item {
  margin-bottom: 24px;
}

.dialog-footer {
  padding: 16px 24px;
  text-align: right;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  border-radius: 0 0 8px 8px;
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