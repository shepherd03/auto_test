<template>
  <div>
    <!-- 按钮区域 -->
    <div class="button-group-container">
      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入问题库名称"
          clearable
          @clear="getQuestionBanks"
          @keyup.enter.native="getQuestionBanks"
        >
          <template #append>
            <el-button :icon="Search" @click="getQuestionBanks"></el-button>
          </template>
        </el-input>
      </div>
      <el-button type="primary" class="action-button" @click="openAddDialog">
        <el-icon class="el-icon--left"><Plus /></el-icon>
        新增问题库
      </el-button>
    </div>

    <!-- 卡片列表 -->
    <el-row gutter="20">
      <el-col :span="12" v-for="data in questionBanks" :key="data.id">
        <el-card class="card" shadow="hover">
          <el-descriptions
            :title="data.name"
            border
            :column="1"
            :label-style="{ width: '100px' }"
          >
            <el-descriptions-item label="具体描述">
              <span class="description-item">{{ data.description }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              <span class="description-item">{{ data.create_time }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="操作">
              <el-button type="text" size="small" @click="editQuestionBank(data)">
                <el-icon class="el-icon--left"><Edit /></el-icon>编辑
              </el-button>
              <el-button type="text" size="small" @click="deleteQuestionBank(<number>data.id)">
                <el-icon class="el-icon--left"><Delete /></el-icon>删除
              </el-button>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <!-- 抽屉 -->
    <add-or-update
      v-model:visible="dialogVisible"
      :question-data="currentForm"
      @question-saved="getQuestionBanks"
    />
  </div>
</template>

<script setup lang="ts">
import {
  useQuestionBanksApi,
  deleteQuestionBanksApi,
} from '@/api/questionBanks';
import { ref, onMounted, nextTick } from 'vue';
import { type QuestionBank } from '@/types';
import { ElMessage } from 'element-plus';
import { Search, Close, Check, Plus, Edit, Delete } from '@element-plus/icons-vue';
import AddOrUpdate from './add-or-update.vue';

// 数据
const questionBanks = ref<Array<QuestionBank>>([]);
const searchKeyword = ref('');
const dialogVisible = ref(false);
const currentForm = ref<QuestionBank>({ id: 0, name: '', description: '' });

// 获取题库列表
const getQuestionBanks = async () => {
  try {
    const response = await useQuestionBanksApi();
    questionBanks.value = response.data;
  } catch (error) {
    ElMessage.error('加载题库失败');
  }
};

// 打开新增弹窗
const openAddDialog = () => {
  currentForm.value = { id: 0, name: '', description: '' };
  dialogVisible.value = true;
};

// 编辑题库
const editQuestionBank = (bank: QuestionBank) => {
  console.log(bank);
  currentForm.value = { ...bank };
  dialogVisible.value = true;
};

// 删除题库
const deleteQuestionBank = async (id: number) => {
  try {
    await deleteQuestionBanksApi(id);
    ElMessage.success('删除成功');
    getQuestionBanks();
  } catch (error) {
    ElMessage.error('删除失败');
  }
};

// 生命周期
onMounted(() => {
  nextTick(() => {
    getQuestionBanks();
  });
});
</script>

<style scoped>
.el-row {
  margin-bottom: 15px;
}
.card {
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}
.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
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

.question-bank-card :deep(.el-card__body) {
  padding: 24px;
}
.description-item {
  white-space: normal;
  word-wrap: break-word;
  word-break: break-word;
}

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

.bank-form {
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

.dialog-footer {
  padding: 16px 24px;
  text-align: right;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
  border-radius: 0 0 8px 8px;
}

/* 新增按钮区域样式 */
.button-group-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.search-container {
  flex: 1;
  max-width: 300px;
}

.action-button {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card {
  margin-bottom: 20px;
}

.description-item {
  word-break: break-all;
}
.action-button .el-icon {
  margin-right: 6px;
  font-size: 16px;
}
</style>
