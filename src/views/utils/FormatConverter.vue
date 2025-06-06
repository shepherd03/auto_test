<template>
  <div class="format-converter-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>格式转换器</span>
        </div>
      </template>
      
      <el-form :model="formData" label-width="120px">
        <!-- 转换类型选择 -->
        <el-form-item label="转换类型">
          <el-select v-model="formData.converterType" placeholder="请选择转换类型" @change="handleConverterTypeChange">
            <el-option label="NLU-用户对话" value="nlu-user" />
            <!-- 可以在此处添加更多转换类型 -->
          </el-select>
        </el-form-item>
        
        <!-- Excel文件上传 -->
        <el-form-item label="上传Excel文件">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            :file-list="fileList"
            accept=".xlsx,.xls"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                请上传Excel文件(.xlsx, .xls)
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <!-- 选择工作表 -->
        <el-form-item label="选择工作表" v-if="sheetNames.length > 0">
          <el-select v-model="formData.sheetName" placeholder="请选择工作表" @change="handleSheetChange">
            <el-option 
              v-for="sheet in sheetNames" 
              :key="sheet" 
              :label="sheet" 
              :value="sheet" 
            />
          </el-select>
        </el-form-item>
        
        <!-- 选择处理列 -->
        <el-form-item label="选择处理列" v-if="columns.length > 0">
          <el-select v-model="formData.columnIndex" placeholder="请选择要处理的列" @change="handleColumnChange">
            <el-option 
              v-for="(col, index) in columns" 
              :key="index" 
              :label="col" 
              :value="index" 
            />
          </el-select>
        </el-form-item>
        
        <!-- 选择行范围 -->
        <el-form-item label="选择行范围" v-if="formData.columnIndex >= 0">
          <div class="row-range-selector">
            <el-input-number 
              v-model="formData.rowRange.start" 
              :min="1" 
              :max="totalRows" 
              placeholder="起始行"
              @change="validateRowRange"
            />
            <span class="range-separator">至</span>
            <el-input-number 
              v-model="formData.rowRange.end" 
              :min="formData.rowRange.start" 
              :max="totalRows" 
              placeholder="结束行"
              @change="validateRowRange"
            />
            <el-button type="primary" size="small" @click="selectAllRows">全选</el-button>
          </div>
        </el-form-item>
        
        <!-- 转换按钮 -->
        <el-form-item>
          <el-button type="primary" @click="convertData" :disabled="!canConvert">转换数据</el-button>
          <el-button type="success" @click="downloadResult" :disabled="!convertedData.length">下载结果</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 转换结果预览 -->
      <div v-if="convertedData.length > 0" class="preview-section">
        <h3>转换结果预览</h3>
        <el-divider />
        <div class="json-preview">
          <pre>{{ previewData }}</pre>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import * as XLSX from 'xlsx'

// 定义类型
interface FormData {
  converterType: string;
  sheetName: string;
  columnIndex: number;
  rowRange: {
    start: number;
    end: number;
  };
}

interface ExcelRow {
  [key: number]: any;
}

interface ConvertedItem {
  origin_slot: any;
  last_slot: any;
  [key: string]: any;
}

// 定义表单数据
const formData = reactive<FormData>({
  converterType: 'nlu-user',
  sheetName: '',
  columnIndex: -1,
  rowRange: {
    start: 1,
    end: 9999
  }
})

// 文件上传相关
const fileList = ref<any[]>([])
const excelData = ref<XLSX.WorkBook | null>(null)
const sheetNames = ref<string[]>([])
const columns = ref<string[]>([])
const rawData = ref<ExcelRow[]>([])
const convertedData = ref<ConvertedItem[]>([])
const totalRows = ref<number>(0)

// 计算属性：是否可以进行转换
const canConvert = computed(() => {
  return excelData.value && 
         formData.sheetName && 
         formData.columnIndex >= 0
})

// 计算属性：预览数据
const previewData = computed(() => {
  if (convertedData.value.length === 0) return ''
  // 只显示第一条数据作为预览
  return JSON.stringify(convertedData.value[0], null, 2)
})

// 处理转换类型变化
const handleConverterTypeChange = () => {
  // 重置相关数据
  fileList.value = []
  excelData.value = null
  sheetNames.value = []
  columns.value = []
  rawData.value = []
  convertedData.value = []
  formData.sheetName = ''
  formData.columnIndex = -1
}

// 处理文件变化
const handleFileChange = (file) => {
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      
      // 保存Excel数据
      excelData.value = workbook
      
      // 获取所有工作表名称
      sheetNames.value = workbook.SheetNames
      
      // 如果只有一个工作表，自动选择
      if (sheetNames.value.length === 1) {
        formData.sheetName = sheetNames.value[0]
        handleSheetChange()
      }
      
      ElMessage.success('Excel文件加载成功')
    } catch (error) {
      console.error('Excel文件解析失败:', error)
      ElMessage.error('Excel文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

// 处理工作表变化
const handleSheetChange = () => {
  if (!excelData.value || !formData.sheetName) return
  
  try {
    // 获取选中工作表的数据
    const worksheet = excelData.value.Sheets[formData.sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // 保存原始数据
    rawData.value = data.slice(1) // 跳过表头
    totalRows.value = rawData.value.length
    
    // 获取列名（表头）
    if (data.length > 0) {
      columns.value = data[0]
    }
    
    // 重置列选择
    formData.columnIndex = -1
    
    // 重置行范围选择
    resetRowRange()
    
    ElMessage.success('工作表加载成功')
  } catch (error) {
    console.error('工作表解析失败:', error)
    ElMessage.error('工作表解析失败，请检查数据格式')
  }
}

// 处理列变化
const handleColumnChange = () => {
  // 重置行范围为默认值
  resetRowRange()
}

// 重置行范围
const resetRowRange = () => {
  formData.rowRange.start = 1
  formData.rowRange.end = totalRows.value > 0 ? totalRows.value : 9999
}

// 验证行范围
const validateRowRange = () => {
  // 确保开始行不大于结束行
  if (formData.rowRange.start > formData.rowRange.end) {
    formData.rowRange.end = formData.rowRange.start
  }
  
  // 确保不超出数据范围
  if (formData.rowRange.end > totalRows.value) {
    formData.rowRange.end = totalRows.value
  }
}

// 选择所有行
const selectAllRows = () => {
  formData.rowRange.start = 1
  formData.rowRange.end = totalRows.value
}

// 转换数据
const convertData = () => {
  if (!canConvert.value) return
  
  try {
    // 清空之前的转换结果
    convertedData.value = []
    
    // 获取选中行范围的数据
    const startIdx = formData.rowRange.start - 1 // 因为数组索引从0开始，而行号从1开始
    const endIdx = formData.rowRange.end - 1
    
    // 确保索引在有效范围内
    const validStartIdx = Math.max(0, startIdx)
    const validEndIdx = Math.min(rawData.value.length - 1, endIdx)
    
    // 获取指定范围内的数据
    const selectedRows = rawData.value.slice(validStartIdx, validEndIdx + 1)
    const columnData = selectedRows.map(row => row[formData.columnIndex])
    
    // 根据转换类型进行不同的转换
    switch (formData.converterType) {
      case 'nlu-user':
        convertedData.value = convertNluToUser(columnData)
        break
      // 可以添加更多转换类型
      default:
        ElMessage.warning('未知的转换类型')
        return
    }
    
    ElMessage.success(`成功转换 ${convertedData.value.length} 条数据`)
  } catch (error) {
    console.error('数据转换失败:', error)
    ElMessage.error('数据转换失败，请检查数据格式')
  }
}

// NLU到用户对话格式的转换
const convertNluToUser = (columnData) => {
  const result = []
  
  for (const item of columnData) {
    try {
      // 解析JSON字符串
      let data = typeof item === 'string' ? JSON.parse(item) : item
      
      // 检查是否有predResult字段
      if (!data || !data.predResult) {
        console.warn('数据格式不正确，跳过:', item)
        continue
      }
      
      // 创建新的格式
      const converted = {
        origin_slot: data.predResult,
        last_slot: JSON.parse(JSON.stringify(data.predResult)) // 深拷贝
      }
      
      result.push(converted)
    } catch (error) {
      console.error('转换单条数据失败:', error, item)
      // 继续处理下一条数据
    }
  }
  
  return result
}

// 下载转换结果
const downloadResult = () => {
  if (convertedData.value.length === 0) return
  
  try {
    // 创建工作簿和工作表
    const workbook = XLSX.utils.book_new()
    
    // 将JSON数据转换为工作表
    const worksheet = XLSX.utils.json_to_sheet(
      convertedData.value.map(item => ({
        data: JSON.stringify(item)
      }))
    )
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ConvertedData')
    
    // 下载Excel文件
    XLSX.writeFile(workbook, `${formData.converterType}_converted_data.xlsx`)
    
    ElMessage.success('转换结果已下载')
  } catch (error) {
    console.error('下载结果失败:', error)
    ElMessage.error('下载结果失败，请稍后重试')
  }
}
</script>

<style lang="scss" scoped>
.format-converter-container {
  padding: 20px;
  
  &__header {
    display: flex;
    align-items: center;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-section {
  margin-top: 20px;
}

.json-preview {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow: auto;
  
  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.row-range-selector {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .range-separator {
    margin: 0 5px;
  }
}
</style>