<template>
  <div class="single-test-container">
    <div class="main-content">
      <!-- 左侧输入区 -->
      <div class="input-panel">
        <el-card class="input-card">
          <!-- 单个测试模式 -->
          <json-input
              v-if="!isBatchMode"
              class="json-input-container"
              v-model="testConfig.input"
              :rows="15"
              @stats-updated="handleJsonStatsUpdate"
              title="请求数据"
            />

            <excel-column-selector
              v-else
              class="excel-selector-container"
              @select="handleExcelDataSelect"
            />
        </el-card>
      </div>
      
      <!-- 右侧配置区 -->
      <div class="config-panel">
        <el-card class="config-card">
          <template #header>
            <div class="panel-header">
                <span class="panel-title">测试配置</span>
            </div>
          </template>

          <el-form :model="testConfig" label-position="top">
            <!-- 测试模式选择 -->
            <div class="mode-selection">
              <h4>测试模式</h4>
              <el-select v-model="testMode" placeholder="请选择测试模式" @change="handleModeChange" class="mode-select">
                <el-option label="单个测试" value="single" />
                <el-option label="批量测试" value="batch" />
              </el-select>
            </div>
            
            <!-- 服务选择区域 -->
            <div class="services-selection">
              <h4>选择测试服务</h4>
              <div class="services-container">
                <el-checkbox-group v-model="selectedServices">
                  <el-checkbox 
                    v-for="service in availableServices" 
                    :key="service.value" 
                    :label="service.value"
                  >
                    {{ service.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </el-form>

          <div class="action-buttons">
            <el-button 
              type="primary" 
              @click="handleTest" 
              :disabled="!canTest"
              :loading="isTestRunning"
            >
              <el-icon><VideoPlay /></el-icon>开始测试
            </el-button>
            <el-button @click="toggleResultDrawer">
              <el-icon><DataLine /></el-icon>查看结果
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 测试结果组件 -->
    <test-result-viewer
      :results="results"
      v-model:visible="resultDrawerVisible"
      drawer-size="70%"
      @export-complete="handleExportComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay, DataLine } from '@element-plus/icons-vue'
import JsonInput from '@/components/Json/JsonInput.vue'
import ExcelColumnSelector from '@/components/Excel/ExcelColumnSelector.vue'
import TestResultViewer from '@/components/TestResult/TestResultViewer.vue'
import { useMicroService } from '@/composables/useMicroService'
import { useTestResultUtils } from '@/composables/useTestResultUtils'

// 微服务相关
const { services, getServiceByName } = useMicroService()

// 测试结果工具
const { generateResultId } = useTestResultUtils()

// 测试配置
const testMode = ref('single') // 'single' | 'batch'
const isBatchMode = computed(() => testMode.value === 'batch')
const testConfig = ref({
  input: '',
})

// 服务选择
const availableServices = computed(() => {
  return services.map(service => ({
    label: service.name,
    value: service.name
  }))
})

const selectedServices = ref<ServiceName[]>(['Direct'])

// 批量测试相关
const batchData = ref<Array<string | number | null>>([])
const batchConfig = ref({
  sheetName: '',
  columnName: '',
})

// 测试结果
const results = ref<Array<TestResult>>([])
const resultDrawerVisible = ref(false)
const isTestRunning = ref(false)

// 计算属性
const canTest = computed(() => {
  if (selectedServices.value.length === 0) return false
  
  if (isBatchMode.value) {
    return batchData.value.length > 0
  } else {
    return !!testConfig.value.input.trim()
  }
})

// 方法
function handleModeChange() {
  // 切换模式时重置相关状态
  if (testMode.value === 'batch') {
    testConfig.value.input = ''
  } else {
    batchData.value = []
    batchConfig.value = {
      sheetName: '',
      columnName: ''
    }
  }
}

function handleJsonStatsUpdate(stats: any) {
  // 可以根据需要处理JSON统计信息
  console.log('JSON stats updated:', stats)
}

function handleExcelDataSelect(data: any) {
  batchData.value = data.data
  batchConfig.value = {
    sheetName: data.sheet,
    columnName: data.column
  }
  ElMessage.success(`已选择工作表「${data.sheet}」中的「${data.column}」列，共 ${data.data.length} 条数据`)
}

async function handleTest() {
  if (!canTest.value) return
  
  if (selectedServices.value.length === 0) {
    ElMessage.warning('请至少选择一个测试服务')
    return
  }
  
  isTestRunning.value = true
  
  try {
    if (isBatchMode.value) {
      await runBatchTest()
    } else {
      await runSingleTest()
    }
    
    // 测试完成后自动打开结果抽屉
    resultDrawerVisible.value = true
  } catch (error) {
    console.error('测试执行错误:', error)
    ElMessage.error('测试执行失败，请检查输入和网络连接')
  } finally {
    isTestRunning.value = false
  }
}

async function runSingleTest() {
  const input = testConfig.value.input
  console.log('单个测试输入数据类型:', typeof input)
  console.log('单个测试输入数据内容:', input)
  
  // 并行执行所有选中的服务
  const testPromises = selectedServices.value.map(async (serviceName) => {
    const service = getServiceByName(serviceName)
    console.log('使用服务:', service.name)
    const startTime = Date.now()
    
    try {
      console.log('发送请求前的输入数据:', input)
      const response = await service.api(input)
      console.log('请求响应:', response)
      const duration = Date.now() - startTime
      
      // 添加到结果列表
      results.value.push({
        id: generateResultId(),
        input: testConfig.value.input,
        service: serviceName,
        output: response.data,
        duration,
        timestamp: new Date().toISOString()
      })
    } catch (error:any) {
      console.error('单个测试错误:', error)
      console.error('错误详情:', error.response ? error.response.data : '无响应数据')
      const duration = Date.now() - startTime
      
      // 添加错误结果
      results.value.push({
        id: generateResultId(),
        input: testConfig.value.input,
        service: serviceName,
        output: `错误: ${error.message || '未知错误'}`,
        duration,
        timestamp: new Date().toISOString()
      })
    }
  })
  
  await Promise.all(testPromises)
  ElMessage.success(`测试完成，共执行 ${testPromises.length} 个服务`)
}

async function runBatchTest() {
  if (batchData.value.length === 0) return
  
  const totalTests = batchData.value.length * selectedServices.value.length
  let completedTests = 0
  
  // 批量测试可能数量较大，先确认
  try {
    await ElMessageBox.confirm(
      `将对 ${batchData.value.length} 条数据执行 ${selectedServices.value.length} 个服务测试，共 ${totalTests} 次调用，是否继续？`,
      '批量测试确认',
      {
        confirmButtonText: '开始测试',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (e) {
    return // 用户取消
  }
  
  // 执行批量测试
  for (const item of batchData.value) {
    if (!item) continue // 跳过空值
    
    const input = String(item)
    console.log('批量测试输入数据类型:', typeof input)
    console.log('批量测试输入数据内容:', input)
    
    // 并行执行所有选中的服务
    const testPromises = selectedServices.value.map(async (serviceName) => {
      const service = getServiceByName(serviceName)
      console.log('使用服务:', service.name)
      const startTime = Date.now()
      
      try {
        console.log('发送请求前的输入数据:', input)
        const response = await service.api(input)
        console.log('请求响应:', response)
        const duration = Date.now() - startTime
        
        // 添加到结果列表
        results.value.push({
          id: generateResultId(),
          input,
          service: serviceName,
          output: response.data,
          duration,
          timestamp: new Date().toISOString()
        })
      } catch (error:any) {
        console.error('批量测试错误:', error)
        console.error('错误详情:', error.response ? error.response.data : '无响应数据')
        const duration = Date.now() - startTime
        
        // 添加错误结果
        results.value.push({
          id: generateResultId(),
          input,
          service: serviceName,
          output: `错误: ${error.message || '未知错误'}`,
          duration,
          timestamp: new Date().toISOString()
        })
      } finally {
        completedTests++
      }
    })
    
    await Promise.all(testPromises)
  }
  
  ElMessage.success(`批量测试完成，共执行 ${completedTests} 次测试`)
}

function toggleResultDrawer() {
  resultDrawerVisible.value = !resultDrawerVisible.value
}

function handleExportComplete(success: boolean) {
  if (success) {
    ElMessage.success('测试结果导出成功')
  }
}

// 生命周期钩子
onMounted(() => {
  // 初始化操作
})
</script>

<style scoped lang="scss">
.single-test-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 85vh;
}

.main-content {
  display: flex;
  overflow: hidden;
  gap: 20px;
}

.input-panel {
  flex: 1;
  min-width: 0; /* 防止子元素溢出 */
  height: 85vh;
  overflow: hidden;
}

.config-panel {
  width: 520px;
  height: 100%;
  overflow: hidden;
}

.input-card,
.config-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
  border-radius: 8px;
  
  :deep(.el-card__body) {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
}

.json-input-container,
.excel-selector-container {
  height: 100%;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .panel-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.mode-selection,
.services-selection {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  
  h4 {
    margin-top: 0;
    margin-bottom: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-size: 16px;
  }
}

.mode-select {
  width: 80%;
}

.services-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: auto;
  padding-top: 24px;
  
  .el-button {
    padding: 12px 24px;
    font-size: 16px;
    min-width: 140px;
  }
}

// 响应式设计
@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .input-panel,
  .config-panel {
    width: 100%;
    height: auto;
  }
  
  .input-panel {
    flex: none;
    height: 50%;
  }
  
  .config-panel {
    height: 50%;
  }
}

@media (max-width: 768px) {
  .single-test-container {
    padding: 12px;
  }
  
  .panel-header  {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-buttons .el-button {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style>