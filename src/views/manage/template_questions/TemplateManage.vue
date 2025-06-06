<template>
  <div>
    <div class="button-group-container">
      <el-button type="primary" class="action-button" @click="showAddDialog">
        <el-icon class="el-icon--left"><Plus /></el-icon>
        新增问题
      </el-button>
      <el-button type="danger" class="action-button" @click="confirmBatchDelete">
        <el-icon class="el-icon--left"><Delete /></el-icon>
        批量删除
      </el-button>
      <el-button type="success" class="action-button" @click="showImportModal = true">
        <el-icon class="el-icon--left"><Upload /></el-icon>
        批量导入
      </el-button>
    </div>

    <AddOrUpdate 
      :visible="showAddOrEditDialog" 
      :editing="isEditing" 
      :question-data="currentItem"
      @update:visible="showAddOrEditDialog = $event"
      @question-saved="onQuestionSaved"
    />

    <el-dialog
      title="批量导入"
      v-model="showImportModal"
      @close="resetImportState"
      width="50%"
      :close-on-click-modal="false"
      :destroy-on-close="true"
      class="import-dialog"
    >
    <el-form :model="importForm" :rules="rules" ref="importFormRef" class="import-form" label-width="120px">
      <el-form-item label="选择配置" prop="cfgs" class="form-item">
        <div v-for="(cfg, key) in importForm.cfgs" :key="key" class="config-item">
          <span>{{ cfg.description }}</span>
          <el-switch v-model="cfg.enable" class="config-switch"></el-switch>
        </div>
      </el-form-item>
      <el-form-item prop="file" class="form-item">
        <ExcelDropArea @file-selected="onFileSelected" @file-parsed="onFileParsed" class="excel-drop-area"/>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="showImportModal = false" class="custom-button">
            <el-icon class="el-icon--left"><Close /></el-icon>
            取 消
          </el-button>
        <el-button type="primary" @click="startImport" :disabled="!canImport" class="custom-button">
            <el-icon class="el-icon--left"><Upload /></el-icon>
            {{ isImporting ? '导入中...' : '开始导入' }}
          </el-button>
        <el-button type="danger" @click="cancelImport" v-if="isImporting" class="custom-button">
            <el-icon class="el-icon--left"><CircleClose /></el-icon>
            取消导入
          </el-button>
      </div>
    </template>

    <el-progress
      :percentage="importProgress"
      status="success"
      v-if="isImporting"
      class="import-progress"
    ></el-progress>
  </el-dialog>

    <el-table :data="paginatedItems" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column v-for="itemProp in itemProps" :key="itemProp.prop" :prop="itemProp.prop" :label="itemProp.label" :width="itemProp.width" :show-overflow-tooltip="true">
        <template #default="scope" v-if="itemProp.prop === 'bank_id'">
          {{ getBankName(scope.row.bank_id) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button size="small" type="primary" @click="showEditDialog(scope.$index, scope.row)">
            <el-icon class="el-icon--left"><Edit /></el-icon>编辑
          </el-button>
          <el-button size="small" type="danger" @click="confirmDelete(scope.$index, scope.row)">
            <el-icon class="el-icon--left"><Delete /></el-icon>删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="total, prev, pager, next, jumper"
      :total="items.length"
      :current-page="currentPage"
      :page-size="pageSize"
      @current-change="goToPage"
      @size-change="handlePageSizeChange"
    ></el-pagination>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { Close, Upload, CircleClose, Plus, Delete, Edit } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTemplateQuestionApi, deleteTemplateQuestionApi, addTemplateQuestionApi } from '@/api/templateQuestion';
import { useQuestionBanksApi } from '@/api/questionBanks';
import { useDirectApi } from '@/api/microService';
import { getReplyContent, getReplyType, getTime } from '@/utils/resultParser';
import { type TestItem, type TableColumn,type QuestionBank } from '@/types/index';
import AddOrUpdate from './add-or-update.vue';
import ExcelDropArea from '@/components/Excel/ExcelDropArea.vue';

const itemProps = ref<Array<TableColumn<TestItem>>>([
  { prop: "question", label: "问题", width: 400, visible: true },
  { prop: "result", label: "结果", width: 400, visible: true },
  { prop: "result_type", label: "结果类型", width: 100, visible: true },
  { prop: "time", label: "花费时间(s)", width: 100, visible: true }
]);

const items = ref<Array<TestItem>>([]);
const selectedItems = ref<Array<TestItem>>([]);
const showAddOrEditDialog = ref(false);
const currentItem = ref<TestItem>();
const excelData = ref<Array<any>>([]);
const questionBanks = ref<Array<QuestionBank>>();
const isEditing = ref(false);
const showImportModal = ref(false);
const isImporting = ref(false);
const importProgress = ref(0);
const importFormRef = ref();
const pageSize = ref(20);
const currentPage = ref(1);

// 根据bank_id获取问题库名称
const getBankName = (bankId: number) => {
  const bank = questionBanks.value?.find(bank => bank.id === bankId);
  return bank ? bank.name : '';
};
const importForm = ref({
  cfgs: {
    autoResult: {
      description: "生成结果",
      enable: false,
    }
  },
  file: null
});

const rules = ref({
  file: [{ required: true, message: '请上传文件', trigger: 'change' }],
});

const canImport = computed(() => excelData.value.length > 0 && !isImporting.value);

const getAllItems = async () => {
  try {
    const response = await useTemplateQuestionApi();
    return response.data;
  } catch (error) {
    console.error('获取问题列表失败', error);
    return [];
  }
};

const confirmDelete = async (index: number, row: TestItem) => {
  ElMessageBox.confirm(
    '此操作将永久删除该问题, 是否继续?',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    handleDelete(index, row);
  }).catch(() => {
    ElMessage({
      type: 'info',
      message: '已取消删除'
    });
  });
};

const handleDelete = async (index: number, row: TestItem) => {
  try {
    await deleteTemplateQuestionApi(row.id as number);
    ElMessage.success('删除成功');
    items.value.splice(index, 1);
  } catch (error) {
    ElMessage.error('删除失败');
    console.error(error);
  }
};

const showAddDialog = () => {
  isEditing.value = false;
  resetCurrentQuestion();
  showAddOrEditDialog.value = true;
};

const showEditDialog = (index: number, row: TestItem) => {
  isEditing.value = true;
  currentItem.value = { ...row };
  showAddOrEditDialog.value = true;
};

const onQuestionSaved = (item: TestItem) => {
  if (isEditing.value) {
    const index = items.value.findIndex(q => q.id === item.id);
    if (index !== -1) {
      items.value[index] = item;
    }
  } else {
    items.value.push(item);
  }
};

const confirmBatchDelete = async () => {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请选择要删除的问题');
    return;
  }
  ElMessageBox.confirm(
    '此操作将永久删除选中的问题, 是否继续?',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    handleBatchDelete();
  }).catch(() => {
    ElMessage({
      type: 'info',
      message: '已取消删除'
    });
  });
};

const handleBatchDelete = async () => {
  try {
    for (const item of selectedItems.value) {
      await deleteTemplateQuestionApi(item.id as number);
    }
    ElMessage.success('批量删除成功');
    items.value = items.value.filter(question => !selectedItems.value.includes(question));
    selectedItems.value = [];
  } catch (error) {
    ElMessage.error('批量删除失败');
    console.error(error);
  }
};

const handleSelectionChange = (val: Array<TestItem>) => {
  selectedItems.value = val;
};

const updateImportProgress = (current: number, total: number) => {
  importProgress.value = Math.round((current / total) * 100);
};

const importFromExcelData = async () => {
  isImporting.value = true;
  const total = excelData.value.length;
  let current = 0;
  for (const data of excelData.value) {
    const question = data["问题"];
    let result;
    let result_type;
    let time;

    if (importForm.value.cfgs.autoResult.enable) {
      let response = await useDirectApi(question,0);
      result = getReplyContent(response);
      result_type = getReplyType(response);
      time = getTime(response);
    } else {
      result = '';
      result_type = -1;
      time = 0;
    }

    const item: TestItem = { question, result, result_type, time,bank_id:0,interface_id:0 };
    const response = await addTemplateQuestionApi(item);
    item.id = response.data.id;
    items.value.push(item);
    current++;
    updateImportProgress(current, total);
  }
  isImporting.value = false;
  importProgress.value = 0;
  ElMessage.success('导入成功');
};

const startImport = async () => {
  if (!await importFormRef.value.validate()) return;
  isImporting.value = true;
  await importFromExcelData();
  resetImportState();
  showImportModal.value = false;
};

const cancelImport = () => {
  isImporting.value = false;
  importProgress.value = 0;
  ElMessage.info('导入已取消');
};

const resetImportState = () => {
  isImporting.value = false;
  importProgress.value = 0;
  excelData.value = [];
  importForm.value.file = null;
};

const onFileSelected = (file: File) => {
  importForm.value.file = file;
};

const onFileParsed = (data: any[]) => {
  excelData.value = data;
};

const totalPages = computed(() => Math.ceil(items.value.length / pageSize.value));

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const handlePageSizeChange = () => {
  pageSize.value = parseInt(pageSize.value.toString(), 10);
  currentPage.value = 1;
};

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return items.value.slice(start, end);
});

const resetCurrentQuestion = () => {
  currentItem.value = {
    id: -1,
    question: '',
    result: '',
    result_type: '',
    time: 0,
    bank_id: 0,
  };
};

onMounted(async () => {
  const allItems = await getAllItems();
  items.value = allItems;
  questionBanks.value = (await useQuestionBanksApi()).data as Array<QuestionBank>;
});
</script>

<style scoped>
.button-group-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.action-button .el-icon {
  margin-right: 6px;
  font-size: 16px;
}

.import-dialog :deep(.el-dialog) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.import-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.import-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.import-form {
  margin: 0 auto;
}

.form-item {
  margin-bottom: 24px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.config-switch {
  margin-left: 16px;
}

.excel-drop-area {
  margin-top: 16px;
}

.import-progress {
  margin-top: 24px;
}

.dialog-footer {
  padding: 16px 24px;
  text-align: right;
  background: #f9f9f9;
  border-top: 1px solid #f0f0f0;
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