<template>
  <div class="excel-viewer-container">
    <!-- 上传区域 -->
    <el-card class="excel-card" v-if="!excelData.length">
      <template #header>
        <div class="card-header">
          <h2>Excel文件预览工具</h2>
          <p class="description">支持预览、格式调整、数据筛选等功能</p>
        </div>
      </template>
      
      <excel-drop-area
        ref="excelDropAreaRef"
        @file-selected="handleFileSelected"
        @file-parsed="handleFileParsed"
        @sheet-changed="handleSheetChanged"
      />
    </el-card>

    <el-card class="excel-card" v-if="excelData.length > 0">
      <template #header>
        <div class="card-header">
          <div class="header-info">
            <span class="file-name" v-if="file">{{ file.name }}</span>
            <span class="data-count">{{ excelData.length }} 条数据</span>
          </div>
          <div class="header-actions">
            <el-tooltip content="刷新数据" placement="top">
              <el-button type="primary" size="small" @click="refreshData">
                <el-icon><refresh /></el-icon> 刷新
              </el-button>
            </el-tooltip>

            <el-tooltip content="上传新文件" placement="top">
              <el-button type="primary" size="small" @click="handleUploadNew">
                <el-icon><upload /></el-icon> 上传新文件
              </el-button>
            </el-tooltip>
            <el-tooltip content="导出Excel" placement="top">
              <el-button type="success" size="small" @click="exportExcel" :disabled="!excelData.length">
                <el-icon><download /></el-icon> 导出
              </el-button>
            </el-tooltip>
            <el-tooltip content="美化并导出" placement="top">
              <el-button type="warning" size="small" @click="beautifyAndExport" :disabled="!excelData.length">
                <el-icon><magic-stick /></el-icon> 美化导出
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </template>
      <!-- 工作表选择器 -->
      <div class="sheet-selector" v-if="workbook && workbook.SheetNames.length > 1">
        <span>工作表:</span>
        <el-select v-model="currentSheet" @change="changeSheet" size="small">
          <el-option 
            v-for="sheet in workbook.SheetNames" 
            :key="sheet" 
            :label="sheet" 
            :value="sheet"
          ></el-option>
        </el-select>
      </div>
      
      <!-- 数据筛选区域 -->
      <div class="filter-container" v-if="tableColumns.length > 0">
        <el-form :inline="true" class="filter-form">
          <el-form-item label="筛选列">
            <el-select v-model="filterColumn" placeholder="选择列" size="small">
              <el-option 
                v-for="col in tableColumns" 
                :key="col.prop" 
                :label="col.label" 
                :value="col.prop"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="筛选值" v-if="filterColumn">
            <el-input v-model="filterValue" placeholder="输入筛选值" size="small" clearable @clear="applyFilter"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="small" @click="applyFilter" :disabled="!filterColumn">
              <el-icon><search /></el-icon> 筛选
            </el-button>
            <el-button type="warning" size="small" @click="clearFilters" :disabled="!hasFilters">
              <el-icon><delete /></el-icon> 清除筛选
            </el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 数据表格 -->
      <el-table 
        :data="paginatedData" 
        border 
        style="width: 95%" 
        height="2000px" 
        v-loading="tableLoading"
        stripe
        highlight-current-row
        :default-sort="{prop: tableColumns[0]?.prop, order: 'ascending'}"
      >
        <el-table-column 
          v-for="(col, index) in tableColumns" 
          :key="index" 
          :prop="col.prop" 
          :label="col.label" 
          :width="col.width"
          sortable
        ></el-table-column>
      </el-table>
      
      <div class="table-footer">
        <p>显示 {{ filteredData.length }} 行数据，共 {{ excelData.length }} 行</p>
        <el-pagination
          v-if="filteredData.length > 10"
          :current-page="currentPage"
          :page-sizes="[5, 10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredData.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import * as XLSX from 'xlsx';
import { Download, Refresh, FullScreen, Search, Delete, Upload, UploadFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ExcelDropArea from '@/components/Excel/ExcelDropArea.vue';
import { exportToExcel } from '@/utils/excel';

// 引用组件
const excelDropAreaRef = ref();

// 基础状态
const file = ref<File | null>(null);
const excelData = ref<any[]>([]);
const workbook = ref<XLSX.WorkBook | null>(null);
const currentSheet = ref('');
const tableLoading = ref(false);
const tableColumns = ref<{prop: string, label: string, width?: string}[]>([]);
const isDragging = ref(false);

// 拖拽相关方法
const onDragEnter = () => {
  isDragging.value = true;
};

const onDragLeave = (event: DragEvent) => {
  const target = event.relatedTarget as Node;
  if (!target || !event.currentTarget?.contains(target)) {
    isDragging.value = false;
  }
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const droppedFile = files[0];
    if (droppedFile.type.includes('excel') || 
        droppedFile.name.endsWith('.xlsx') || 
        droppedFile.name.endsWith('.xls')) {
      if (excelDropAreaRef.value) {
        const uploadComponent = excelDropAreaRef.value;
        uploadComponent.handleFile(droppedFile);
      }
    } else {
      ElMessage.error('请上传Excel文件（.xlsx或.xls格式）');
    }
  }
};

// 筛选状态
const filterColumn = ref('');
const filterValue = ref('');
const hasFilters = computed(() => filterColumn.value && filterValue.value);

// 分页状态
const currentPage = ref(1);
const pageSize = ref(5); // 默认每页显示5条

// 计算筛选后的数据
const filteredData = computed(() => {
  let data = [...excelData.value];
  
  // 应用筛选
  if (filterColumn.value && filterValue.value) {
    data = data.filter(item => {
      const cellValue = String(item[filterColumn.value] || '').toLowerCase();
      return cellValue.includes(filterValue.value.toLowerCase());
    });
  }
  
  return data;
});

// 计算分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// 处理文件选择
const handleFileSelected = (selectedFile: File) => {
  file.value = selectedFile;
};

// 处理文件解析完成
const handleFileParsed = (data: any[]) => {
  excelData.value = data;
  generateTableColumns(data);
};

// 处理工作表切换
const handleSheetChanged = (sheetName: string, data: any[]) => {
  excelData.value = data;
  generateTableColumns(data);
};

// 处理上传新文件
const handleUploadNew = () => {
  excelData.value = [];
  file.value = null;
  filterColumn.value = '';
  filterValue.value = '';
  currentPage.value = 1;
};

// 生成表格列
const generateTableColumns = (data: any[]) => {
  if (!data || data.length === 0) {
    tableColumns.value = [];
    return;
  }
  
  const firstRow = data[0];
  const columns = Object.keys(firstRow).map(key => ({
    prop: key,
    label: key,
    width: key.length > 15 ? '180px' : key.length > 8 ? '150px' : '120px'
  }));
  
  tableColumns.value = columns;
};

// 切换工作表
const changeSheet = (sheetName: string) => {
  if (excelDropAreaRef.value) {
    // 使用ExcelDropArea组件的方法
    excelDropAreaRef.value.changeSheet(sheetName);
  }
};

// 刷新数据
const refreshData = () => {
  if (currentSheet.value && workbook.value) {
    changeSheet(currentSheet.value);
  }
};

// 清除筛选
const clearFilters = () => {
  filterColumn.value = '';
  filterValue.value = '';
};

// 应用筛选
const applyFilter = () => {
  if (filterColumn.value && filterValue.value) {
    currentPage.value = 1; // 重置到第一页
  }
};

// 导出Excel
const exportExcel = () => {
  if (!file.value || excelData.value.length === 0) {
    ElMessage.warning('没有数据可导出');
    return;
  }
  
  try {
    const fileName = file.value.name.split('.')[0] + '_processed';
    exportToExcel(filteredData.value, [], fileName);
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出Excel失败:', error);
    ElMessage.error('导出失败，请重试');
  }
};

// 美化并导出Excel
const beautifyAndExport = () => {
  if (!file.value || excelData.value.length === 0) {
    ElMessage.warning('没有数据可导出');
    return;
  }

  try {
    // 计算每列的最大宽度
    const columnWidths = {};
    const data = filteredData.value;
    const columns = tableColumns.value;

    // 初始化列宽度（基于表头）
    columns.forEach(col => {
      columnWidths[col.prop] = col.label.length * 2;
    });

    // 计算每列的最大内容宽度
    data.forEach(row => {
      columns.forEach(col => {
        const cellContent = String(row[col.prop] || '');
        const contentLength = cellContent.length;
        columnWidths[col.prop] = Math.max(columnWidths[col.prop], contentLength * 2);
      });
    });

    // 设置最大和最小宽度限制
    Object.keys(columnWidths).forEach(key => {
      columnWidths[key] = Math.min(Math.max(columnWidths[key], 8), 50);
    });

    const fileName = file.value.name.split('.')[0] + '_beautified';
    exportToExcel(filteredData.value, [], fileName);
    ElMessage.success('美化导出成功');
  } catch (error) {
    console.error('美化导出Excel失败:', error);
    ElMessage.error('美化导出失败，请重试');
  }
};

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val;
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};

// 监听workbook变化
watch(() => excelDropAreaRef.value?.workbook, (newVal) => {
  if (newVal) {
    workbook.value = newVal;
  }
}, { deep: true });
</script>

<style lang="scss" scoped>
.excel-viewer-container {
  .excel-card {
    margin-bottom: -1px;
    border-radius: 0;
    
    &:first-child {
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
    }
    
    &:last-child {
      margin-bottom: 0;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
}

.excel-card {
  box-shadow: none;
  border: 1px solid #dcdfe6;
  position: relative;
  overflow: hidden;
}

.page-header {
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 10px 0;
    font-size: 24px;
    color: #303133;
  }
  
  .description {
    color: #606266;
    font-size: 14px;
    margin: 0;
  }
}

.excel-card {
  margin-bottom: 0;
  box-shadow: none;
  position: relative;
  overflow: hidden;
  
  &:last-child {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .file-name {
        font-weight: 500;
        color: #303133;
      }
      
      .data-count {
        color: #909399;
        font-size: 14px;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 100;
  
  &.drag-active {
    display: flex;
  }
  
  .drag-content {
    text-align: center;
    
    .drag-icon {
      font-size: 48px;
      color: #409eff;
      margin-bottom: 16px;
    }
    
    h3 {
      color: #303133;
      margin: 0;
      font-size: 18px;
    }
  }
}

.sheet-selector {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-container {
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.table-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  p {
    margin: 0;
    color: #606266;
    font-size: 14px;
  }
}
</style>