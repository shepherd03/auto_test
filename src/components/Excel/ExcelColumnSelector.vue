<template>
  <div class="excel-column-selector">
    <!-- 上传区域 -->
    <div v-if="!fileLoaded" class="upload-area">
      <el-upload
        class="upload-excel"
        drag
        action=""
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
        :disabled="isLoading"
      >
        <el-icon v-if="isLoading" class="upload-icon is-loading"><loading /></el-icon>
        <el-icon v-else class="upload-icon"><upload-filled /></el-icon>
        <div class="upload-text">
          <span>{{ isLoading ? '正在解析文件...' : '拖拽Excel文件到此处或点击上传' }}</span>
          <div v-if="!isLoading" class="upload-tip">支持 .xlsx, .xls 格式</div>
        </div>
      </el-upload>
    </div>

    <!-- 详情界面 -->
    <div v-else class="detail-area">
      <div class="detail-container">
        <!-- 左侧：文件详情和选择区域 -->
        <div class="left-panel">
          <h3>文件详情</h3>
          <div class="file-info">
            <p><strong>文件名：</strong>{{ fileName }}</p>
            <p><strong>大小：</strong>{{ fileSize }}</p>
          </div>

          <el-divider></el-divider>

          <div class="select-area">
            <el-form label-position="top">
              <el-form-item label="选择工作表">
                <el-select v-model="selectedSheet" placeholder="请选择工作表" @change="handleSheetChange">
                  <el-option 
                    v-for="sheet in sheetList" 
                    :key="sheet" 
                    :label="sheet" 
                    :value="sheet">
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="选择数据列">
                <el-select v-model="selectedColumn" placeholder="请选择数据列" @change="handleColumnChange">
                  <el-option 
                    v-for="column in columnList" 
                    :key="column" 
                    :label="column" 
                    :value="column">
                  </el-option>
                </el-select>
              </el-form-item>

              <el-form-item label="选择模式">
                <el-select v-model="selectionMode" placeholder="请选择模式" @change="handleSelectionModeChange">
                  <el-option label="行选择" value="range"></el-option>
                  <el-option label="随机选择" value="random"></el-option>
                </el-select>
              </el-form-item>

              <el-form-item v-if="selectionMode === 'range'" label="选择行范围">
                <el-row :gutter="10">
                  <el-col :span="11">
                    <el-input-number 
                      v-model="startRow" 
                      :min="1" 
                      :max="endRow" 
                      @change="handleRowRangeChange">
                    </el-input-number>
                  </el-col>
                  <el-col :span="2" class="text-center">至</el-col>
                  <el-col :span="11">
                    <el-input-number 
                      v-model="endRow" 
                      :min="startRow" 
                      :max="maxRow" 
                      @change="handleRowRangeChange">
                    </el-input-number>
                  </el-col>
                </el-row>
              </el-form-item>

              <el-form-item v-if="selectionMode === 'random'" label="随机数量">
                <el-input-number 
                  v-model="randomCount" 
                  :min="1" 
                  :max="maxRow - 1" 
                  @change="handleRandomCountChange">
                </el-input-number>
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- 右侧：数据预览 -->
        <div class="right-panel">
          <h3>数据预览</h3>
          <div class="data-preview">
            <el-table 
              v-if="previewData.length > 0"
              :data="previewData" 
              border 
              height="100%"
              style="width: 100%"
              :max-height="'100%'"
              :row-class-name="rowClassName">
              <el-table-column 
                v-for="(col, index) in previewColumns" 
                :key="index"
                :prop="col.prop"
                :label="col.label"
                :width="col.width">
              </el-table-column>
            </el-table>
            <el-empty 
              v-else-if="selectedSheet && selectedColumn" 
              description="没有可显示的数据" 
              :image-size="100">
            </el-empty>
            <el-empty 
              v-else 
              description="请选择工作表和数据列查看预览" 
              :image-size="100">
            </el-empty>
          </div>
        </div>
      </div>
      
      <!-- 底部操作按钮 -->
      <div class="action-footer">
        <el-button @click="resetFile" size="large" class="action-button">
          <el-icon class="el-icon--left"><refresh /></el-icon>
          重新选择文件
        </el-button>
        <el-button type="primary" @click="confirmSelection" size="large" class="action-button">
          <el-icon class="el-icon--left"><check /></el-icon>
          确认选择
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineEmits } from 'vue'
import * as XLSX from 'xlsx'
import { UploadFilled, Loading, Refresh, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface PreviewColumn {
  prop: string
  label: string
  width?: string
}

interface PreviewRow {
  index: number
  value: string | number | null
}

interface SelectedData {
  sheet: string
  column: string
  startRow: number
  endRow: number
  data: Array<string | number | null>
}

interface UploadFile {
  name: string
  size: number
  raw: File
}

type ExcelData = Array<Array<string | number | null>>

const emit = defineEmits<{
    (e: 'select', data: SelectedData): void
}>()

// 文件状态
const fileLoaded = ref(false)
const fileName = ref('')
const fileSize = ref('')
const excelFile = ref<File | null>(null)
const workbook = ref<XLSX.WorkBook | null>(null)
const isLoading = ref(false)

// 选择状态
const sheetList = ref<string[]>([])
const selectedSheet = ref('')
const columnList = ref<string[]>([])
const selectedColumn = ref('')
const selectionMode = ref<'range'|'random'>('range') // 新增：选择模式，默认为行选择
const startRow = ref(1)
const endRow = ref(1)
const maxRow = ref(1)
const randomCount = ref(10) // 新增：随机选择数量

// 预览数据
const previewData = ref<PreviewRow[]>([])
const previewColumns = ref<PreviewColumn[]>([])

// 处理文件上传
const handleFileChange = (file: UploadFile) => {
  if (!file) return
  
  const isExcel = /\.(xlsx|xls)$/i.test(file.name)
  if (!isExcel) {
    ElMessage.error('请上传Excel文件(.xlsx, .xls)')
    return
  }

  isLoading.value = true
  excelFile.value = file.raw
  fileName.value = file.name
  fileSize.value = formatFileSize(file.size)

  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    try {
      const data = e.target?.result as ArrayBuffer
      workbook.value = XLSX.read(data, { type: 'array' })
      sheetList.value = workbook.value.SheetNames
      
      if (sheetList.value.length > 0) {
        selectedSheet.value = sheetList.value[0]
        loadSheetColumns(selectedSheet.value)
      }
      
      fileLoaded.value = true
      isLoading.value = false
    } catch (error) {
      ElMessage.error('解析Excel文件失败')
      console.error('解析Excel文件失败:', error)
      isLoading.value = false
    }
  }
  
  reader.onerror = () => {
    ElMessage.error('读取文件时发生错误')
    isLoading.value = false
  }
  
  reader.readAsArrayBuffer(file.raw)
}

// 加载工作表列
const loadSheetColumns = (sheetName: string) => {
  if (!workbook.value) return
  
  const worksheet = workbook.value.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as ExcelData
  
  if (data.length > 0 && Array.isArray(data[0])) {
    columnList.value = data[0].map((col, index: number) => {
      return col ? String(col) : `列${index + 1}`
    })
    
    maxRow.value = data.length
    endRow.value = maxRow.value
    
    if (columnList.value.length > 0) {
      selectedColumn.value = columnList.value[0]
      updatePreview()
    }
  } else {
    columnList.value = []
    previewData.value = []
    previewColumns.value = []
  }
}

// 处理工作表变更
const handleSheetChange = () => {
  loadSheetColumns(selectedSheet.value)
}

// 处理列变更
const handleColumnChange = () => {
  updatePreview()
}

// 处理行范围变更
const handleRowRangeChange = () => {
  updatePreview()
}

// 处理选择模式变更
const handleSelectionModeChange = () => {
  updatePreview()
}

// 处理随机数量变更
const handleRandomCountChange = () => {
  updatePreview()
}

// 更新预览数据
const updatePreview = () => {
  if (!workbook.value || !selectedSheet.value || !selectedColumn.value) {
    previewData.value = []
    previewColumns.value = []
    return
  }
  
  const worksheet = workbook.value.Sheets[selectedSheet.value]
  const fullData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as ExcelData
  
  if (fullData.length === 0) return
  
  const headers = fullData[0] as Array<string | number | null>
  const columnIndex = headers.findIndex((h) => 
    h && String(h) === selectedColumn.value
  )
  
  if (columnIndex === -1) return
  
  // 准备表格列
  previewColumns.value = [
    { prop: 'index', label: '行号', width: '80px' },
    { prop: 'value', label: selectedColumn.value }
  ]
  
  previewData.value = []
  
  if (selectionMode.value === 'range') {
    // 行范围选择模式
    const start = Math.max(startRow.value, 1)
    const end = Math.min(endRow.value, fullData.length)
    
    for (let i = start; i <= end; i++) {
      if (i >= fullData.length) break
      
      const row = fullData[i]
      if (row && columnIndex < row.length) {
        previewData.value.push({
          index: i,
          value: row[columnIndex]
        })
      }
    }
  } else if (selectionMode.value === 'random') {
    // 随机选择模式
    const availableRows = []
    for (let i = 1; i < fullData.length; i++) { // 从第2行开始（跳过标题行）
      const row = fullData[i]
      if (row && columnIndex < row.length) {
        availableRows.push({ index: i, value: row[columnIndex] })
      }
    }
    
    // 随机选择指定数量的行
    const count = Math.min(randomCount.value, availableRows.length)
    const shuffled = [...availableRows].sort(() => 0.5 - Math.random())
    previewData.value = shuffled.slice(0, count).sort((a, b) => a.index - b.index)
  }
}

// 重置文件
const resetFile = () => {
  fileLoaded.value = false
  fileName.value = ''
  fileSize.value = ''
  excelFile.value = null
  workbook.value = null
  sheetList.value = []
  selectedSheet.value = ''
  columnList.value = []
  selectedColumn.value = ''
  selectionMode.value = 'range' // 重置选择模式为默认值
  startRow.value = 1
  endRow.value = 1
  maxRow.value = 1
  randomCount.value = 10 // 重置随机数量为默认值
  previewData.value = []
  previewColumns.value = []
  isLoading.value = false
}

// 确认选择
const confirmSelection = () => {
  if (!workbook.value || !selectedSheet.value || !selectedColumn.value) {
    ElMessage.warning('请完成所有选择')
    return
  }
  
  try {
    const worksheet = workbook.value.Sheets[selectedSheet.value]
    const fullData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as ExcelData
    
    if (fullData.length === 0) {
      ElMessage.warning('所选工作表没有数据')
      return
    }
    
    const headers = fullData[0] as Array<string | number | null>
    const columnIndex = headers.findIndex((h) => 
      h && String(h) === selectedColumn.value
    )
    
    if (columnIndex === -1) {
      ElMessage.warning('无法找到所选列')
      return
    }
    
    let selectedData: Array<string | number | null> = []
    
    if (selectionMode.value === 'range') {
      // 行范围选择模式
      const start = Math.max(startRow.value, 1)
      const end = Math.min(endRow.value, fullData.length)
      
      for (let i = start; i <= end; i++) {
        if (i >= fullData.length) break
        
        const row = fullData[i]
        if (row && columnIndex < row.length) {
          selectedData.push(row[columnIndex])
        }
      }
    } else if (selectionMode.value === 'random') {
      // 随机选择模式 - 直接使用预览数据中的值
      selectedData = previewData.value.map(item => item.value)
    }
    
    if (selectedData.length === 0) {
      ElMessage.warning('所选范围内没有数据')
      return
    }
    
    // 发送选择结果
    emit('select', {
      sheet: selectedSheet.value,
      column: selectedColumn.value,
      startRow: selectionMode.value === 'range' ? startRow.value : -1, // 随机模式时使用-1表示
      endRow: selectionMode.value === 'range' ? endRow.value : -1,
      data: selectedData
    })
    
    ElMessage.success(`已成功选择 ${selectedData.length} 条数据`)
  } catch (error) {
    console.error('确认选择时发生错误:', error)
    ElMessage.error('处理数据时发生错误')
  }
}

// 表格行样式
const rowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style lang="scss" scoped>
.excel-column-selector {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden; /* 确保内容不会溢出 */
}

.upload-area {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .upload-excel {
    width: 100%;
    height: 100%;
    
    :deep(.el-upload) {
      width: 100%;
      height: 100%;
    }
    
    :deep(.el-upload-dragger) {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      border: 2px dashed var(--el-border-color);
      transition: all 0.3s;
      
      &:hover {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
      }
    }
  }
  
  .upload-icon {
    font-size: 56px;
    color: var(--el-color-primary);
    margin-bottom: 20px;
    
    &.is-loading {
      animation: rotating 2s linear infinite;
    }
  }
  
  @keyframes rotating {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  
  .upload-text {
    text-align: center;
    color: var(--el-text-color-regular);
    font-size: 18px;
    
    .upload-tip {
      margin-top: 12px;
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }
}

.detail-area {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .detail-container {
      width: 100%;
      flex: 1;
      display: flex;
      overflow: hidden;
      max-height: calc(100% - 60px); /* 减去底部操作按钮的高度 */
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
      
      .left-panel, .right-panel {
        padding: 16px;
        overflow: auto;
        display: flex;
        flex-direction: column;
      }
      
      .left-panel {
        width: 45%;
        border-right: 1px solid var(--el-border-color-light);
        background-color: var(--el-fill-color-blank);
        overflow-y: auto;
        
        @media (max-width: 768px) {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid var(--el-border-color-light);
          max-height: 45%;
        }
        
        .file-info {
          margin-top: 12px;
          padding: 10px;
          background-color: var(--el-fill-color-light);
          border-radius: 6px;
          
          p {
            margin: 6px 0;
            font-size: 14px;
          }
        }
        
        .select-area {
          flex: 1;
          margin-top: 12px;
          overflow-y: auto;
        }
      }
      
      .right-panel {
        width: 60%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        
        @media (max-width: 768px) {
          width: 100%;
          max-height: 45%;
        }
        
        .data-preview {
          margin-top: 12px;
          flex: 1;
          overflow: hidden;
          border-radius: 6px;
          border: 1px solid var(--el-border-color-light);
          display: flex;
          flex-direction: column;
        }
      }
    
    h3 {
      margin: 0;
      padding-bottom: 16px;
      color: var(--el-text-color-primary);
      font-weight: 600;
      font-size: 18px;
    }
  }
  
  .action-footer {
    padding: 12px 16px;
    display: flex;
    justify-content: center;
    gap: 20px;
    border-top: 1px solid var(--el-border-color-light);
    background-color: var(--el-fill-color-blank);
    min-height: 60px; /* 固定高度，防止撑开 */
    
    .action-button {
      min-width: 120px;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

.text-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.even-row) {
  background-color: var(--el-fill-color-light);
}

:deep(.odd-row) {
  background-color: var(--el-fill-color-blank);
}

:deep(.el-table) {
  --el-table-border-color: var(--el-border-color-lighter);
  --el-table-header-bg-color: var(--el-color-primary-light-9);
  --el-table-header-text-color: var(--el-color-primary-dark-2);
  flex: 1;
  
  .el-table__header th {
    font-weight: 600;
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-select) {
  width: 100%;
}
</style>